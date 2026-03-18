import { describe, expect, test } from "bun:test";

import { createFetchFromHttpHelper } from "../../src/services/httpHelpers";
import { ensureSuccess, DEFAULT_ERROR_PREFIX } from "../../src/services/shared";

describe("createFetchFromHttpHelper", () => {
  test("prefers upstream response status and body from n8n httpRequest errors", async () => {
    const httpHelper = async () => {
      throw {
        statusCode: 500,
        message: "Request failed with status code 400",
        response: {
          statusCode: 400,
          statusMessage: "Bad Request",
          body: {
            error: "validation_fault",
            error_description: "Validation failed",
            request_id: "req-123",
          },
        },
      };
    };

    const fetchImpl = createFetchFromHttpHelper(httpHelper as any);
    const response = await fetchImpl("https://api.example.com/test");

    expect(response.status).toBe(400);
    expect(response.statusText).toBe("Bad Request");
    expect(response.headers.get("content-type")).toBe("application/json");

    await expect(ensureSuccess(response)).rejects.toThrow(
      `${DEFAULT_ERROR_PREFIX} (400 Bad Request): Validation failed | Error ID: validation_fault | Request ID: req-123`,
    );
  });

  test("supports axios-style error responses from n8n httpRequest", async () => {
    const httpHelper = async () => {
      throw {
        statusCode: 500,
        message: "Request failed with status code 400",
        response: {
          status: 400,
          statusText: "Bad Request",
          data: {
            error: "validation_fault",
            error_description: "Validation failed",
            request_id: "req-456",
          },
          headers: {},
        },
      };
    };

    const fetchImpl = createFetchFromHttpHelper(httpHelper as any);
    const response = await fetchImpl("https://api.example.com/test");

    expect(response.status).toBe(400);
    expect(response.statusText).toBe("Bad Request");
    expect(response.headers.get("content-type")).toBe("application/json");

    await expect(ensureSuccess(response)).rejects.toThrow(
      `${DEFAULT_ERROR_PREFIX} (400 Bad Request): Validation failed | Error ID: validation_fault | Request ID: req-456`,
    );
  });

  test("does not synthesize JSON content-type for binary bodies", async () => {
    const httpHelper = async () => ({
      body: new Uint8Array([1, 2, 3, 4]),
      statusCode: 200,
      statusMessage: "OK",
      headers: {},
    });

    const fetchImpl = createFetchFromHttpHelper(httpHelper as any);
    const response = await fetchImpl("https://api.example.com/test");

    expect(response.headers.get("content-type")).toBeNull();
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([
      1, 2, 3, 4,
    ]);
  });

  test("keeps generic transport errors generic when no structured response is available", async () => {
    const httpHelper = async () => {
      throw {
        statusCode: 500,
        message: "Request failed with status code 400",
      };
    };

    const fetchImpl = createFetchFromHttpHelper(httpHelper as any);
    const response = await fetchImpl("https://api.example.com/test", {
      method: "POST",
      body: '{"name":"test"}',
    });

    expect(response.status).toBe(500);
    expect(response.statusText).toBe("");

    await expect(ensureSuccess(response)).rejects.toThrow(
      `${DEFAULT_ERROR_PREFIX} (500): Request failed with status code 400`,
    );
  });
});
