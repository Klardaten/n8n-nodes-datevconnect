import type { JsonValue, HttpRequestHelper } from "./datevConnectClient";
import { createFetchFromHttpHelper } from "./httpHelpers";

const JSON_CONTENT_TYPE = "application/json;charset=utf-8";
const DEFAULT_ERROR_PREFIX = "DATEV IAM request failed";

const IAM_BASE_PATH = "datevconnect/iam/v1";
const SERVICE_PROVIDER_CONFIG_PATH = `${IAM_BASE_PATH}/ServiceProviderConfig`;
const RESOURCE_TYPES_PATH = `${IAM_BASE_PATH}/ResourceTypes`;
const SCHEMAS_PATH = `${IAM_BASE_PATH}/Schemas`;
const USERS_PATH = `${IAM_BASE_PATH}/Users`;
const CURRENT_USER_PATH = `${USERS_PATH}/me`;
const GROUPS_PATH = `${IAM_BASE_PATH}/Groups`;

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

interface BaseIamRequestOptions {
  host: string;
  token: string;
  clientInstanceId: string;
  httpHelper?: HttpRequestHelper;
  fetchImpl?: typeof fetch; // Backward compatibility for tests
}

interface SendRequestOptions extends BaseIamRequestOptions {
  path: string;
  method: RequestMethod;
  query?: Record<string, string | number | undefined | null>;
  body?: JsonValue;
}

interface RequestResult {
  data?: JsonValue;
  response: Response;
}

export type FetchServiceProviderConfigOptions = BaseIamRequestOptions;
export type FetchResourceTypesOptions = BaseIamRequestOptions;
export type FetchSchemasOptions = BaseIamRequestOptions;

export interface FetchSchemaOptions extends BaseIamRequestOptions {
  schemaId: string;
}

export interface FetchUsersOptions extends BaseIamRequestOptions {
  filter?: string;
  startIndex?: number;
  count?: number;
  attributes?: string;
}

export interface FetchUserOptions extends BaseIamRequestOptions {
  userId: string;
}

export interface CreateUserOptions extends BaseIamRequestOptions {
  user: JsonValue;
}

export interface UpdateUserOptions extends BaseIamRequestOptions {
  userId: string;
  user: JsonValue;
}

export interface DeleteUserOptions extends BaseIamRequestOptions {
  userId: string;
}

export type FetchGroupsOptions = BaseIamRequestOptions;

export interface FetchGroupOptions extends BaseIamRequestOptions {
  groupId: string;
}

export interface CreateGroupOptions extends BaseIamRequestOptions {
  group: JsonValue;
}

export interface UpdateGroupOptions extends BaseIamRequestOptions {
  groupId: string;
  group: JsonValue;
}

export interface DeleteGroupOptions extends BaseIamRequestOptions {
  groupId: string;
}

export type FetchCurrentUserOptions = BaseIamRequestOptions;

function normaliseBaseUrl(host: string): string {
  if (!host) {
    throw new Error("DATEVconnect host must be provided");
  }

  return host.endsWith("/") ? host : `${host}/`;
}

function buildUrl(
  host: string,
  path: string,
  query?: Record<string, string | number | undefined | null>,
): URL {
  const baseUrl = normaliseBaseUrl(host);
  const trimmedPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(trimmedPath, baseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  return url;
  };
  

async function readResponseBody(response: Response): Promise<JsonValue | undefined> {
  if (response.status === 204 || response.status === 205) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.toLowerCase().includes("application/json")) {
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

function buildErrorMessage(response: Response, body: JsonValue | undefined): string {
  const statusPart = `${response.status}${
    response.statusText ? ` ${response.statusText}` : ""
  }`.trim();
  const prefix = `${DEFAULT_ERROR_PREFIX}${statusPart ? ` (${statusPart})` : ""}`;

  if (body && typeof body === "object") {
    const message =
      ("message" in body && typeof body.message === "string" ? body.message : undefined) ||
      ("detail" in body && typeof body.detail === "string" ? body.detail : undefined) ||
      ("error" in body && typeof body.error === "string" ? body.error : undefined);

    if (message) {
      return `${prefix}: ${message}`;
    }
  }

  if (typeof body === "string") {
    return `${prefix}: ${body}`;
  }

  return prefix;
}

async function sendRequest(options: SendRequestOptions): Promise<RequestResult> {
  const { host, token, clientInstanceId, path, method, query, body, httpHelper, fetchImpl: providedFetchImpl } = options;
  const url = buildUrl(host, path, query);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "x-client-instance-id": clientInstanceId,
    Accept: JSON_CONTENT_TYPE,
  };

  const requestInit: RequestInit = {
    method,
    headers,
  };

  if (body !== undefined) {
    headers["content-type"] = JSON_CONTENT_TYPE;
    requestInit.body = JSON.stringify(body);
  }

  const fetchImpl = httpHelper ? createFetchFromHttpHelper(httpHelper) : (providedFetchImpl || fetch);
  
  const response = await fetchImpl(url, requestInit);
  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    throw new Error(buildErrorMessage(response, responseBody));
  }

  return { data: responseBody, response };
}

function extractLocationHeader(response: Response): string | undefined {
  return response.headers.get("Location") ?? response.headers.get("Link") ?? undefined;
}

