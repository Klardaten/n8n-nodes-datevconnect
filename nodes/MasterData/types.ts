import type { IDataObject } from "n8n-workflow";
import type { JsonValue, HttpRequestHelper } from "../../src/services/datevConnectClient";

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
  httpHelper?: HttpRequestHelper;
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
 * Parameters for employee-specific operations
 */
export interface EmployeeOperationParams extends BaseOperationParams {
  employeeId: string;
}

/**
 * Parameters for employee creation
 */
export interface CreateEmployeeParams {
  employeeData: JsonValue;
}

/**
 * Parameters for employee updates
 */
export interface UpdateEmployeeParams extends EmployeeOperationParams {
  employeeData: JsonValue;
}

/**
 * Parameters for client group type-specific operations
 */
export interface ClientGroupTypeOperationParams extends BaseOperationParams {
  clientGroupTypeId: string;
}

/**
 * Parameters for client group type creation
 */
export interface CreateClientGroupTypeParams {
  clientGroupTypeData: JsonValue;
}

/**
 * Parameters for client group type updates
 */
export interface UpdateClientGroupTypeParams extends ClientGroupTypeOperationParams {
  clientGroupTypeData: JsonValue;
}

/**
 * Parameters for client category type-specific operations
 */
export interface ClientCategoryTypeOperationParams extends BaseOperationParams {
  clientCategoryTypeId: string;
}

/**
 * Parameters for client category type creation
 */
export interface CreateClientCategoryTypeParams {
  clientCategoryTypeData: JsonValue;
}

/**
 * Parameters for client category type updates
 */
export interface UpdateClientCategoryTypeParams extends ClientCategoryTypeOperationParams {
  clientCategoryTypeData: JsonValue;
}

/**
 * Parameters for addressee-specific operations
 */
export interface AddresseeOperationParams extends BaseOperationParams {
  addresseeId: string;
  expand?: string;
}

/**
 * Parameters for addressee creation
 */
export interface CreateAddresseeParams {
  addresseeData: JsonValue;
  nationalRight?: string;
}

/**
 * Parameters for addressee updates
 */
export interface UpdateAddresseeParams extends AddresseeOperationParams {
  addresseeData: JsonValue;
}

/**
 * Supported resources
 */
export type Resource = "client" | "taxAuthority" | "relationship" | "legalForm" | "corporateStructure" | "employee" | "countryCode" | "clientGroupType" | "clientCategoryType" | "bank" | "areaOfResponsibility" | "addressee";

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
 * Supported employee operations
 */
export type EmployeeOperation = "getAll" | "get" | "create" | "update";

/**
 * Supported country code operations
 */
export type CountryCodeOperation = "getAll";

/**
 * Supported client group type operations
 */
export type ClientGroupTypeOperation = "getAll" | "get" | "create" | "update";

/**
 * Supported client category type operations
 */
export type ClientCategoryTypeOperation = "getAll" | "get" | "create" | "update";

/**
 * Supported bank operations
 */
export type BankOperation = "getAll";

/**
 * Supported area of responsibility operations
 */
export type AreaOfResponsibilityOperation = "getAll";

/**
 * Supported addressee operations
 */
export type AddresseeOperation = "getAll" | "get" | "create" | "update" | "getDeletionLog";

/**
 * All supported operations
 */
export type Operation = ClientOperation | TaxAuthorityOperation | RelationshipOperation | LegalFormOperation | CorporateStructureOperation | EmployeeOperation | CountryCodeOperation | ClientGroupTypeOperation | ClientCategoryTypeOperation | BankOperation | AreaOfResponsibilityOperation | AddresseeOperation;

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