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

export type { HttpRequestHelper } from "./httpHelpers";

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

function safeStringify(value: JsonValue): string | undefined {
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

type DatevAdditionalMessage = {
  id?: string;
  description?: string;
  severity?: string;
  help_uri?: string;
};

type DatevErrorBody = {
  error?: string;
  error_description?: string;
  error_uri?: string;
  request_id?: string;
  additional_messages?: DatevAdditionalMessage[];
};

function isRecord(value: JsonValue | undefined): value is Record<string, JsonValue> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(
  value: Record<string, JsonValue>,
  key: string,
): string | undefined {
  const candidate = value[key];
  if (typeof candidate !== "string") {
    return undefined;
  }

  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseDatevAdditionalMessage(
  value: JsonValue | undefined,
): DatevAdditionalMessage | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const message = {
    id: readString(value, "id"),
    description: readString(value, "description"),
    severity: readString(value, "severity"),
    help_uri: readString(value, "help_uri"),
  };

  return Object.values(message).some(Boolean) ? message : undefined;
}

function parseDatevErrorBody(
  value: JsonValue | undefined,
): DatevErrorBody | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const errorBody: DatevErrorBody = {
    error: readString(value, "error"),
    error_description: readString(value, "error_description"),
    error_uri: readString(value, "error_uri"),
    request_id: readString(value, "request_id"),
  };

  if (Array.isArray(value.additional_messages)) {
    const additionalMessages = value.additional_messages
      .map(parseDatevAdditionalMessage)
      .filter((message): message is DatevAdditionalMessage => Boolean(message));

    if (additionalMessages.length > 0) {
      errorBody.additional_messages = additionalMessages;
    }
  }

  return Object.values(errorBody).some(Boolean) ? errorBody : undefined;
}

function formatAdditionalMessage(message: DatevAdditionalMessage): string {
  const mainPart =
    [message.severity ? `[${message.severity}]` : undefined, message.description]
      .filter((part): part is string => Boolean(part))
      .join(" ") || "Additional message";

  const details = [
    message.id ? `ID: ${message.id}` : undefined,
    message.help_uri ? `Help: ${message.help_uri}` : undefined,
  ].filter((part): part is string => Boolean(part));

  return details.length > 0 ? `${mainPart} (${details.join(", ")})` : mainPart;
}

function formatDatevErrorBody(body: DatevErrorBody): string {
  const details = [
    body.error ? `Error ID: ${body.error}` : undefined,
    body.request_id ? `Request ID: ${body.request_id}` : undefined,
    body.error_uri ? `More info: ${body.error_uri}` : undefined,
    body.additional_messages?.length
      ? `Additional messages: ${body.additional_messages
          .map(formatAdditionalMessage)
          .join("; ")}`
      : undefined,
  ].filter((part): part is string => Boolean(part));

  const mainMessage =
    body.error_description ||
    body.error ||
    "DATEVconnect returned an error response";

  return details.length > 0
    ? `${mainMessage} | ${details.join(" | ")}`
    : mainMessage;
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

  const datevError = parseDatevErrorBody(body);
  if (datevError) {
    return `${prefix}: ${formatDatevErrorBody(datevError)}`;
  }

  if (body && typeof body === "object") {
    const serializedBody = safeStringify(body);
    if (serializedBody) {
      return `${prefix}: ${serializedBody}`;
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

const USER_API_KEY_PREFIX = "uk-";
const USER_API_KEY_TOTAL_LENGTH = 64;

export function isUserApiKeyFormat(token: string): boolean {
  return (
    typeof token === "string" &&
    token.startsWith(USER_API_KEY_PREFIX) &&
    token.length === USER_API_KEY_TOTAL_LENGTH
  );
}

export interface DatevConnectCredentialFields {
  host?: string;
  email?: string;
  password?: string;
  apiKey?: string;
  clientInstanceId?: string;
}

const CREDENTIAL_ERROR = "Provide either email and password or a user API key.";

export interface ResolveTokenOptions {
  httpHelper?: HttpRequestHelper;
  fetchImpl?: typeof fetch;
}

export interface DatevConnectAuthContext {
  host: string;
  token: string;
  clientInstanceId: string;
  httpHelper?: HttpRequestHelper;
}

const CREDENTIALS_MISSING = "DATEVconnect credentials are missing";

/**
 * Validates credentials, resolves the Bearer token, and returns the auth context.
 * Use this in nodes to get host, token, and clientInstanceId in one call.
 * - Throws if credentials are null, invalid, or auth fails.
 */
export async function getDatevConnectAuthContext(
  credentials: DatevConnectCredentialFields | null,
  options?: ResolveTokenOptions,
): Promise<DatevConnectAuthContext> {
  if (!credentials) {
    throw new Error(CREDENTIALS_MISSING);
  }
  validateDatevConnectCredentials(credentials);
  const host = credentials.host;
  const clientInstanceId = credentials.clientInstanceId;
  if (!host || !clientInstanceId) {
    throw new Error(CREDENTIAL_ERROR);
  }
  const token = await resolveTokenFromCredentials(credentials, options);
  return {
    host,
    token,
    clientInstanceId,
    httpHelper: options?.httpHelper,
  };
}

/**
 * Resolves the Bearer token from DATEVconnect credentials.
 * Use after validateDatevConnectCredentials().
 * - If valid apiKey is set, returns it as the token (no HTTP call).
 * - Otherwise calls authenticate() with email/password and returns access_token.
 */
export async function resolveTokenFromCredentials(
  credentials: DatevConnectCredentialFields,
  options?: ResolveTokenOptions,
): Promise<string> {
  const trimmedApiKey = credentials.apiKey?.trim();
  if (
    trimmedApiKey != null &&
    trimmedApiKey !== "" &&
    isUserApiKeyFormat(trimmedApiKey)
  ) {
    return trimmedApiKey;
  }

  const email = credentials.email?.trim();
  const password = credentials.password?.trim();
  if (!email || !password) {
    throw new Error(CREDENTIAL_ERROR);
  }

  const host = credentials.host;
  if (!host) {
    throw new Error(CREDENTIAL_ERROR);
  }

  const authResponse = await authenticate({
    host,
    email,
    password,
    httpHelper: options?.httpHelper,
    fetchImpl: options?.fetchImpl,
  });
  return authResponse.access_token;
}

export function validateDatevConnectCredentials(
  creds: DatevConnectCredentialFields | null,
): void {
  if (!creds?.host || !creds?.clientInstanceId) {
    throw new Error(CREDENTIAL_ERROR);
  }
  const hasApiKey =
    creds.apiKey != null &&
    String(creds.apiKey).trim() !== "" &&
    isUserApiKeyFormat(creds.apiKey.trim());
  const hasEmailPassword =
    creds.email != null &&
    String(creds.email).trim() !== "" &&
    creds.password != null &&
    String(creds.password).trim() !== "";

  if (hasApiKey || hasEmailPassword) {
    return;
  }
  throw new Error(CREDENTIAL_ERROR);
}
