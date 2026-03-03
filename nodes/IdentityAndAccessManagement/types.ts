import type { IDataObject } from "n8n-workflow";
import type { JsonValue } from "../../src/services/datevConnectClient";
import type { DatevConnectAuthContext } from "../common/datevConnectAuth";

/** Auth context for API calls (host, token, clientInstanceId, httpHelper). */
export type AuthContext = DatevConnectAuthContext;

export type Resource =
  | "serviceProviderConfig"
  | "resourceType"
  | "schema"
  | "user"
  | "currentUser"
  | "group";

export type ServiceProviderConfigOperation = "get";
export type ResourceTypeOperation = "getAll";
export type SchemaOperation = "getAll" | "get";
export type UserOperation = "getAll" | "get" | "create" | "update" | "delete";
export type CurrentUserOperation = "get";
export type GroupOperation = "getAll" | "get" | "create" | "update" | "delete";

export type Operation =
  | ServiceProviderConfigOperation
  | ResourceTypeOperation
  | SchemaOperation
  | UserOperation
  | CurrentUserOperation
  | GroupOperation;

export type SendSuccessFunction = (payload?: JsonValue) => void;

export interface SuccessResponse extends IDataObject {
  success: boolean;
}
