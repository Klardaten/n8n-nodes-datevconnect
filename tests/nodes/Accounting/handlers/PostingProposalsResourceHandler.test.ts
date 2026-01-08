/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  describe,
  expect,
  test,
  beforeEach,
  afterEach,
  spyOn,
  mock,
} from "bun:test";
import { PostingProposalsResourceHandler } from "../../../../nodes/Accounting/handlers/PostingProposalsResourceHandler";
import type { AuthContext } from "../../../../nodes/Accounting/types";
import { datevConnectClient } from "../../../../src/services/accountingClient";

// Test spies
let getPostingProposalRulesIncomingSpy: any;
let getPostingProposalRulesOutgoingSpy: any;
let getPostingProposalRulesCashRegisterSpy: any;
let getPostingProposalRuleIncomingSpy: any;
let getPostingProposalRuleOutgoingSpy: any;
let getPostingProposalRuleCashRegisterSpy: any;
let batchPostingProposalsIncomingSpy: any;
let batchPostingProposalsOutgoingSpy: any;
let batchPostingProposalsCashRegisterSpy: any;

// Mock data for rules
const mockIncomingRules = [
  {
    id: "IR001",
    name: "Default Incoming Invoice Rule",
    description: "Standard rule for incoming invoices",
    rule_type: "incoming_invoice",
    is_active: true,
    priority: 1,
    conditions: [
      {
        field: "vendor_name",
        operator: "contains",
        value: "GmbH",
        case_sensitive: false,
      },
      {
        field: "amount",
        operator: "greater_than",
        value: 100.0,
        case_sensitive: false,
      },
    ],
    actions: [
      {
        type: "set_account",
        account_number: "4000",
        account_name: "Operating Expenses",
      },
      {
        type: "set_cost_center",
        cost_center_id: "CC001",
      },
    ],
    created_date: "2023-01-01T10:00:00Z",
    last_modified: "2023-11-01T14:30:00Z",
    last_used: "2023-10-30T09:15:00Z",
    usage_count: 245,
  },
  {
    id: "IR002",
    name: "Utilities Rule",
    description: "Rule for utility bills",
    rule_type: "incoming_invoice",
    is_active: true,
    priority: 2,
    conditions: [
      {
        field: "vendor_name",
        operator: "equals",
        value: "City Utilities",
        case_sensitive: true,
      },
    ],
    actions: [
      {
        type: "set_account",
        account_number: "6300",
        account_name: "Utilities",
      },
    ],
    created_date: "2023-01-15T11:00:00Z",
    last_modified: "2023-10-15T16:00:00Z",
    usage_count: 12,
  },
];

const mockOutgoingRules = [
  {
    id: "OR001",
    name: "Sales Invoice Rule",
    description: "Standard rule for sales invoices",
    rule_type: "outgoing_invoice",
    is_active: true,
    priority: 1,
    conditions: [
      {
        field: "customer_type",
        operator: "equals",
        value: "business",
      },
    ],
    actions: [
      {
        type: "set_account",
        account_number: "8000",
        account_name: "Sales Revenue",
      },
      {
        type: "calculate_tax",
        tax_rate: 0.19,
      },
    ],
    created_date: "2023-01-01T10:00:00Z",
    usage_count: 1458,
  },
];

const mockCashRegisterRules = [
  {
    id: "CR001",
    name: "Cash Sales Rule",
    description: "Rule for cash register sales",
    rule_type: "cash_register",
    is_active: true,
    priority: 1,
    conditions: [
      {
        field: "payment_method",
        operator: "equals",
        value: "cash",
      },
    ],
    actions: [
      {
        type: "set_account",
        account_number: "8400",
        account_name: "Cash Sales",
      },
    ],
    created_date: "2023-01-01T10:00:00Z",
    usage_count: 3254,
  },
];

