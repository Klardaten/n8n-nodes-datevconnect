import type { BaseRequestOptions, JsonValue } from "./shared";
import { createDatevConnectJsonRequester } from "./shared";

const JSON_CONTENT_TYPE = "application/json;charset=utf-8";
const DEFAULT_ERROR_PREFIX = "DATEV IAM request failed";

const IAM_BASE_PATH = "datevconnect/iam/v1";
const SERVICE_PROVIDER_CONFIG_PATH = `${IAM_BASE_PATH}/ServiceProviderConfig`;
const RESOURCE_TYPES_PATH = `${IAM_BASE_PATH}/ResourceTypes`;
const SCHEMAS_PATH = `${IAM_BASE_PATH}/Schemas`;
const USERS_PATH = `${IAM_BASE_PATH}/Users`;
const CURRENT_USER_PATH = `${USERS_PATH}/me`;
const GROUPS_PATH = `${IAM_BASE_PATH}/Groups`;

type BaseIamRequestOptions = BaseRequestOptions;

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

const sendIamRequest = createDatevConnectJsonRequester({
  accept: JSON_CONTENT_TYPE,
  contentType: JSON_CONTENT_TYPE,
  headerCase: "standard",
  skipEmptyQueryValues: true,
  errorPrefix: DEFAULT_ERROR_PREFIX,
  errorMessageOptions: {
    preferredMessageFields: ["message", "detail", "error"],
  },
});

function extractLocationHeader(response: Response): string | undefined {
  return (
    response.headers.get("Location") ??
    response.headers.get("Link") ??
    undefined
  );
}

export class IdentityAndAccessManagementClient {
  static async fetchServiceProviderConfig(
    options: FetchServiceProviderConfigOptions,
  ): Promise<JsonValue> {
    const result = await sendIamRequest({
      ...options,
      path: SERVICE_PROVIDER_CONFIG_PATH,
      method: "GET",
    });

    if (result.data === undefined) {
      throw new Error(
        `${DEFAULT_ERROR_PREFIX}: Expected service provider configuration.`,
      );
    }

    return result.data;
  }

  static async fetchResourceTypes(
    options: FetchResourceTypesOptions,
  ): Promise<JsonValue> {
    const result = await sendIamRequest({
      ...options,
      path: RESOURCE_TYPES_PATH,
      method: "GET",
    });

    if (result.data === undefined) {
      throw new Error(
        `${DEFAULT_ERROR_PREFIX}: Expected resource types response.`,
      );
    }

    return result.data;
  }

  static async fetchSchemas(options: FetchSchemasOptions): Promise<JsonValue> {
    const result = await sendIamRequest({
      ...options,
      path: SCHEMAS_PATH,
      method: "GET",
    });

    if (result.data === undefined) {
      throw new Error(
        `${DEFAULT_ERROR_PREFIX}: Expected schema list response.`,
      );
    }

    return result.data;
  }

  static async fetchSchema(options: FetchSchemaOptions): Promise<JsonValue> {
    const result = await sendIamRequest({
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
    const result = await sendIamRequest({
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
    const result = await sendIamRequest({
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
    const result = await sendIamRequest({
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
    const result = await sendIamRequest({
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

  static async deleteUser(
    options: DeleteUserOptions,
  ): Promise<{ location?: string }> {
    const result = await sendIamRequest({
      ...options,
      path: `${USERS_PATH}/${encodeURIComponent(options.userId)}`,
      method: "DELETE",
    });

    return {
      location: extractLocationHeader(result.response) ?? undefined,
    };
  }

  static async fetchCurrentUser(
    options: FetchCurrentUserOptions,
  ): Promise<JsonValue> {
    const result = await sendIamRequest({
      ...options,
      path: CURRENT_USER_PATH,
      method: "GET",
    });

    if (result.data === undefined) {
      throw new Error(
        `${DEFAULT_ERROR_PREFIX}: Expected current user response.`,
      );
    }

    return result.data;
  }

  static async fetchGroups(options: FetchGroupsOptions): Promise<JsonValue> {
    const result = await sendIamRequest({
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
    const result = await sendIamRequest({
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
    const result = await sendIamRequest({
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
    const result = await sendIamRequest({
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

  static async deleteGroup(
    options: DeleteGroupOptions,
  ): Promise<{ location?: string }> {
    const result = await sendIamRequest({
      ...options,
      path: `${GROUPS_PATH}/${encodeURIComponent(options.groupId)}`,
      method: "DELETE",
    });

    return {
      location: extractLocationHeader(result.response) ?? undefined,
    };
  }
}
