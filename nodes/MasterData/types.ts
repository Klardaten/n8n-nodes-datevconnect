import type { IDataObject } from "n8n-workflow";
import type { JsonValue } from "../../src/services/datevConnectClient";

/**
 * Credentials interface for DATEVconnect API
 */
export interface MasterDataCredentials {
  host: string;
  email: string;
  password: string;
  clientInstanceId: string;
}

/**
 * Common authentication context
 */
export interface AuthContext {
  host: string;
  token: string;
  clientInstanceId: string;
}

/**
 * Base operation parameters that all operations might use
 */
export interface BaseOperationParams {
  select?: string;
  filter?: string;
}

/**
 * Parameters for list operations (getAll)
 */
export interface ListOperationParams extends BaseOperationParams {
  top?: number;
  skip?: number;
}

/**
 * Parameters for client-specific operations
 */
export interface ClientOperationParams extends BaseOperationParams {
  clientId: string;
}

/**
 * Parameters for client creation
 */
export interface CreateClientParams {
  clientData: JsonValue;
  maxNumber?: number;
}

/**
 * Parameters for client updates
 */
export interface UpdateClientParams extends ClientOperationParams {
  clientData: JsonValue;
}

/**
 * Parameters for responsibilities operations
 */
export interface ResponsibilitiesParams extends ClientOperationParams {
  responsibilitiesData?: JsonValue;
}

/**
 * Parameters for categories operations
 */
export interface CategoriesParams extends ClientOperationParams {
  categoriesData?: JsonValue;
}

/**
 * Parameters for groups operations
 */
export interface GroupsParams extends ClientOperationParams {
  groupsData?: JsonValue;
}

/**
 * Parameters for next free number operations
 */
export interface NextFreeNumberParams {
  start: number;
  range?: number;
}

/**
 * Parameters for corporate structure operations
 */
export interface CorporateStructureOperationParams extends BaseOperationParams {
  organizationId: string;
}

/**
 * Parameters for establishment operations
 */
export interface EstablishmentOperationParams extends CorporateStructureOperationParams {
  establishmentId: string;
}

/**
 * Supported resources
 */
export type Resource = "client" | "taxAuthority" | "relationship" | "legalForm" | "corporateStructure";

/**
 * Supported client operations
 */
export type ClientOperation = 
  | "getAll"
  | "get"
  | "create"
  | "update"
  | "getResponsibilities"
  | "updateResponsibilities"
  | "getClientCategories"
  | "updateClientCategories"
  | "getClientGroups"
  | "updateClientGroups"
  | "getDeletionLog"
  | "getNextFreeNumber";

/**
 * Supported tax authority operations
 */
export type TaxAuthorityOperation = "getAll";

/**
 * Supported relationship operations
 */
export type RelationshipOperation = "getAll" | "getTypes";

/**
 * Supported legal form operations
 */
export type LegalFormOperation = "getAll";

/**
 * Supported corporate structure operations
 */
export type CorporateStructureOperation = "getAll" | "get" | "getEstablishment";

/**
 * All supported operations
 */
export type Operation = ClientOperation | TaxAuthorityOperation | RelationshipOperation | LegalFormOperation | CorporateStructureOperation;

/**
 * Success response format
 */
export interface SuccessResponse {
  success: boolean;
  data?: JsonValue;
}

/**
 * Error response format
 */
export interface ErrorResponse {
  error: string;
}

/**
 * Result of normalizing data to objects
 */
export type NormalizedData = IDataObject[];

/**
 * Function type for sending successful responses
 */
export type SendSuccessFunction = (payload?: JsonValue) => void;