const mockSingleIncomingRule = {
  id: "IR001",
  name: "Default Incoming Invoice Rule",
  description: "Standard rule for incoming invoices",
  rule_type: "incoming_invoice",
  is_active: true,
  priority: 1,
  conditions: [
    {
      field: "vendor_name",
      operator: "contains",
      value: "GmbH",
      case_sensitive: false,
    },
    {
      field: "amount",
      operator: "greater_than",
      value: 100.0,
      case_sensitive: false,
    },
  ],
  actions: [
    {
      type: "set_account",
      account_number: "4000",
      account_name: "Operating Expenses",
    },
    {
      type: "set_cost_center",
      cost_center_id: "CC001",
    },
  ],
  match_statistics: {
    total_matches: 245,
    successful_applications: 240,
    failed_applications: 5,
    average_processing_time: 125.5,
  },
  validation_rules: [
    {
      field: "vendor_tax_id",
      required: true,
      validation_type: "tax_id_format",
    },
  ],
  created_date: "2023-01-01T10:00:00Z",
  created_by: "admin@company.com",
  last_modified: "2023-11-01T14:30:00Z",
  last_modified_by: "manager@company.com",
  version: 3,
};

const mockBatchResult = {
  batch_id: "BATCH001",
  processing_status: "completed",
  total_items: 50,
  processed_items: 48,
  successful_items: 45,
  failed_items: 3,
  skipped_items: 2,
  processing_start: "2023-11-01T10:00:00Z",
  processing_end: "2023-11-01T10:05:30Z",
  processing_duration: 330.5,
  results: [
    {
      item_id: "INV001",
      status: "success",
      applied_rule: "IR001",
      posting_account: "4000",
      cost_center: "CC001",
      error: null,
      suggestions: null,
    },
    {
      item_id: "INV002",
      status: "failed",
      error: "No matching rule found",
      suggestions: ["Create manual posting", "Review rule conditions"],
      applied_rule: null,
      posting_account: null,
      cost_center: null,
    },
    {
      item_id: "INV003",
      status: "success",
      applied_rule: "IR002",
      posting_account: "6300",
      error: null,
      suggestions: null,
      cost_center: null,
    },
  ],
  warnings: [
    "2 items skipped due to duplicate detection",
    "1 item had validation warnings but was processed",
  ],
  summary: {
    total_amount: 15750.25,
    tax_amount: 2992.55,
    net_amount: 12757.7,
  },
};

// Mock IExecuteFunctions
const createMockContext = (overrides: any = {}) => ({
  getCredentials: mock().mockResolvedValue({
    host: "https://api.example.com",
    email: "user@example.com",
    password: "secret",
    clientInstanceId: "instance-1",
    ...overrides.credentials,
  }),
  getNodeParameter: mock(
    (name: string, itemIndex: number, defaultValue?: unknown) => {
      const mockParams: Record<string, unknown> = {
        ruleId: "IR001",
        batchData: JSON.stringify({
          items: [
            {
              invoice_id: "INV001",
              vendor_name: "Test Vendor GmbH",
              amount: 1500.0,
              currency: "EUR",
            },
            {
              invoice_id: "INV002",
              vendor_name: "Another Vendor",
              amount: 750.5,
              currency: "EUR",
            },
          ],
          processing_options: {
            auto_apply_rules: true,
            validate_before_processing: true,
            skip_duplicates: true,
          },
        }),
        top: 50,
        skip: 10,
        select: "id,name,description,rule_type,is_active,priority",
        filter: "is_active eq true",
        expand: "conditions,actions",
        ...overrides.parameters,
      };
      return mockParams[name] !== undefined ? mockParams[name] : defaultValue;
    },
  ),
  getNode: mock(() => ({ name: "TestNode" })),
  helpers: {
    returnJsonArray: mock((data: any[]) =>
      data.map((entry) => ({ json: entry })),
    ),
    constructExecutionMetaData: mock((data: any[], meta: any) =>
      data.map((entry) => ({ ...entry, pairedItem: meta.itemData })),
    ),
  },
  continueOnFail: mock(() => false),
  ...overrides.context,
});

const mockAuthContext: AuthContext = {
  host: "https://api.example.com",
  token: "test-token",
  clientInstanceId: "instance-1",
  clientId: "client-123",
  fiscalYearId: "FY2023",
};