export class IdentityAndAccessManagementClient {
  static async fetchServiceProviderConfig(
    options: FetchServiceProviderConfigOptions,
  ): Promise<JsonValue> {
    const result = await sendRequest({
      ...options,
      path: SERVICE_PROVIDER_CONFIG_PATH,
      method: "GET",
    });

    if (result.data === undefined) {
      throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected service provider configuration.`);
    }

    return result.data;
  }

  static async fetchResourceTypes(options: FetchResourceTypesOptions): Promise<JsonValue> {
    const result = await sendRequest({
      ...options,
      path: RESOURCE_TYPES_PATH,
      method: "GET",
    });

    if (result.data === undefined) {
      throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected resource types response.`);
    }

    return result.data;
  }

  static async fetchSchemas(options: FetchSchemasOptions): Promise<JsonValue> {
    const result = await sendRequest({
      ...options,
      path: SCHEMAS_PATH,
      method: "GET",
    });

    if (result.data === undefined) {
      throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected schema list response.`);
    }

    return result.data;
  }

  static async fetchSchema(options: FetchSchemaOptions): Promise<JsonValue> {
    const result = await sendRequest({
      ...options,
      path: `${SCHEMAS_PATH}/${encodeURIComponent(options.schemaId)}`,
      method: "GET",
    });

    if (result.data === undefined) {
      throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected schema response.`);
    }

    return result.data;
  }

  static async fetchUsers(options: FetchUsersOptions): Promise<JsonValue> {
    const result = await sendRequest({
      ...options,
      path: USERS_PATH,
      method: "GET",
      query: {
        filter: options.filter,
        startIndex: options.startIndex,
        count: options.count,
        attributes: options.attributes,
      },
    });

    if (result.data === undefined) {
      throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected users response.`);
    }

    return result.data;
  }

  static async fetchUser(options: FetchUserOptions): Promise<JsonValue> {
    const result = await sendRequest({
      ...options,
      path: `${USERS_PATH}/${encodeURIComponent(options.userId)}`,
      method: "GET",
    });

    if (result.data === undefined) {
      throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected user response.`);
    }

    return result.data;
  }

  static async createUser(options: CreateUserOptions): Promise<JsonValue> {
    const result = await sendRequest({
      ...options,
      path: USERS_PATH,
      method: "POST",
      body: options.user,
    });

    if (result.data !== undefined) {
      return result.data;
    }

    const location = extractLocationHeader(result.response);
    return {
      success: true,
      location,
    } as JsonValue;
  }

  static async updateUser(options: UpdateUserOptions): Promise<JsonValue> {
    const result = await sendRequest({
      ...options,
      path: `${USERS_PATH}/${encodeURIComponent(options.userId)}`,
      method: "PUT",
      body: options.user,
    });

    if (result.data !== undefined) {
      return result.data;
    }

    const location = extractLocationHeader(result.response);
    return {
      success: true,
      userId: options.userId,
      location,
    } as JsonValue;
  }

  static async deleteUser(options: DeleteUserOptions): Promise<{ location?: string }> {
    const result = await sendRequest({
      ...options,
      path: `${USERS_PATH}/${encodeURIComponent(options.userId)}`,
      method: "DELETE",
    });

    return {
      location: extractLocationHeader(result.response) ?? undefined,
    };
  }

  static async fetchCurrentUser(options: FetchCurrentUserOptions): Promise<JsonValue> {
    const result = await sendRequest({
      ...options,
      path: CURRENT_USER_PATH,
      method: "GET",
    });

    if (result.data === undefined) {
      throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected current user response.`);
    }

    return result.data;
  }

  static async fetchGroups(options: FetchGroupsOptions): Promise<JsonValue> {
    const result = await sendRequest({
      ...options,
      path: GROUPS_PATH,
      method: "GET",
    });

    if (result.data === undefined) {
      throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected groups response.`);
    }

    return result.data;
  }

  static async fetchGroup(options: FetchGroupOptions): Promise<JsonValue> {
    const result = await sendRequest({
      ...options,
      path: `${GROUPS_PATH}/${encodeURIComponent(options.groupId)}`,
      method: "GET",
    });

    if (result.data === undefined) {
      throw new Error(`${DEFAULT_ERROR_PREFIX}: Expected group response.`);
    }

    return result.data;
  }

  static async createGroup(options: CreateGroupOptions): Promise<JsonValue> {
    const result = await sendRequest({
      ...options,
      path: GROUPS_PATH,
      method: "POST",
      body: options.group,
    });

    if (result.data !== undefined) {
      return result.data;
    }

    const location = extractLocationHeader(result.response);
    return {
      success: true,
      location,
    } as JsonValue;
  }

  static async updateGroup(options: UpdateGroupOptions): Promise<JsonValue> {
    const result = await sendRequest({
      ...options,
      path: `${GROUPS_PATH}/${encodeURIComponent(options.groupId)}`,
      method: "PUT",
      body: options.group,
    });

    if (result.data !== undefined) {
      return result.data;
    }

    const location = extractLocationHeader(result.response);
    return {
      success: true,
      groupId: options.groupId,
      location,
    } as JsonValue;
  }

  static async deleteGroup(options: DeleteGroupOptions): Promise<{ location?: string }> {
    const result = await sendRequest({
      ...options,
      path: `${GROUPS_PATH}/${encodeURIComponent(options.groupId)}`,
      method: "DELETE",
    });

    return {
      location: extractLocationHeader(result.response) ?? undefined,
    };
  }
}
