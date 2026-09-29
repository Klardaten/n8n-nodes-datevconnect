import { describe, expect, test } from "bun:test";

import {
  createFetchFromHttpHelper,
  type HttpRequestHelper,
} from "../../src/services/httpHelpers";
import {
  authenticate,
  ensureSuccess,
  DEFAULT_ERROR_PREFIX,
} from "../../src/services/shared";

describe("createFetchFromHttpHelper", () => {
  test("preserves every byte by requesting binary response encoding", async () => {
    const original = Buffer.from(Array.from({ length: 256 }, (_, i) => i));
    const httpHelper: HttpRequestHelper = async (options) => ({
      body:
        options.encoding === "arraybuffer"
          ? original
          : original.toString("utf8"),
      statusCode: 200,
      headers: { "content-type": "application/octet-stream" },
    });

    const response = await createFetchFromHttpHelper(httpHelper)(
      "https://api.example.com/test",
    );
    const downloaded = Buffer.from(await response.arrayBuffer());

    expect(downloaded.byteLength).toBe(original.byteLength);
    expect(downloaded).toEqual(original);
  });

  test("decodes buffer-backed JSON and text with umlauts", async () => {
    const payload = { name: "Müller", description: "Größe ändern" };
    const serialized = JSON.stringify(payload);
    const httpHelper: HttpRequestHelper = async () => ({
      body: Buffer.from(serialized),
      statusCode: 200,
      headers: { "content-type": "application/json;charset=utf-8" },
    });
    const fetchImpl = createFetchFromHttpHelper(httpHelper);

    const jsonResponse = await fetchImpl("https://api.example.com/test");
    expect(await jsonResponse.json()).toEqual(payload);

    const textResponse = await fetchImpl("https://api.example.com/test");
    expect(await textResponse.text()).toBe(serialized);
  });

  test("authenticates with a buffer-backed JSON response", async () => {
    const httpHelper: HttpRequestHelper = async (options) => {
      expect(options.encoding).toBe("arraybuffer");
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body as string)).toEqual({
        email: "test@example.com",
        password: "test-password",
      });
      return {
        body: Buffer.from('{"access_token":"test-token"}'),
        statusCode: 200,
        headers: { "content-type": "application/json" },
      };
    };

    expect(
      await authenticate({
        host: "https://api.example.com",
        email: "test@example.com",
        password: "test-password",
        httpHelper,
      }),
    ).toEqual({ access_token: "test-token" });
  });

  test("preserves structured errors returned as buffers", async () => {
    const httpHelper: HttpRequestHelper = async () => {
      throw {
        response: {
          status: 400,
          statusText: "Bad Request",
          headers: { "content-type": "application/json" },
          data: Buffer.from(
            JSON.stringify({
              error: "validation_fault",
              error_description: "Ungültige Anfrage",
              request_id: "req-binary",
            }),
          ),
        },
      };
    };
    const response = await createFetchFromHttpHelper(httpHelper)(
      "https://api.example.com/test",
    );

    await expect(ensureSuccess(response)).rejects.toThrow(
      `${DEFAULT_ERROR_PREFIX} (400 Bad Request): Ungültige Anfrage | Error ID: validation_fault | Request ID: req-binary`,
    );
  });

  test.each([200, 204, 205])(
    "handles empty buffers with HTTP status %i",
    async (statusCode) => {
      const httpHelper: HttpRequestHelper = async () => ({
        body: Buffer.alloc(0),
        statusCode,
        headers: {},
      });
      const fetchImpl = createFetchFromHttpHelper(httpHelper);
      const response = await fetchImpl("https://api.example.com/test");

      expect(response.status).toBe(statusCode);
      expect((await response.arrayBuffer()).byteLength).toBe(0);
      expect(await response.text()).toBe("");
      await expect(
        ensureSuccess(await fetchImpl("https://api.example.com/test")),
      ).resolves.toBeUndefined();
    },
  );

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
