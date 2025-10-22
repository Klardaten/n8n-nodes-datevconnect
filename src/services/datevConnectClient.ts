export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface AuthenticateOptions {
  host: string;
  email: string;
  password: string;
  clientInstanceId: string;
  fetchImpl?: typeof fetch;
}

export interface AuthenticateResponse extends Record<string, JsonValue> {
  token: string;
}

export interface FetchClientsOptions {
  host: string;
  token: string;
  clientInstanceId: string;
  top?: number;
  skip?: number;
  fetchImpl?: typeof fetch;
}

const JSON_CONTENT_TYPE = "application/json";

const DEFAULT_ERROR_PREFIX = "DATEVconnect request failed";

function normaliseBaseUrl(host: string): string {
  if (!host) {
    throw new Error("DATEVconnect host must be provided");
  }

  return host.endsWith("/") ? host : `${host}/`;
}

function buildHeaders(headers: Record<string, string | undefined>): HeadersInit {
  return Object.entries(headers).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

async function readResponseBody(response: Response): Promise<JsonValue | string | undefined> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.toLowerCase().includes(JSON_CONTENT_TYPE)) {
    try {
      return (await response.json()) as JsonValue;
    } catch {
      return undefined;
    }
  }

  try {
    return await response.text();
  } catch {
    return undefined;
  }
}

function extractErrorMessage(
  response: Response,
  body: JsonValue | string | undefined,
): string {
  const statusPart = `${response.status}${response.statusText ? ` ${response.statusText}` : ""}`.trim();
  const prefix = `${DEFAULT_ERROR_PREFIX}${statusPart ? ` (${statusPart})` : ""}`;

  if (typeof body === "string" && body.trim().length > 0) {
    return `${prefix}: ${body.trim()}`;
  }

  if (body && typeof body === "object") {
    const message =
      ("message" in body && typeof body.message === "string"
        ? body.message
        : undefined) ||
      ("error" in body && typeof body.error === "string" ? body.error : undefined);
    if (message) {
      return `${prefix}: ${message}`;
    }
  }

  return prefix;
}

async function ensureSuccess(response: Response): Promise<JsonValue | undefined> {
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

export async function authenticate(options: AuthenticateOptions): Promise<AuthenticateResponse> {
  const { host, email, password, clientInstanceId, fetchImpl = fetch } = options;
  const baseUrl = normaliseBaseUrl(host);
  const url = new URL("api/auth/login", baseUrl);

  const response = await fetchImpl(url, {
    method: "POST",
    headers: buildHeaders({
      "content-type": JSON_CONTENT_TYPE,
      "x-client-instance-id": clientInstanceId,
    }),
    body: JSON.stringify({ email, password, clientInstanceId }),
  });

  const body = await ensureSuccess(response);

  if (!body || typeof body !== "object" || !("token" in body) || typeof body.token !== "string") {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Authentication response missing token.`);
  }

  return body as AuthenticateResponse;
}

export async function fetchClients(options: FetchClientsOptions): Promise<JsonValue> {
  const { host, token, clientInstanceId, top, skip, fetchImpl = fetch } = options;
  const baseUrl = normaliseBaseUrl(host);
  const url = new URL("api/clients", baseUrl);

  if (typeof top === "number") {
    url.searchParams.set("top", top.toString());
  }

  if (typeof skip === "number") {
    url.searchParams.set("skip", skip.toString());
  }

  const response = await fetchImpl(url, {
    method: "GET",
    headers: buildHeaders({
      accept: JSON_CONTENT_TYPE,
      authorization: `Bearer ${token}`,
      "content-type": JSON_CONTENT_TYPE,
      "x-client-instance-id": clientInstanceId,
    }),
  });

  const body = await ensureSuccess(response);

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected clients payload.`);
  }

  return body;
}
