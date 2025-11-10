/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, spyOn, test } from "bun:test";
import { IdentityAndAccessManagementClient } from "../../src/services/identityAndAccessManagementClient";

const mockFetch = spyOn(global, "fetch");

function jsonResponse(body: unknown, overrides: Partial<Response> = {}): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    headers: {
      get: (name: string) => (name.toLowerCase() === "content-type" ? "application/json" : null),
    },
    json: async () => body,
    text: async () => JSON.stringify(body),
    ...overrides,
  } as Response;
}

describe("IdentityAndAccessManagementClient", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  test("fetchServiceProviderConfig issues GET request to ServiceProviderConfig endpoint", async () => {
    const payload = { documentationUri: "https://docs.example" };
    mockFetch.mockResolvedValueOnce(jsonResponse(payload));

    const result = await IdentityAndAccessManagementClient.fetchServiceProviderConfig({
      host: "https://localhost:58452",
      token: "token-123",
      clientInstanceId: "instance-abc",
    });

    const [urlArg, init] = mockFetch.mock.calls[0];
    const requestUrl = new URL(String(urlArg));
    expect(requestUrl.pathname).toBe("/datevconnect/iam/v1/ServiceProviderConfig");
    expect(init).toEqual({
      method: "GET",
      headers: {
        Authorization: "Bearer token-123",
        "x-client-instance-id": "instance-abc",
        Accept: "application/json;charset=utf-8",
      },
    });
    expect(result).toEqual(payload);
  });

  test("fetchUsers forwards SCIM query parameters", async () => {
    const payload = { Resources: [{ id: "user-1" }], totalResults: 1 };
    mockFetch.mockResolvedValueOnce(jsonResponse(payload));

    const result = await IdentityAndAccessManagementClient.fetchUsers({
      host: "https://localhost:58452",
      token: "token-123",
      clientInstanceId: "instance-abc",
      filter: 'userName eq "max.mustermann"',
      startIndex: 2,
      count: 50,
      attributes: "id,userName",
    });

    const [urlArg] = mockFetch.mock.calls[0];
    const requestUrl = new URL(String(urlArg));
    expect(requestUrl.pathname).toBe("/datevconnect/iam/v1/Users");
    expect(requestUrl.searchParams.get("filter")).toBe('userName eq "max.mustermann"');
    expect(requestUrl.searchParams.get("startIndex")).toBe("2");
    expect(requestUrl.searchParams.get("count")).toBe("50");
    expect(requestUrl.searchParams.get("attributes")).toBe("id,userName");
    expect(result).toEqual(payload);
  });

  test("createUser falls back to Location header when body is empty", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(undefined, {
        status: 204,
        headers: {
          get: (name: string) => (name === "Location" ? "/iam/v1/Users/123" : null),
        },
        json: undefined,
        text: async () => "",
      }),
    );

    const response = await IdentityAndAccessManagementClient.createUser({
      host: "https://localhost:58452",
      token: "token-123",
      clientInstanceId: "instance-abc",
      user: { userName: "max.mustermann" },
    });

    expect(response).toEqual({
      success: true,
      location: "/iam/v1/Users/123",
    });

    const [, init] = mockFetch.mock.calls[0];
    expect(init).toMatchObject({
      method: "POST",
      headers: expect.objectContaining({
        "content-type": "application/json;charset=utf-8",
      }),
      body: JSON.stringify({ userName: "max.mustermann" }),
    });
  });

  test("deleteGroup resolves with location information", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(undefined, {
        status: 204,
        headers: {
          get: (name: string) => (name === "Link" ? "</iam/v1/Groups/abc>; rel=\"self\"" : null),
        },
        json: undefined,
        text: async () => "",
      }),
    );

    const result = await IdentityAndAccessManagementClient.deleteGroup({
      host: "https://localhost:58452",
      token: "token-123",
      clientInstanceId: "instance-abc",
      groupId: "abc",
    });

    expect(result).toEqual({
      location: "</iam/v1/Groups/abc>; rel=\"self\"",
    });
  });

  test("throws descriptive error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      headers: {
        get: () => "application/json",
      },
      json: async () => ({ message: "Ups, server error" }),
      text: async () => '{"message":"Ups, server error"}',
    } as Response);

    await expect(
      IdentityAndAccessManagementClient.fetchGroups({
        host: "https://localhost:58452",
        token: "token-123",
        clientInstanceId: "instance-abc",
      }),
    ).rejects.toThrow("DATEV IAM request failed (500 Internal Server Error): Ups, server error");
  });
});