describe("PostingProposalsResourceHandler", () => {
  beforeEach(() => {
    getPostingProposalRulesIncomingSpy = spyOn(
      datevConnectClient.accounting,
      "getPostingProposalRulesIncoming",
    ).mockResolvedValue(mockIncomingRules as any);
    getPostingProposalRulesOutgoingSpy = spyOn(
      datevConnectClient.accounting,
      "getPostingProposalRulesOutgoing",
    ).mockResolvedValue(mockOutgoingRules as any);
    getPostingProposalRulesCashRegisterSpy = spyOn(
      datevConnectClient.accounting,
      "getPostingProposalRulesCashRegister",
    ).mockResolvedValue(mockCashRegisterRules as any);
    getPostingProposalRuleIncomingSpy = spyOn(
      datevConnectClient.accounting,
      "getPostingProposalRuleIncoming",
    ).mockResolvedValue(mockSingleIncomingRule as any);
    getPostingProposalRuleOutgoingSpy = spyOn(
      datevConnectClient.accounting,
      "getPostingProposalRuleOutgoing",
    ).mockResolvedValue(mockSingleIncomingRule as any);
    getPostingProposalRuleCashRegisterSpy = spyOn(
      datevConnectClient.accounting,
      "getPostingProposalRuleCashRegister",
    ).mockResolvedValue(mockSingleIncomingRule as any);
    batchPostingProposalsIncomingSpy = spyOn(
      datevConnectClient.accounting,
      "batchPostingProposalsIncoming",
    ).mockResolvedValue(mockBatchResult as any);
    batchPostingProposalsOutgoingSpy = spyOn(
      datevConnectClient.accounting,
      "batchPostingProposalsOutgoing",
    ).mockResolvedValue(mockBatchResult as any);
    batchPostingProposalsCashRegisterSpy = spyOn(
      datevConnectClient.accounting,
      "batchPostingProposalsCashRegister",
    ).mockResolvedValue(mockBatchResult as any);
  });

  afterEach(() => {
    getPostingProposalRulesIncomingSpy?.mockRestore();
    getPostingProposalRulesOutgoingSpy?.mockRestore();
    getPostingProposalRulesCashRegisterSpy?.mockRestore();
    getPostingProposalRuleIncomingSpy?.mockRestore();
    getPostingProposalRuleOutgoingSpy?.mockRestore();
    getPostingProposalRuleCashRegisterSpy?.mockRestore();
    batchPostingProposalsIncomingSpy?.mockRestore();
    batchPostingProposalsOutgoingSpy?.mockRestore();
    batchPostingProposalsCashRegisterSpy?.mockRestore();
  });

  describe("getRulesIncoming operation", () => {
    test("fetches all incoming posting proposal rules", async () => {
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getRulesIncoming", mockAuthContext, returnData);

      expect(getPostingProposalRulesIncomingSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        {
          top: 50,
          skip: 10,
          select: "id,name,description,rule_type,is_active,priority",
          filter: "is_active eq true",
          expand: "conditions,actions",
        },
      );

      expect(returnData).toHaveLength(2); // Array with 2 rules becomes 2 items
      expect(returnData[0].json).toEqual(mockIncomingRules[0]);
      expect(returnData[1].json).toEqual(mockIncomingRules[1]);
    });

    test("handles empty results for incoming rules", async () => {
      getPostingProposalRulesIncomingSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getRulesIncoming", mockAuthContext, returnData);

      expect(returnData).toHaveLength(0); // Empty array becomes no items
    });

    test("handles null response for incoming rules", async () => {
      getPostingProposalRulesIncomingSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getRulesIncoming", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true }); // null becomes default success response
    });
  });

  describe("getRulesOutgoing operation", () => {
    test("fetches all outgoing posting proposal rules", async () => {
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getRulesOutgoing", mockAuthContext, returnData);

      expect(getPostingProposalRulesOutgoingSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        {
          top: 50,
          skip: 10,
          select: "id,name,description,rule_type,is_active,priority",
          filter: "is_active eq true",
          expand: "conditions,actions",
        },
      );

      expect(returnData).toHaveLength(1); // Array with 1 rule becomes 1 item
      expect(returnData[0].json).toEqual(mockOutgoingRules[0]);
    });

    test("handles custom parameters for outgoing rules", async () => {
      const context = createMockContext({
        parameters: {
          top: 20,
          filter: "priority le 5",
          select: "id,name,is_active",
        },
      });
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getRulesOutgoing", mockAuthContext, returnData);

      expect(getPostingProposalRulesOutgoingSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        expect.objectContaining({
          top: 20,
          filter: "priority le 5",
          select: "id,name,is_active",
        }),
      );
    });
  });

  describe("getRulesCashRegister operation", () => {
    test("fetches all cash register posting proposal rules", async () => {
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute(
        "getRulesCashRegister",
        mockAuthContext,
        returnData,
      );

      expect(getPostingProposalRulesCashRegisterSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        {
          top: 50,
          skip: 10,
          select: "id,name,description,rule_type,is_active,priority",
          filter: "is_active eq true",
          expand: "conditions,actions",
        },
      );

      expect(returnData).toHaveLength(1); // Array with 1 rule becomes 1 item
      expect(returnData[0].json).toEqual(mockCashRegisterRules[0]);
    });
  });

  describe("getRuleIncoming operation", () => {
    test("fetches single incoming posting proposal rule", async () => {
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getRuleIncoming", mockAuthContext, returnData);

      expect(getPostingProposalRuleIncomingSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "IR001",
        {
          top: 50,
          skip: 10,
          select: "id,name,description,rule_type,is_active,priority",
          filter: "is_active eq true",
          expand: "conditions,actions",
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockSingleIncomingRule);
    });

    test("requires ruleId parameter for getRuleIncoming", async () => {
      const context = createMockContext({
        parameters: { ruleId: undefined },
      });
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getRuleIncoming", mockAuthContext, returnData),
      ).rejects.toThrow('Parameter "ruleId" is required');
    });
  });

  describe("getRuleOutgoing operation", () => {
    test("fetches single outgoing posting proposal rule", async () => {
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getRuleOutgoing", mockAuthContext, returnData);

      expect(getPostingProposalRuleOutgoingSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "IR001",
        {
          top: 50,
          skip: 10,
          select: "id,name,description,rule_type,is_active,priority",
          filter: "is_active eq true",
          expand: "conditions,actions",
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockSingleIncomingRule);
    });
  });

  describe("getRuleCashRegister operation", () => {
    test("fetches single cash register posting proposal rule", async () => {
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getRuleCashRegister", mockAuthContext, returnData);

      expect(getPostingProposalRuleCashRegisterSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "IR001",
        {
          top: 50,
          skip: 10,
          select: "id,name,description,rule_type,is_active,priority",
          filter: "is_active eq true",
          expand: "conditions,actions",
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockSingleIncomingRule);
    });

    test("requires ruleId parameter for getRuleCashRegister", async () => {
      const context = createMockContext({
        parameters: { ruleId: "" },
      });
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getRuleCashRegister", mockAuthContext, returnData),
      ).rejects.toThrow('Parameter "ruleId" is required');
    });
  });

  describe("batchIncoming operation", () => {
    test("processes batch incoming posting proposals", async () => {
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("batchIncoming", mockAuthContext, returnData);

      expect(batchPostingProposalsIncomingSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        {
          items: [
            {
              invoice_id: "INV001",
              vendor_name: "Test Vendor GmbH",
              amount: 1500.0,
              currency: "EUR",
            },
            {
              invoice_id: "INV002",
              vendor_name: "Another Vendor",
              amount: 750.5,
              currency: "EUR",
            },
          ],
          processing_options: {
            auto_apply_rules: true,
            validate_before_processing: true,
            skip_duplicates: true,
          },
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockBatchResult);
    });

    test("handles null response from batch incoming", async () => {
      batchPostingProposalsIncomingSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("batchIncoming", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true }); // null becomes default success response
    });

    test("handles invalid JSON in batchData parameter", async () => {
      const context = createMockContext({
        parameters: {
          batchData: "invalid json",
        },
      });
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("batchIncoming", mockAuthContext, returnData),
      ).rejects.toThrow('Invalid JSON in parameter "batchData"');
    });
  });

  describe("batchOutgoing operation", () => {
    test("processes batch outgoing posting proposals", async () => {
      const context = createMockContext({
        parameters: {
          batchData: JSON.stringify({
            items: [
              {
                invoice_id: "OUT001",
                customer_name: "Test Customer Ltd",
                amount: 2500.0,
                currency: "EUR",
              },
            ],
            processing_options: {
              auto_apply_rules: true,
            },
          }),
        },
      });
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("batchOutgoing", mockAuthContext, returnData);

      expect(batchPostingProposalsOutgoingSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              invoice_id: "OUT001",
              customer_name: "Test Customer Ltd",
              amount: 2500.0,
            }),
          ]),
        }),
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockBatchResult);
    });
  });

  describe("batchCashRegister operation", () => {
    test("processes batch cash register posting proposals", async () => {
      const context = createMockContext({
        parameters: {
          batchData: JSON.stringify({
            items: [
              {
                transaction_id: "CASH001",
                payment_method: "cash",
                amount: 45.5,
                currency: "EUR",
              },
            ],
          }),
        },
      });
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("batchCashRegister", mockAuthContext, returnData);

      expect(batchPostingProposalsCashRegisterSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              transaction_id: "CASH001",
              payment_method: "cash",
              amount: 45.5,
            }),
          ]),
        }),
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockBatchResult);
    });

    test("handles undefined batchData parameter gracefully", async () => {
      const context = createMockContext({
        parameters: { batchData: undefined },
      });
      // Override getNodeParameter to return undefined
      context.getNodeParameter = mock(
        (name: string, itemIndex: number, defaultValue?: unknown) => {
          if (name === "batchData") return undefined;
          return defaultValue;
        },
      );

      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("batchCashRegister", mockAuthContext, returnData);

      expect(batchPostingProposalsCashRegisterSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        undefined,
      );
    });
  });

  describe("error handling", () => {
    test("throws NodeOperationError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("unsupportedOperation", mockAuthContext, returnData),
      ).rejects.toThrow(
        'The operation "unsupportedOperation" is not supported for resource "postingProposals".',
      );
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      getPostingProposalRulesIncomingSpy.mockRejectedValueOnce(
        new Error("API Error"),
      );
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getRulesIncoming", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Error" });
    });

    test("propagates error when continueOnFail is false", async () => {
      getPostingProposalRulesOutgoingSpy.mockRejectedValueOnce(
        new Error("API Error"),
      );
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getRulesOutgoing", mockAuthContext, returnData),
      ).rejects.toThrow("API Error");
    });

    test("handles network timeout errors in batch operations", async () => {
      batchPostingProposalsIncomingSpy.mockRejectedValueOnce(
        new Error("Network timeout"),
      );
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("batchIncoming", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "Network timeout" });
    });

    test("handles authentication errors", async () => {
      getPostingProposalRuleIncomingSpy.mockRejectedValueOnce(
        new Error("Unauthorized"),
      );
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getRuleIncoming", mockAuthContext, returnData),
      ).rejects.toThrow("Unauthorized");
    });

    test("handles validation errors from batch operations", async () => {
      batchPostingProposalsOutgoingSpy.mockRejectedValueOnce(
        new Error("Validation Error: Missing required field"),
      );
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("batchOutgoing", mockAuthContext, returnData),
      ).rejects.toThrow("Validation Error: Missing required field");
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper execution context", async () => {
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getRulesIncoming", mockAuthContext, returnData);

      expect(getPostingProposalRulesIncomingSpy).toHaveBeenCalledWith(
        context,
        expect.any(String),
        expect.any(String),
        expect.any(Object),
      );
    });

    test("handles metadata properly", async () => {
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getRulesIncoming", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual(mockIncomingRules[0]);
    });

    test("respects item index in error handling", async () => {
      getPostingProposalRulesIncomingSpy.mockRejectedValueOnce(
        new Error("Test error"),
      );
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new PostingProposalsResourceHandler(context, 2);
      const returnData: any[] = [];

      await handler.execute("getRulesIncoming", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({ error: "Test error" });
    });

    test("constructs proper sendSuccess function", async () => {
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getRulesIncoming", mockAuthContext, returnData);

      // Verify that the handler constructs data properly through BaseResourceHandler
      expect(returnData).toHaveLength(2); // Array with 2 rules becomes 2 items
      expect(returnData[0].json).toBeDefined();
    });

    test("uses parseJsonParameter correctly for batch operations", async () => {
      const context = createMockContext({
        parameters: {
          batchData: JSON.stringify({
            test: "data",
            items: [],
          }),
        },
      });
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("batchIncoming", mockAuthContext, returnData);

      expect(batchPostingProposalsIncomingSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        expect.objectContaining({
          test: "data",
          items: [],
        }),
      );
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves ruleId parameter", async () => {
      const context = createMockContext({
        parameters: { ruleId: "TEST_RULE" },
      });
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getRuleIncoming", mockAuthContext, returnData);

      expect(getPostingProposalRuleIncomingSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "TEST_RULE",
        expect.any(Object),
      );
    });

    test("correctly retrieves query parameters for rules", async () => {
      const context = createMockContext({
        parameters: {
          top: 25,
          skip: 5,
          select: "id,name,priority",
          filter: "rule_type eq 'incoming_invoice'",
          expand: "conditions",
        },
      });
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getRulesIncoming", mockAuthContext, returnData);

      expect(getPostingProposalRulesIncomingSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        expect.objectContaining({
          top: 25,
          skip: 5,
          select: "id,name,priority",
          filter: "rule_type eq 'incoming_invoice'",
          expand: "conditions",
        }),
      );
    });

    test("correctly parses complex batchData", async () => {
      const complexBatchData = {
        items: [
          {
            invoice_id: "INV001",
            vendor_name: "Complex Vendor Ltd",
            amount: 5000.0,
            currency: "EUR",
            line_items: [
              {
                description: "Service A",
                amount: 3000.0,
                account: "4000",
              },
              {
                description: "Service B",
                amount: 2000.0,
                account: "4100",
              },
            ],
          },
        ],
        processing_options: {
          auto_apply_rules: true,
          validation_level: "strict",
          notification_email: "accounting@company.com",
        },
        metadata: {
          batch_name: "Monthly Processing",
          created_by: "system",
        },
      };

      const context = createMockContext({
        parameters: {
          batchData: JSON.stringify(complexBatchData),
        },
      });
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("batchIncoming", mockAuthContext, returnData);

      expect(batchPostingProposalsIncomingSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              invoice_id: "INV001",
              vendor_name: "Complex Vendor Ltd",
              line_items: expect.arrayContaining([
                expect.objectContaining({ description: "Service A" }),
                expect.objectContaining({ description: "Service B" }),
              ]),
            }),
          ]),
          processing_options: expect.objectContaining({
            auto_apply_rules: true,
            validation_level: "strict",
          }),
          metadata: expect.objectContaining({
            batch_name: "Monthly Processing",
          }),
        }),
      );
    });

    test("handles empty batchData object", async () => {
      const context = createMockContext({
        parameters: {
          batchData: JSON.stringify({}),
        },
      });
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("batchIncoming", mockAuthContext, returnData);

      expect(batchPostingProposalsIncomingSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        {},
      );
    });
  });

  describe("data validation", () => {
    test("handles various rule types in responses", async () => {
      const mixedRules = [
        { id: "R1", rule_type: "incoming_invoice", priority: 1 },
        { id: "R2", rule_type: "expense_report", priority: 2 },
        { id: "R3", rule_type: "vendor_credit", priority: 3 },
      ];

      getPostingProposalRulesIncomingSpy.mockResolvedValueOnce(
        mixedRules as any,
      );
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getRulesIncoming", mockAuthContext, returnData);

      expect(returnData).toHaveLength(3); // Array with 3 rules becomes 3 items
      expect(returnData[0].json).toEqual(mixedRules[0]);
      expect(returnData[0].json.rule_type).toBe("incoming_invoice");
      expect(returnData[1].json.rule_type).toBe("expense_report");
      expect(returnData[2].json.rule_type).toBe("vendor_credit");
    });

    test("handles complex rule conditions and actions", async () => {
      const complexRule = {
        id: "COMPLEX001",
        name: "Complex Multi-Condition Rule",
        conditions: [
          {
            field: "vendor_name",
            operator: "matches_regex",
            value: "^[A-Z][a-z]+ (GmbH|Ltd|Inc)$",
            case_sensitive: false,
          },
          {
            field: "amount",
            operator: "between",
            min_value: 100.0,
            max_value: 10000.0,
          },
          {
            field: "invoice_date",
            operator: "within_days",
            days: 30,
          },
        ],
        actions: [
          {
            type: "set_account",
            account_number: "4000",
            condition: "default",
          },
          {
            type: "set_cost_center",
            cost_center_id: "CC001",
            allocation_percentage: 0.6,
          },
          {
            type: "create_workflow",
            workflow_id: "APPROVAL_001",
            trigger_amount: 5000.0,
          },
        ],
      };

      getPostingProposalRuleIncomingSpy.mockResolvedValueOnce(complexRule);
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getRuleIncoming", mockAuthContext, returnData);

      expect(returnData[0].json.conditions).toHaveLength(3);
      expect(returnData[0].json.actions).toHaveLength(3);
      expect(returnData[0].json.conditions[0].operator).toBe("matches_regex");
      expect(returnData[0].json.actions[2].type).toBe("create_workflow");
    });

    test("handles batch processing results with various statuses", async () => {
      const detailedBatchResult = {
        batch_id: "BATCH002",
        processing_status: "completed_with_warnings",
        results: [
          {
            item_id: "INV001",
            status: "success",
            processing_time: 45.2,
          },
          {
            item_id: "INV002",
            status: "failed",
            error_code: "NO_MATCHING_RULE",
            error_details: "No rule matched the given conditions",
          },
          {
            item_id: "INV003",
            status: "warning",
            warning_code: "PARTIAL_MATCH",
            warning_details: "Rule matched but with low confidence",
          },
          {
            item_id: "INV004",
            status: "skipped",
            skip_reason: "Duplicate detected",
          },
        ],
      };

      batchPostingProposalsIncomingSpy.mockResolvedValueOnce(
        detailedBatchResult,
      );
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("batchIncoming", mockAuthContext, returnData);

      expect(returnData[0].json.results).toHaveLength(4);
      expect(returnData[0].json.results[0].status).toBe("success");
      expect(returnData[0].json.results[1].status).toBe("failed");
      expect(returnData[0].json.results[2].status).toBe("warning");
      expect(returnData[0].json.results[3].status).toBe("skipped");
    });

    test("handles boolean flags in rules", async () => {
      const rulesWithFlags = [
        {
          id: "R1",
          is_active: true,
          auto_apply: false,
          requires_approval: true,
          case_sensitive: false,
        },
        {
          id: "R2",
          is_active: false,
          auto_apply: true,
          requires_approval: false,
          case_sensitive: true,
        },
      ];

      getPostingProposalRulesOutgoingSpy.mockResolvedValueOnce(
        rulesWithFlags as any,
      );
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getRulesOutgoing", mockAuthContext, returnData);

      expect(returnData).toHaveLength(2); // Array with 2 rules becomes 2 items
      expect(returnData[0].json.is_active).toBe(true);
      expect(returnData[0].json.auto_apply).toBe(false);
      expect(returnData[1].json.is_active).toBe(false);
      expect(returnData[1].json.case_sensitive).toBe(true);
    });

    test("handles numeric precision in amounts and percentages", async () => {
      const preciseRule = {
        id: "PRECISE001",
        conditions: [
          {
            field: "amount",
            operator: "greater_than",
            value: 1234.5678,
          },
        ],
        actions: [
          {
            type: "apply_discount",
            percentage: 0.125, // 12.5%
            max_discount: 999.99,
          },
        ],
        usage_statistics: {
          success_rate: 0.9876,
          average_processing_time: 123.456789,
        },
      };

      getPostingProposalRuleIncomingSpy.mockResolvedValueOnce(preciseRule);
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getRuleIncoming", mockAuthContext, returnData);

      expect(returnData[0].json.conditions[0].value).toBe(1234.5678);
      expect(returnData[0].json.actions[0].percentage).toBe(0.125);
      expect(returnData[0].json.usage_statistics.success_rate).toBe(0.9876);
    });

    test("handles date fields correctly", async () => {
      const ruleWithDates = {
        id: "DATE001",
        created_date: "2023-01-01T10:00:00Z",
        last_modified: "2023-11-01T14:30:00Z",
        effective_from: "2023-01-01",
        effective_until: "2023-12-31",
        last_executed: "2023-10-30T09:15:00Z",
      };

      getPostingProposalRuleIncomingSpy.mockResolvedValueOnce(ruleWithDates);
      const context = createMockContext();
      const handler = new PostingProposalsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getRuleIncoming", mockAuthContext, returnData);

      expect(returnData[0].json.created_date).toBe("2023-01-01T10:00:00Z");
      expect(returnData[0].json.last_modified).toBe("2023-11-01T14:30:00Z");
      expect(returnData[0].json.effective_from).toBe("2023-01-01");
      expect(returnData[0].json.effective_until).toBe("2023-12-31");
    });
  });
});
