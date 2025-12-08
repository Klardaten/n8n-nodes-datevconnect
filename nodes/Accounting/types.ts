/**
 * Type definitions for DATEV Accounting API
 */

import type { HttpRequestHelper } from "../../src/services/datevConnectClient";

// Request context for API calls
export interface RequestContext {
  // Authentication data
  host: string;
  token: string;
  clientInstanceId: string;
  httpHelper?: HttpRequestHelper;
  // Operation parameters (conditionally required based on endpoint)
  clientId?: string;        // Optional - not needed for /clients getAll endpoint
  fiscalYearId?: string;    // Optional - not needed for client/fiscal-year endpoints
}

// Legacy alias for backward compatibility during transition
export type AuthContext = RequestContext;

// Supported accounting resources
export type AccountingResource = 
  | "client"
  | "fiscalYear" 
  | "accountsReceivable"
  | "accountsPayable"
  | "accountPosting"
  | "accountingSequence"
  | "postingProposals"
  | "accountingSumsAndBalances"
  | "businessPartners"
  | "generalLedgerAccounts"
  | "termsOfPayment"
  | "stocktakingData"
  | "costSystems"
  | "costCentersUnits"
  | "costCenterProperties"
  | "internalCostServices"
  | "costSequences"
  | "accountingStatistics"
  | "accountingTransactionKeys"
  | "variousAddresses";

// Operations for each resource
export type ClientOperation = "getAll" | "get";
export type FiscalYearOperation = "getAll" | "get";
export type AccountsReceivableOperation = "getAll" | "get" | "getCondensed";
export type AccountsPayableOperation = "getAll" | "get" | "getCondensed";
export type AccountPostingOperation = "getAll" | "get";
export type AccountingSequenceOperation = "create" | "getAll" | "get" | "getAccountingRecords" | "getAccountingRecord";
export type TermsOfPaymentOperation = "getAll" | "get" | "create" | "update";
export type CreditorOperation = "getAll" | "get" | "create" | "update";
export type CostSequenceOperation = "getAll" | "get" | "create";
export type DebitorsOperation = "getAll" | "get" | "create" | "update";
export type FixedAssetOperation = "getAll" | "get";
export type InternalCostServiceOperation = "getAll" | "get" | "create";
export type PostingProposalOperation = "getAll" | "get" | "getRulesIncoming" | "getRulesOutgoing" | "getRulesCashRegister" | "getRuleIncoming" | "getRuleOutgoing" | "getRuleCashRegister" | "batchIncoming" | "batchOutgoing" | "batchCashRegister";
export type StocktakingDataOperation = "getAll" | "get" | "update";
export type VariousAddressOperation = "getAll" | "get" | "create";
export type VariousDocumentOperation = "getAll" | "get";
export type MasterDataCostSequenceOperation = "getAll" | "get" | "create";
export type MasterDataCreditorOperation = "getAll" | "get" | "create" | "update";
export type MasterDataDebitorOperation = "getAll" | "get" | "create" | "update";
export type MasterDataFixedAssetOperation = "getAll" | "get";
export type MasterDataStocktakingDataOperation = "getAll" | "get" | "update";
export type MasterDataVariousAddressOperation = "getAll" | "get" | "create";

// Union type for all operations
export type AccountingOperation = 
  | ClientOperation
  | FiscalYearOperation
  | AccountsReceivableOperation
  | AccountPostingOperation
  | AccountingSequenceOperation
  | PostingProposalOperation
  | TermsOfPaymentOperation
  | StocktakingDataOperation
  | VariousAddressOperation;

// Client entity types
export interface Client {
  id?: string;
  company_data?: CompanyData;
}

export interface CompanyData {
  creditor_identifier?: string;
  name?: string;
  address?: Address;
  communication?: Communication[];
}

export interface Address {
  id?: string;
  street?: string;
  house_number?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  address_usage_type?: AddressUsageType;
}

export interface AddressUsageType {
  is_correspondence_address?: boolean;
  is_main_address?: boolean;
}

export interface Communication {
  id?: string;
  type?: string;
  value?: string;
  communication_usage_type?: CommunicationUsageType;
}

export interface CommunicationUsageType {
  is_main_communication_usage_type?: boolean;
}

// Fiscal Year entity types
export interface FiscalYear {
  id?: string;
  name?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
}

// Accounts Receivable entity types
export interface AccountsReceivable {
  id?: string;
  account_number?: string;
  document_field1?: string;
  date?: string;
  due_date?: string;
  amount?: number;
  open_balance_of_item?: number;
  is_cleared?: boolean;
  debit_credit_identifier?: string;
  additional_information?: AdditionalInformation[];
}

export interface AdditionalInformation {
  additional_information_type?: string;
  content?: string;
}

// Account Posting entity types
export interface AccountPosting {
  id?: string;
  account_number?: string;
  date?: string;
  amount?: number;
  currency?: string;
  description?: string;
  accounting_transaction_key?: string;
}

// Accounting Sequence entity types
export interface AccountingSequence {
  id?: string;
  date_from?: string;
  date_to?: string;
  accounting_reason?: string;
  description?: string;
  accounting_records?: AccountingRecord[];
}

export interface AccountingRecord {
  id?: string;
  account_number?: string;
  date?: string;
  amount?: number;
  description?: string;
  accounting_transaction_key?: string;
}

// Error response type
export interface ErrorResponse {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
}