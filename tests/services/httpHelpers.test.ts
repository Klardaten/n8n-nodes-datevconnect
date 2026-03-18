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

  test("falls back to native fetch when n8n exposes only a generic transport error", async () => {
    const httpHelper = async () => {
      throw {
        statusCode: 500,
        message: "Request failed with status code 400",
      };
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          error: "validation_fault",
          error_description: "Validation failed",
          request_id: "req-999",
        }),
        {
          status: 400,
          statusText: "Bad Request",
          headers: {
            "content-type": "application/json",
          },
        },
      )) as typeof fetch;

    try {
      const fetchImpl = createFetchFromHttpHelper(httpHelper as any);
      const response = await fetchImpl("https://api.example.com/test");

      expect(response.status).toBe(400);
      expect(response.statusText).toBe("Bad Request");

      await expect(ensureSuccess(response)).rejects.toThrow(
        `${DEFAULT_ERROR_PREFIX} (400 Bad Request): Validation failed | Error ID: validation_fault | Request ID: req-999`,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
