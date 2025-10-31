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
  fetchImpl?: typeof fetch;
}

export interface AuthenticateResponse extends Record<string, JsonValue> {
  access_token: string;
}

interface BaseRequestOptions {
  host: string;
  token: string;
  clientInstanceId: string;
  fetchImpl?: typeof fetch;
}

export interface FetchClientsOptions extends BaseRequestOptions {
  host: string;
  token: string;
  clientInstanceId: string;
  top?: number;
  skip?: number;
  select?: string;
  filter?: string;
}

export interface FetchClientOptions extends BaseRequestOptions {
  clientId: string;
  select?: string;
}

export interface CreateClientOptions extends BaseRequestOptions {
  client: JsonValue;
  maxNumber?: number;
}

export interface UpdateClientOptions extends BaseRequestOptions {
  clientId: string;
  client: JsonValue;
}

export interface FetchClientResponsibilitiesOptions extends BaseRequestOptions {
  clientId: string;
  select?: string;
}

export interface UpdateClientResponsibilitiesOptions extends BaseRequestOptions {
  clientId: string;
  responsibilities: JsonValue;
}

export interface FetchClientCategoriesOptions extends BaseRequestOptions {
  clientId: string;
  select?: string;
}

export interface UpdateClientCategoriesOptions extends BaseRequestOptions {
  clientId: string;
  categories: JsonValue;
}

export interface FetchClientGroupsOptions extends BaseRequestOptions {
  clientId: string;
  select?: string;
}

export interface UpdateClientGroupsOptions extends BaseRequestOptions {
  clientId: string;
  groups: JsonValue;
}

export interface FetchClientDeletionLogOptions extends BaseRequestOptions {
  select?: string;
  filter?: string;
}

export interface FetchNextFreeClientNumberOptions extends BaseRequestOptions {
  start: number;
  range?: number;
}

export interface FetchTaxAuthoritiesOptions extends BaseRequestOptions {
  select?: string;
  filter?: string;
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
    const text = await response.text();
    return text.length > 0 ? text : undefined;
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
  const { host, email, password, fetchImpl = fetch } = options;
  const baseUrl = normaliseBaseUrl(host);
  const url = new URL("api/auth/login", baseUrl);

  const response = await fetchImpl(url, {
    method: "POST",
    headers: buildHeaders({
      "content-type": JSON_CONTENT_TYPE,
    }),
    body: JSON.stringify({ email, password }),
  });

  const body = await ensureSuccess(response);

  if (!body || typeof body !== "object" || !("access_token" in body) || typeof body.access_token !== "string") {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Authentication response missing access_token.`);
  }

  return body as AuthenticateResponse;
}

const MASTER_DATA_BASE_PATH = "datevconnect/master-data/v1";
const CLIENTS_PATH = `${MASTER_DATA_BASE_PATH}/clients`;
const TAX_AUTHORITIES_PATH = `${MASTER_DATA_BASE_PATH}/tax-authorities`;

type RequestMethod = "GET" | "POST" | "PUT";

interface MasterDataRequestOptions {
  host: string;
  token: string;
  clientInstanceId: string;
  path: string;
  method: RequestMethod;
  query?: Record<string, string | number | undefined | null>;
  body?: JsonValue;
  fetchImpl?: typeof fetch;
}

function buildApiUrl(host: string, path: string): URL {
  const baseUrl = normaliseBaseUrl(host);
  const trimmedPath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(trimmedPath, baseUrl);
}

async function sendMasterDataRequest(
  options: MasterDataRequestOptions,
): Promise<JsonValue | undefined> {
  const { host, token, clientInstanceId, path, method, query, body, fetchImpl = fetch } = options;
  const url = buildApiUrl(host, path);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetchImpl(url, {
    method,
    headers: buildHeaders({
      accept: JSON_CONTENT_TYPE,
      authorization: `Bearer ${token}`,
      "content-type": JSON_CONTENT_TYPE,
      "x-client-instance-id": clientInstanceId,
    }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return ensureSuccess(response);
}

export async function fetchClients(options: FetchClientsOptions): Promise<JsonValue> {
  const { top, skip, select, filter } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: CLIENTS_PATH,
    method: "GET",
    query: {
      top,
      skip,
      select,
      filter,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected clients payload.`);
  }

  return body;
}

