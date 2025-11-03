import type { IDataObject } from "n8n-workflow";
import type { JsonValue } from "../../src/services/datevConnectClient";

/**
 * Credentials interface for DATEVconnect API
 */
export interface DocumentManagementCredentials {
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
 * Parameters for document-specific operations
 */
export interface DocumentOperationParams extends BaseOperationParams {
  documentId: string;
}

/**
 * Parameters for document creation
 */
export interface CreateDocumentParams {
  documentData: JsonValue;
}

/**
 * Parameters for document updates
 */
export interface UpdateDocumentParams extends DocumentOperationParams {
  documentData: JsonValue;
}

/**
 * Parameters for structure item operations
 */
export interface StructureItemParams extends DocumentOperationParams {
  structureItemId?: string;
  insertPosition?: "first" | "last";
}

/**
 * Parameters for document file operations
 */
export interface DocumentFileParams {
  documentFileId: string;
}

/**
 * Parameters for domain operations
 */
export interface DomainOperationParams extends BaseOperationParams {
  domainId?: string;
}

/**
 * Parameters for document state operations
 */
export interface DocumentStateOperationParams extends BaseOperationParams {
  stateId?: string;
}

/**
 * Parameters for individual reference operations
 */
export interface IndividualReferenceParams extends BaseOperationParams {
  referenceId?: string;
  referenceData?: JsonValue;
}

/**
 * Parameters for dispatcher information
 */
export interface DispatcherInformationParams extends DocumentOperationParams {
  dispatcherData: JsonValue;
}

/**
 * Supported resources
 */
export type Resource = 
  | "document" 
  | "documentFile" 
  | "domain" 
  | "documentState" 
  | "secureArea" 
  | "propertyTemplate" 
  | "individualProperty" 
  | "individualReference1" 
  | "individualReference2"
  | "info";

/**
 * Supported document operations
 */
export type DocumentOperation = 
  | "getAll"
  | "get"
  | "create"
  | "update"
  | "delete"
  | "deletePermanently"
  | "getStructureItems"
  | "addStructureItem"
  | "getStructureItem"
  | "updateStructureItem"
  | "createDispatcherInformation";

/**
 * Supported document file operations
 */
export type DocumentFileOperation = 
  | "get"
  | "upload";

/**
 * Supported domain operations
 */
export type DomainOperation = "getAll";

/**
 * Supported document state operations
 */
export type DocumentStateOperation = 
  | "getAll"
  | "get"
  | "create";

/**
 * Supported secure area operations
 */
export type SecureAreaOperation = "getAll";

/**
 * Supported property template operations
 */
export type PropertyTemplateOperation = "getAll";

/**
 * Supported individual property operations
 */
export type IndividualPropertyOperation = "getAll";

/**
 * Supported individual reference operations
 */
export type IndividualReferenceOperation = 
  | "getAll"
  | "create";

/**
 * Supported info operations
 */
export type InfoOperation = "get";

/**
 * All supported operations
 */
export type Operation = 
  | DocumentOperation 
  | DocumentFileOperation 
  | DomainOperation 
  | DocumentStateOperation 
  | SecureAreaOperation 
  | PropertyTemplateOperation 
  | IndividualPropertyOperation 
  | IndividualReferenceOperation 
  | InfoOperation;

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