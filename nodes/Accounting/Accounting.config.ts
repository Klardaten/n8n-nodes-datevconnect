/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import type { INodeTypeDescription } from "n8n-workflow";

/**
 * Configuration for the Accounting node
 */
export const accountingNodeDescription: INodeTypeDescription = {
  displayName: "Klardaten DATEVconnect: Accounting",
  name: "accounting",
  icon: "file:../klardaten.svg",
  group: ["transform"],
  version: 1,
  description: "Interact with DATEV Accounting API",
  defaults: {
    name: "Accounting",
  },
  inputs: ["main"],
  outputs: ["main"],
  credentials: [
    {
      name: "datevConnectApi",
      required: true,
    },
  ],
  properties: [
    {
      displayName: "Resource",
      name: "resource",
      type: "options",
      noDataExpression: true,
      options: [
        {
          name: "Account Posting",
          value: "accountPosting",
          description: "Operations on account postings",
        },
        {
          name: "Accounting Sequence",
          value: "accountingSequence",
          description: "Operations on accounting sequences",
        },
        {
          name: 'Accounting Statistic',
          value: "accountingStatistics",
          description: "Operations on monthly accounting sequence statistics",
        },
        {
          name: "Accounting Sums and Balance",
          value: "accountingSumsAndBalances",
          description: "Operations on accounting balance sheet and P&L data",
        },
        {
          name: 'Accounting Transaction Key',
          value: "accountingTransactionKeys",
          description: "Operations on accounting transaction key master data",
        },
        {
          name: "Accounts Payable",
          value: "accountsPayable",
          description: "Operations on accounts payable (open items)",
        },
        {
          name: "Accounts Receivable",
          value: "accountsReceivable",
          description: "Operations on accounts receivable (open items)",
        },
        {
          name: "Business Partner",
          value: "businessPartners",
          description: "Operations on debitors (customers) and creditors (suppliers)",
        },
        {
          name: "Client",
          value: "client",
          description: "Operations on accounting clients/companies",
        },
        {
          name: 'Cost Center Property',
          value: "costCenterProperties",
          description: "Operations on cost center properties and attributes",
        },
        {
          name: 'Cost Centers/Unit',
          value: "costCentersUnits",
          description: "Operations on cost centers and cost units",
        },
        {
          name: 'Cost Sequence',
          value: "costSequences",
          description: "Operations on cost accounting sequences",
        },
        {
          name: 'Cost System',
          value: "costSystems",
          description: "Operations on cost accounting systems",
        },
        {
          name: "Fiscal Year",
          value: "fiscalYear",
          description: "Operations on fiscal years",
        },
        {
          name: "General Ledger Account",
          value: "generalLedgerAccounts",
          description: "Operations on chart of accounts",
        },
        {
          name: 'Internal Cost Service',
          value: "internalCostServices",
          description: "Operations on internal cost service allocations",
        },
        {
          name: "Posting Proposal",
          value: "postingProposals",
          description: "Operations on posting proposal rules and batch processing",
        },
        {
          name: "Stocktaking Data",
          value: "stocktakingData",
          description: "Operations on inventory stocktaking data",
        },
        {
          name: "Terms of Payment",
          value: "termsOfPayment",
          description: "Operations on payment terms and conditions",
        },
        {
          name: "Various Addresses",
          value: "variousAddresses",
          description: "Operations on various business partner addresses",
        },
      ],
      default: "client",
    },

    // Client operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["client"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: 'Retrieve a list of many clients/companies',
          action: "Get many clients",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific client/company",
          action: "Get a client",
        },
      ],
      default: "getAll",
    },

    // Fiscal Year operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["fiscalYear"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of fiscal years for a client",
          action: "Get many fiscal years",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific fiscal year",
          action: "Get a fiscal year",
        },
      ],
      default: "getAll",
    },

    // Accounts Receivable operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["accountsReceivable"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of accounts receivable (uncondensed)",
          action: "Get many accounts receivable",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific account receivable",
          action: "Get an account receivable",
        },
        {
          name: "Get Condensed",
          value: "getCondensed",
          description: "Retrieve a condensed list of accounts receivable",
          action: "Get condensed accounts receivable",
        },
      ],
      default: "getAll",
    },

    // Accounts Payable operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["accountsPayable"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of accounts payable (uncondensed)",
          action: "Get many accounts payable",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific account payable",
          action: "Get an account payable",
        },
        {
          name: "Get Condensed",
          value: "getCondensed",
          description: "Retrieve a condensed list of accounts payable",
          action: "Get condensed accounts payable",
        },
      ],
      default: "getAll",
    },

    // Account Posting operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["accountPosting"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of account postings",
          action: "Get many account postings",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific account posting",
          action: "Get an account posting",
        },
      ],
      default: "getAll",
    },

    // Accounting Sequence operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["accountingSequence"],
        },
      },
      options: [
        {
          name: "Create",
          value: "create",
          description: "Create an accounting sequence",
          action: "Create an accounting sequence",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific accounting sequence",
          action: "Get an accounting sequence",
        },
        {
          name: "Get Accounting Record",
          value: "getAccountingRecord",
          description: "Retrieve a specific accounting record from a sequence",
          action: "Get specific accounting record from sequence",
        },
        {
          name: "Get Accounting Records",
          value: "getAccountingRecords",
          description: "Retrieve all accounting records of a specific processed sequence",
          action: "Get accounting records from sequence",
        },
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of processed accounting sequences",
          action: "Get many accounting sequences",
        },
      ],
      default: "getAll",
    },

    // Posting Proposals operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["postingProposals"],
        },
      },
      options: [
        {
          name: "Batch - Cash Register",
          value: "batchCashRegister",
          description: "Process batch of cash register posting proposals",
          action: "Process batch of cash register posting proposals",
        },
        {
          name: "Batch - Incoming",
          value: "batchIncoming",
          description: "Process batch of incoming invoice posting proposals",
          action: "Process batch of incoming invoice posting proposals",
        },
        {
          name: "Batch - Outgoing",
          value: "batchOutgoing",
          description: "Process batch of outgoing invoice posting proposals",
          action: "Process batch of outgoing invoice posting proposals",
        },
        {
          name: "Get Rule - Cash Register",
          value: "getRuleCashRegister",
          description: "Retrieve a specific posting proposal rule for cash register",
          action: "Get a posting proposal rule for cash register",
        },
        {
          name: "Get Rule - Incoming",
          value: "getRuleIncoming",
          description: "Retrieve a specific posting proposal rule for incoming invoices",
          action: "Get a posting proposal rule for incoming invoices",
        },
        {
          name: "Get Rule - Outgoing",
          value: "getRuleOutgoing",
          description: "Retrieve a specific posting proposal rule for outgoing invoices",
          action: "Get a posting proposal rule for outgoing invoices",
        },
        {
          name: "Get Rules - Cash Register",
          value: "getRulesCashRegister",
          description: "Retrieve posting proposal rules for cash register",
          action: "Get posting proposal rules for cash register",
        },
        {
          name: "Get Rules - Incoming",
          value: "getRulesIncoming",
          description: "Retrieve posting proposal rules for incoming invoices",
          action: "Get posting proposal rules for incoming invoices",
        },
        {
          name: "Get Rules - Outgoing",
          value: "getRulesOutgoing",
          description: "Retrieve posting proposal rules for outgoing invoices",
          action: "Get posting proposal rules for outgoing invoices",
        },
      ],
      default: "getRulesIncoming",
    },

    // Accounting Sums and Balances operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["accountingSumsAndBalances"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of accounting sums and balances",
          action: "Get many accounting sums and balances",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific account from sums and balances",
          action: "Get an accounting sums and balances entry",
        },
      ],
      default: "getAll",
    },

    // Business Partners operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["businessPartners"],
        },
      },
      options: [
        {
          name: "Create Creditor",
          value: "createCreditor",
          description: "Create a new creditor",
          action: "Create a creditor",
        },
        {
          name: "Create Debitor",
          value: "createDebitor",
          description: "Create a new debitor",
          action: "Create a debitor",
        },
        {
          name: "Get Creditor",
          value: "getCreditor",
          description: "Retrieve a specific creditor",
          action: "Get a creditor",
        },
        {
          name: "Get Creditors",
          value: "getCreditors",
          description: "Retrieve a list of creditors (suppliers)",
          action: "Get many creditors",
        },
        {
          name: "Get Debitor",
          value: "getDebitor",
          description: "Retrieve a specific debitor",
          action: "Get a debitor",
        },
        {
          name: "Get Debitors",
          value: "getDebitors",
          description: "Retrieve a list of debitors (customers)",
          action: "Get many debitors",
        },
        {
          name: "Get Next Available Creditor",
          value: "getNextAvailableCreditor",
          description: "Get the next available creditor account number",
          action: "Get next available creditor number",
        },
        {
          name: "Get Next Available Debitor",
          value: "getNextAvailableDebitor",
          description: "Get the next available debitor account number",
          action: "Get next available debitor number",
        },
        {
          name: "Update Creditor",
          value: "updateCreditor",
          description: "Update an existing creditor",
          action: "Update a creditor",
        },
        {
          name: "Update Debitor",
          value: "updateDebitor",
          description: "Update an existing debitor",
          action: "Update a debitor",
        },
      ],
      default: "getDebitors",
    },

    // General Ledger Accounts operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["generalLedgerAccounts"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of general ledger accounts",
          action: "Get many general ledger accounts",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific general ledger account",
          action: "Get a general ledger account",
        },
        {
          name: "Get Utilized",
          value: "getUtilized",
          description: "Retrieve a list of utilized general ledger accounts",
          action: "Get utilized general ledger accounts",
        },
      ],
      default: "getAll",
    },

    // Terms of Payment operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["termsOfPayment"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of terms of payment",
          action: "Get many terms of payment",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific term of payment",
          action: "Get a term of payment",
        },
        {
          name: "Create",
          value: "create",
          description: "Create a new term of payment",
          action: "Create a term of payment",
        },
        {
          name: "Update",
          value: "update",
          description: "Update an existing term of payment",
          action: "Update a term of payment",
        },
      ],
      default: "getAll",
    },

    // Stocktaking Data operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["stocktakingData"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of stocktaking data",
          action: "Get many stocktaking data",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific stocktaking data entry",
          action: "Get a stocktaking data entry",
        },
        {
          name: "Create",
          value: "create",
          description: "Create a new stocktaking data entry",
          action: "Create a stocktaking data entry",
        },
      ],
      default: "getAll",
    },

    // Cost Systems operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["costSystems"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of cost systems",
          action: "Get many cost systems",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific cost system",
          action: "Get a cost system",
        },
      ],
      default: "getAll",
    },

    // Cost Centers/Units operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["costCentersUnits"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of cost centers/units",
          action: 'Get many cost centers units',
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific cost center/unit",
          action: 'Get a cost center unit',
        },
      ],
      default: "getAll",
    },

    // Cost Center Properties operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["costCenterProperties"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of cost center properties",
          action: "Get many cost center properties",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific cost center property",
          action: "Get a cost center property",
        },
      ],
      default: "getAll",
    },

    // Internal Cost Services operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["internalCostServices"],
        },
      },
      options: [
        {
          name: "Create",
          value: "create",
          description: "Create internal cost service allocation",
          action: "Create internal cost service",
        },
      ],
      default: "create",
    },

    // Cost Sequences operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["costSequences"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of cost sequences",
          action: "Get many cost sequences",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific cost sequence",
          action: "Get a cost sequence",
        },
        {
          name: "Create",
          value: "create",
          description: "Create a new cost sequence",
          action: "Create a cost sequence",
        },
        {
          name: "Get Cost Accounting Records",
          value: "getCostAccountingRecords",
          description: "Retrieve cost accounting records for a sequence",
          action: "Get cost accounting records",
        },
      ],
      default: "getAll",
    },

    // Accounting Statistics operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["accountingStatistics"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve accounting statistics data",
          action: "Get many accounting statistics",
        },
      ],
      default: "getAll",
    },

    // Accounting Transaction Keys operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["accountingTransactionKeys"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of accounting transaction keys",
          action: "Get many accounting transaction keys",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific accounting transaction key",
          action: "Get an accounting transaction key",
        },
      ],
      default: "getAll",
    },

    // Various Addresses operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["variousAddresses"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of various addresses",
          action: "Get many various addresses",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific various address",
          action: "Get a various address",
        },
        {
          name: "Create",
          value: "create",
          description: "Create a new various address",
          action: "Create a various address",
        },
      ],
      default: "getAll",
    },

    // Common parameters
    {
      displayName: "Client ID",
      name: "clientId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          resource: ["fiscalYear", "accountsReceivable", "accountsPayable", "accountPosting", "accountingSequence", "postingProposals", "accountingSumsAndBalances", "businessPartners", "generalLedgerAccounts", "termsOfPayment", "stocktakingData", "costSystems", "costCentersUnits", "costCenterProperties", "internalCostServices", "costSequences", "accountingStatistics", "accountingTransactionKeys", "variousAddresses"],
        },
      },
      default: "",
      placeholder: "9c18c30b-ac17-451f-81c7-1b9b26dd73fe",
      description: "The ID of the client/company",
    },
    {
      displayName: "Client ID",
      name: "clientId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          operation: ["get"],
          resource: ["client"],
        },
      },
      default: "",
      placeholder: "9c18c30b-ac17-451f-81c7-1b9b26dd73fe",
      description: "The ID of the client/company to retrieve",
    },
    {
      displayName: "Fiscal Year ID",
      name: "fiscalYearId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          resource: ["accountsReceivable", "accountsPayable", "accountPosting", "accountingSequence", "postingProposals", "accountingSumsAndBalances", "businessPartners", "generalLedgerAccounts", "termsOfPayment", "stocktakingData", "costSystems", "costCentersUnits", "costCenterProperties", "internalCostServices", "costSequences", "accountingStatistics", "accountingTransactionKeys", "variousAddresses"],
        },
      },
      default: "",
      placeholder: "20240101",
      description: "The ID of the fiscal year",
    },
    {
      displayName: "Fiscal Year ID",
      name: "fiscalYearId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          operation: ["get"],
          resource: ["fiscalYear"],
        },
      },
      default: "",
      placeholder: "20240101",
      description: "The ID of the fiscal year to retrieve",
    },

    // Entity-specific ID parameters
    {
      displayName: "Accounts Receivable ID",
      name: "accountsReceivableId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          operation: ["get"],
          resource: ["accountsReceivable"],
        },
      },
      default: "",
      placeholder: "2024010116",
      description: "The ID of the accounts receivable entry",
    },
    {
      displayName: "Accounts Payable ID",
      name: "accountsPayableId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          operation: ["get"],
          resource: ["accountsPayable"],
        },
      },
      default: "",
      placeholder: "202401011214",
      description: "The ID of the accounts payable entry",
    },
    {
      displayName: "Account Posting ID",
      name: "accountPostingId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          operation: ["get"],
          resource: ["accountPosting"],
        },
      },
      default: "",
      placeholder: "50959122",
      description: "The ID of the account posting",
    },
    {
      displayName: "Accounting Sequence ID",
      name: "accountingSequenceId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          operation: ["get", "getAccountingRecords", "getAccountingRecord"],
          resource: ["accountingSequence"],
        },
      },
      default: "",
      placeholder: "77",
      description: "The ID of the accounting sequence",
    },
    {
      displayName: "Accounting Record ID",
      name: "accountingRecordId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          operation: ["getAccountingRecord"],
          resource: ["accountingSequence"],
        },
      },
      default: "",
      placeholder: "12345",
      description: "The ID of the accounting record within the sequence",
    },
    {
      displayName: "Posting Proposal Rule ID",
      name: "postingProposalRuleId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          operation: ["getRuleIncoming", "getRuleOutgoing", "getRuleCashRegister"],
          resource: ["postingProposals"],
        },
      },
      default: "",
      placeholder: "1",
      description: "The ID of the posting proposal rule",
    },
    {
      displayName: "Accounting Sums and Balances ID",
      name: "accountingSumsAndBalancesId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          operation: ["get"],
          resource: ["accountingSumsAndBalances"],
        },
      },
      default: "",
      placeholder: "44000000",
      description: "The ID of the account from sums and balances",
    },
    {
      displayName: "Debitor ID",
      name: "debitorId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          operation: ["getDebitor", "updateDebitor"],
          resource: ["businessPartners"],
        },
      },
      default: "",
      placeholder: "105000000",
      description: "The ID of the debitor",
    },
    {
      displayName: "Creditor ID",
      name: "creditorId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          operation: ["getCreditor", "updateCreditor"],
          resource: ["businessPartners"],
        },
      },
      default: "",
      placeholder: "701000000",
      description: "The ID of the creditor",
    },
    {
      displayName: "General Ledger Account ID",
      name: "generalLedgerAccountId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          operation: ["get"],
          resource: ["generalLedgerAccounts"],
        },
      },
      default: "",
      placeholder: "50000",
      description: "The ID of the general ledger account",
    },
    {
      displayName: "Terms of Payment ID",
      name: "termsOfPaymentId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          operation: ["get", "update"],
          resource: ["termsOfPayment"],
        },
      },
      default: "",
      placeholder: "Z001",
      description: "The ID of the terms of payment",
    },
    {
      displayName: "Stocktaking Data ID",
      name: "stocktakingDataId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          operation: ["get"],
          resource: ["stocktakingData"],
        },
      },
      default: "",
      placeholder: "1",
      description: "The ID of the stocktaking data entry",
    },
    {
      displayName: "Cost System ID",
      name: "costSystemId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          operation: ["get"],
          resource: ["costSystems"],
        },
      },
      default: "",
      placeholder: "0",
      description: "The ID of the cost system",
    },
    {
      displayName: "Cost System ID",
      name: "costSystemId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          resource: ["costCentersUnits", "costCenterProperties", "internalCostServices", "costSequences"],
        },
      },
      default: "",
      placeholder: "0",
      description: "The ID of the cost system",
    },
    {
      displayName: "Cost Center/Unit ID",
      name: "costCenterUnitId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          operation: ["get"],
          resource: ["costCentersUnits"],
        },
      },
      default: "",
      placeholder: "100",
      description: "The ID of the cost center or cost unit",
    },
    {
      displayName: "Cost Center Property ID",
      name: "costCenterPropertyId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          operation: ["get"],
          resource: ["costCenterProperties"],
        },
      },
      default: "",
      placeholder: "1",
      description: "The ID of the cost center property",
    },
    {
      displayName: "Cost Sequence ID",
      name: "costSequenceId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          operation: ["get", "create", "getCostAccountingRecords"],
          resource: ["costSequences"],
        },
      },
      default: "",
      placeholder: "1",
      description: "The ID of the cost sequence",
    },
    {
      displayName: "Accounting Transaction Key ID",
      name: "accountingTransactionKeyId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          operation: ["get"],
          resource: ["accountingTransactionKeys"],
        },
      },
      default: "",
      placeholder: "40",
      description: "The ID of the accounting transaction key",
    },
    {
      displayName: "Various Address ID",
      name: "variousAddressId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          operation: ["get"],
          resource: ["variousAddresses"],
        },
      },
      default: "",
      placeholder: "1",
      description: "The ID of the various address",
    },

    // Query parameters for list operations
    {
      displayName: "Limit",
      name: "top",
      type: "number",
      displayOptions: {
        show: {
          operation: [
            "getAll", "getCondensed", "getAccountingRecords",
            "getRulesIncoming", "getRulesOutgoing", "getRulesCashRegister",
            "getDebitors", "getCreditors", "getUtilized"
          ],
        },
      },
      typeOptions: {
        minValue: 1,
      },
      default: 100,
      description: "Maximum number of records to return",
    },
    {
      displayName: "Skip",
      name: "skip",
      type: "number",
      displayOptions: {
        show: {
          operation: [
            "getAll", "getCondensed", "getAccountingRecords",
            "getRulesIncoming", "getRulesOutgoing", "getRulesCashRegister",
            "getDebitors", "getCreditors", "getUtilized"
          ],
        },
      },
      typeOptions: {
        minValue: 0,
      },
      default: 0,
      description: "Number of records to skip from the start",
    },
    {
      displayName: "Select Fields",
      name: "select",
      type: "string",
      displayOptions: {
        show: {
          operation: [
            "getAll", "get", "getCondensed", "getAccountingRecords", "getAccountingRecord",
            "getRulesIncoming", "getRulesOutgoing", "getRulesCashRegister",
            "getRuleIncoming", "getRuleOutgoing", "getRuleCashRegister",
            "getDebitors", "getDebitor", "getCreditors", "getCreditor", "getUtilized"
          ],
        },
      },
      default: "",
      description: "Comma-separated list of fields to include in the response",
    },
    {
      displayName: "Filter",
      name: "filter",
      type: "string",
      displayOptions: {
        show: {
          operation: [
            "getAll", "getCondensed", "getAccountingRecords",
            "getRulesIncoming", "getRulesOutgoing", "getRulesCashRegister",
            "getDebitors", "getCreditors", "getUtilized"
          ],
        },
      },
      default: "",
      description: "Filter expression as defined by the DATEV API",
    },
    {
      displayName: "Expand",
      name: "expand",
      type: "string",
      displayOptions: {
        show: {
          operation: ["get", "getDebitor", "getCreditor", "getDebitors", "getCreditors"],
          resource: ["client", "accountsReceivable", "accountsPayable", "variousAddresses", "businessPartners"],
        },
      },
      default: "",
      description: "Parameter to include subordinate objects (e.g., 'detail,addresses' or '*' for all)",
    },

    // Parameters for create operations
    {
      displayName: "Accounting Sequence Data",
      name: "accountingSequenceData",
      type: "json",
      displayOptions: {
        show: {
          operation: ["create"],
          resource: ["accountingSequence"],
        },
      },
      default: "{}",
      description: "Accounting sequence payload to send to the API",
    },
    {
      displayName: "Posting Proposal Data",
      name: "postingProposalData",
      type: "json",
      displayOptions: {
        show: {
          operation: ["batchIncoming", "batchOutgoing", "batchCashRegister"],
          resource: ["postingProposals"],
        },
      },
      default: "{}",
      description: "Posting proposal batch data to send to the API",
    },
    {
      displayName: "Debitor Data",
      name: "debitorData",
      type: "json",
      displayOptions: {
        show: {
          operation: ["createDebitor", "updateDebitor"],
          resource: ["businessPartners"],
        },
      },
      default: "{}",
      description: "Debitor data to send to the API",
    },
    {
      displayName: "Creditor Data",
      name: "creditorData",
      type: "json",
      displayOptions: {
        show: {
          operation: ["createCreditor", "updateCreditor"],
          resource: ["businessPartners"],
        },
      },
      default: "{}",
      description: "Creditor data to send to the API",
    },
    {
      displayName: "Terms of Payment Data",
      name: "termsOfPaymentData",
      type: "json",
      displayOptions: {
        show: {
          operation: ["create", "update"],
          resource: ["termsOfPayment"],
        },
      },
      default: "{}",
      description: "Terms of payment data to send to the API",
    },
    {
      displayName: "Stocktaking Data",
      name: "stocktakingData",
      type: "json",
      displayOptions: {
        show: {
          operation: ["create"],
          resource: ["stocktakingData"],
        },
      },
      default: "{}",
      description: "Stocktaking data to send to the API",
    },
    {
      displayName: "Internal Cost Service Data",
      name: "internalCostServiceData",
      type: "json",
      displayOptions: {
        show: {
          operation: ["create"],
          resource: ["internalCostServices"],
        },
      },
      default: "{}",
      description: "Internal cost service data to send to the API",
    },
    {
      displayName: "Cost Sequence Data",
      name: "costSequenceData",
      type: "json",
      displayOptions: {
        show: {
          operation: ["create"],
          resource: ["costSequences"],
        },
      },
      default: "{}",
      description: "Cost sequence data to send to the API",
    },
    {
      displayName: "Various Address Data",
      name: "variousAddressData",
      type: "json",
      displayOptions: {
        show: {
          operation: ["create"],
          resource: ["variousAddresses"],
        },
      },
      default: "{}",
      description: "Various address data to send to the API",
    },
  ],
};