export async function fetchClient(options: FetchClientOptions): Promise<JsonValue> {
  const { clientId, select } = options;
  const body = await sendMasterDataRequest({
    ...options,
    path: `${CLIENTS_PATH}/${encodeURIComponent(clientId)}`,
    method: "GET",
    query: {
      select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected client payload.`);
  }

  return body;
}

export async function createClient(options: CreateClientOptions): Promise<JsonValue | undefined> {
  const { client, maxNumber } = options;

  return sendMasterDataRequest({
    ...options,
    path: CLIENTS_PATH,
    method: "POST",
    query: {
      "max-number": maxNumber,
    },
    body: client,
  });
}

export async function updateClient(options: UpdateClientOptions): Promise<JsonValue | undefined> {
  const { clientId, client } = options;

  return sendMasterDataRequest({
    ...options,
    path: `${CLIENTS_PATH}/${encodeURIComponent(clientId)}`,
    method: "PUT",
    body: client,
  });
}

export async function fetchClientResponsibilities(
  options: FetchClientResponsibilitiesOptions,
): Promise<JsonValue> {
  const { clientId, select } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: `${CLIENTS_PATH}/${encodeURIComponent(clientId)}/responsibilities`,
    method: "GET",
    query: {
      select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected responsibilities payload.`);
  }

  return body;
}

export async function updateClientResponsibilities(
  options: UpdateClientResponsibilitiesOptions,
): Promise<JsonValue | undefined> {
  const { clientId, responsibilities } = options;

  return sendMasterDataRequest({
    ...options,
    path: `${CLIENTS_PATH}/${encodeURIComponent(clientId)}/responsibilities`,
    method: "PUT",
    body: responsibilities,
  });
}

export async function fetchClientCategories(
  options: FetchClientCategoriesOptions,
): Promise<JsonValue> {
  const { clientId, select } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: `${CLIENTS_PATH}/${encodeURIComponent(clientId)}/client-categories`,
    method: "GET",
    query: {
      select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected client categories payload.`);
  }

  return body;
}

export async function updateClientCategories(
  options: UpdateClientCategoriesOptions,
): Promise<JsonValue | undefined> {
  const { clientId, categories } = options;

  return sendMasterDataRequest({
    ...options,
    path: `${CLIENTS_PATH}/${encodeURIComponent(clientId)}/client-categories`,
    method: "PUT",
    body: categories,
  });
}

export async function fetchClientGroups(options: FetchClientGroupsOptions): Promise<JsonValue> {
  const { clientId, select } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: `${CLIENTS_PATH}/${encodeURIComponent(clientId)}/client-groups`,
    method: "GET",
    query: {
      select,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected client groups payload.`);
  }

  return body;
}

export async function updateClientGroups(
  options: UpdateClientGroupsOptions,
): Promise<JsonValue | undefined> {
  const { clientId, groups } = options;

  return sendMasterDataRequest({
    ...options,
    path: `${CLIENTS_PATH}/${encodeURIComponent(clientId)}/client-groups`,
    method: "PUT",
    body: groups,
  });
}

export async function fetchClientDeletionLog(
  options: FetchClientDeletionLogOptions,
): Promise<JsonValue> {
  const { select, filter } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: `${CLIENTS_PATH}/deletion-log`,
    method: "GET",
    query: {
      select,
      filter,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected client deletion log payload.`);
  }

  return body;
}

export async function fetchNextFreeClientNumber(
  options: FetchNextFreeClientNumberOptions,
): Promise<JsonValue> {
  const { start, range } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: `${CLIENTS_PATH}/next-free-number`,
    method: "GET",
    query: {
      start,
      range,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected next free number payload.`);
  }

  return body;
}

export async function fetchTaxAuthorities(
  options: FetchTaxAuthoritiesOptions,
): Promise<JsonValue> {
  const { select, filter } = options;

  const body = await sendMasterDataRequest({
    ...options,
    path: TAX_AUTHORITIES_PATH,
    method: "GET",
    query: {
      select,
      filter,
    },
  });

  if (body === undefined) {
    throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected tax authorities payload.`);
  }

  return body;
}
