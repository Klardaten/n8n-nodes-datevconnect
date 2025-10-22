import { describe, expect, test } from "bun:test";

import {
  authenticate,
  fetchClients,
  type AuthenticateOptions,
  type FetchClientsOptions,
} from "../../src/services/datevConnectClient";

type FetchCall = {
  url: URL;
  init?: RequestInit;
};

function createJsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

function createFetchMock(
  implementation: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
): typeof fetch {
  const fn = implementation as typeof fetch;
  fn.preconnect = async () => {
    /* no-op for tests */
  };
  return fn;
}

describe("authenticate", () => {
  test("sends credentials and returns authentication token", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return createJsonResponse({ token: "abc123" }, { status: 200 });
    });

    const options: AuthenticateOptions = {
      host: "https://api.example.com",
      email: "user@example.com",
      password: "secret",
      clientInstanceId: "instance-1",
      fetchImpl: fetchMock,
    };

    const response = await authenticate(options);

    expect(response).toEqual({ token: "abc123" });
    expect(calls).toHaveLength(1);

    const [{ url, init }] = calls;
    expect(url.toString()).toBe("https://api.example.com/api/auth/login");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      "content-type": "application/json",
      "x-client-instance-id": "instance-1",
    });
    expect(init?.body).toBeDefined();

    const parsedBody = JSON.parse(String(init?.body));
    expect(parsedBody).toEqual({
      email: "user@example.com",
      password: "secret",
      clientInstanceId: "instance-1",
    });
  });

  test("throws when authentication response does not include a token", async () => {
    const fetchMock = createFetchMock(async () =>
      createJsonResponse({ unexpected: true }, { status: 200 }),
    );

    await expect(
      authenticate({
        host: "https://api.example.com",
        email: "user@example.com",
        password: "secret",
        clientInstanceId: "instance-1",
        fetchImpl: fetchMock,
      }),
    ).rejects.toThrowError(
      "DATEVconnect request failed: Authentication response missing token.",
    );
  });
});

describe("fetchClients", () => {
  test("requests clients using provided paging options", async () => {
    const calls: FetchCall[] = [];

    const fetchMock = createFetchMock(async (input, init) => {
      calls.push({ url: new URL(String(input)), init });
      return createJsonResponse([{ id: 1 }], { status: 200 });
    });

    const options: FetchClientsOptions = {
      host: "https://api.example.com/", // ensure trailing slash is handled
      token: "token-123",
      clientInstanceId: "instance-1",
      top: 10,
      skip: 5,
      fetchImpl: fetchMock,
    };

    const response = await fetchClients(options);

    expect(response).toEqual([{ id: 1 }]);
    expect(calls).toHaveLength(1);

    const [{ url, init }] = calls;
    expect(url.toString()).toBe("https://api.example.com/api/clients?top=10&skip=5");
    expect(init?.method).toBe("GET");
    expect(init?.headers).toMatchObject({
      accept: "application/json",
      authorization: "Bearer token-123",
      "content-type": "application/json",
      "x-client-instance-id": "instance-1",
    });
  });

  test("throws a descriptive error when the API responds with an error", async () => {
    const fetchMock = createFetchMock(async () =>
      createJsonResponse(
        { message: "Something went wrong" },
        {
          status: 401,
          statusText: "Unauthorized",
        },
      ),
    );

    await expect(
      fetchClients({
        host: "https://api.example.com",
        token: "token-123",
        clientInstanceId: "instance-1",
        fetchImpl: fetchMock,
      }),
    ).rejects.toThrowError(
      "DATEVconnect request failed (401 Unauthorized): Something went wrong",
    );
  });
});
