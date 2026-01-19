/**
 * Shared utilities for DATEV API clients
 */

import {
  createFetchFromHttpHelper,
  type HttpRequestHelper,
} from "./httpHelpers";

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export { type HttpRequestHelper } from "./httpHelpers";

export interface AuthenticateOptions {
  host: string;
  email: string;
  password: string;
  httpHelper?: HttpRequestHelper;
  fetchImpl?: typeof fetch; // Backward compatibility for tests
}

export interface AuthenticateResponse extends Record<string, JsonValue> {
  access_token: string;
}

export interface BaseRequestOptions {
  host: string;
  token: string;
  clientInstanceId: string;
  httpHelper?: HttpRequestHelper;
  fetchImpl?: typeof fetch; // Backward compatibility for tests
}

export const JSON_CONTENT_TYPE = "application/json";
export const DEFAULT_ERROR_PREFIX = "DATEVconnect request failed";

export function normaliseBaseUrl(host: string): string {
  if (!host) {
    throw new Error("DATEVconnect host must be provided");
  }

  return host.endsWith("/") ? host : `${host}/`;
}

export function buildHeaders(
  headers: Record<string, string | undefined>,
): HeadersInit {
  return Object.entries(headers).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (value) {
        acc[key] = value;
      }
      return acc;
    },
    {},
  );
}

export async function readResponseBody(
  response: Response,
): Promise<JsonValue | string | undefined> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.toLowerCase().includes(JSON_CONTENT_TYPE)) {
    try {
      return (await response.json()) as JsonValue;
    } catch {
      return undefined;
    }
  }

  try {
    const text = await response.text();
    return text.length > 0 ? text : undefined;
  } catch {
    return undefined;
  }
}

export function extractErrorMessage(
  response: Response,
  body: JsonValue | string | undefined,
): string {
  const statusPart =
    `${response.status}${response.statusText ? ` ${response.statusText}` : ""}`.trim();
  const prefix = `${DEFAULT_ERROR_PREFIX}${statusPart ? ` (${statusPart})` : ""}`;

  if (typeof body === "string" && body.trim().length > 0) {
    return `${prefix}: ${body.trim()}`;
  }

  if (body && typeof body === "object") {
    const errorDescription =
      "error_description" in body && typeof body.error_description === "string"
        ? body.error_description
        : undefined;

    const message =
      ("message" in body && typeof body.message === "string"
        ? body.message
        : undefined) ||
      ("error" in body && typeof body.error === "string"
        ? body.error
        : undefined);
    if (message) {
      return `${prefix}: ${message}${errorDescription ? `: ${errorDescription}` : ""}`;
    }
  }

  return prefix;
}

export async function ensureSuccess(
  response: Response,
): Promise<JsonValue | undefined> {
  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(response, body));
  }

  if (body && typeof body === "object") {
    return body as JsonValue;
  }

  if (body === undefined) {
    return undefined;
  }

  throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected JSON response body.`);
}

export function buildApiUrl(host: string, path: string): URL {
  const baseUrl = normaliseBaseUrl(host);
  const trimmedPath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(trimmedPath, baseUrl);
}

/**
 * Authenticate with DATEV API
 * Uses httpHelper (n8n's httpRequest) when available, falls back to fetchImpl for tests, or global fetch
 */
export async function authenticate(
  options: AuthenticateOptions,
): Promise<AuthenticateResponse> {
  const {
    host,
    email,
    password,
    httpHelper,
    fetchImpl: providedFetchImpl,
  } = options;
  const baseUrl = normaliseBaseUrl(host);
  const url = new URL("api/auth/login", baseUrl);

  // Use httpHelper if provided (n8n runtime), else fetchImpl (tests), else global fetch (fallback)
  const fetchImpl = httpHelper
    ? createFetchFromHttpHelper(httpHelper)
    : providedFetchImpl || fetch;

  const response = await fetchImpl(url, {
    method: "POST",
    headers: buildHeaders({
      "content-type": JSON_CONTENT_TYPE,
    }),
    body: JSON.stringify({ email, password }),
  });

  const body = await ensureSuccess(response);

  if (
    !body ||
    typeof body !== "object" ||
    !("access_token" in body) ||
    typeof body.access_token !== "string"
  ) {
    throw new Error(
      `${DEFAULT_ERROR_PREFIX}: Authentication response missing access_token.`,
    );
  }

  return body as AuthenticateResponse;
}
