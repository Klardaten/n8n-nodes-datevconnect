/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test, beforeEach, afterEach, spyOn, mock } from "bun:test";
import { AccountingSumsAndBalancesResourceHandler } from "../../../../nodes/Accounting/handlers/AccountingSumsAndBalancesResourceHandler";
import type { AuthContext } from "../../../../nodes/Accounting/types";
import { datevConnectClient } from "../../../../src/services/accountingClient";

// Test spies
let getAccountingSumsAndBalancesSpy: any;
let getAccountingSumsAndBalanceSpy: any;

// Mock data
const mockAccountingSumsAndBalancesData = [
  {
    account_number: "1000",
    account_name: "Cash and Cash Equivalents",
    balance_type: "debit",
    opening_balance: 50000.00,
    period_debits: 125000.00,
    period_credits: 85000.00,
    closing_balance: 90000.00,
    period: "2023-Q1"
  },
  {
    account_number: "2000",
    account_name: "Accounts Payable",
    balance_type: "credit",
    opening_balance: -25000.00,
    period_debits: 45000.00,
    period_credits: 55000.00,
    closing_balance: -35000.00,
    period: "2023-Q1"
  },
  {
    account_number: "4000",
    account_name: "Revenue",
    balance_type: "credit",
    opening_balance: 0.00,
    period_debits: 5000.00,
    period_credits: 150000.00,
    closing_balance: -145000.00,
    period: "2023-Q1"
  }
];

const mockSingleSumsAndBalance = {
  account_number: "1000",
  account_name: "Cash and Cash Equivalents",
  balance_type: "debit",
  opening_balance: 50000.00,
  period_debits: 125000.00,
  period_credits: 85000.00,
  closing_balance: 90000.00,
  period: "2023-Q1",
  details: {
    transactions_count: 245,
    last_updated: "2023-03-31T23:59:59Z"
  }
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
  getNodeParameter: mock((name: string, itemIndex: number, defaultValue?: unknown) => {
    const mockParams: Record<string, unknown> = {
      "accountingSumsAndBalancesId": "BALANCE001",
      "top": 50,
      "skip": 10,
      "select": "account_number,account_name,closing_balance",
      "filter": "balance_type eq 'debit'",
      "expand": "details",
      ...overrides.parameters,
    };
    return mockParams[name] !== undefined ? mockParams[name] : defaultValue;
  }),
  getNode: mock(() => ({ name: "TestNode" })),
  helpers: {
    returnJsonArray: mock((data: any[]) => data.map(entry => ({ json: entry }))),
    constructExecutionMetaData: mock((data: any[], meta: any) => 
      data.map(entry => ({ ...entry, pairedItem: meta.itemData }))
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
  fiscalYearId: "2023"
};

describe("AccountingSumsAndBalancesResourceHandler", () => {
  beforeEach(() => {
    getAccountingSumsAndBalancesSpy = spyOn(datevConnectClient.accounting, "getAccountingSumsAndBalances").mockResolvedValue(mockAccountingSumsAndBalancesData);
    getAccountingSumsAndBalanceSpy = spyOn(datevConnectClient.accounting, "getAccountingSumsAndBalance").mockResolvedValue(mockSingleSumsAndBalance);
  });

  afterEach(() => {
    getAccountingSumsAndBalancesSpy?.mockRestore();
    getAccountingSumsAndBalanceSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches all accounting sums and balances with parameters", async () => {
      const context = createMockContext();
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingSumsAndBalancesSpy).toHaveBeenCalledWith(context, "client-123", "2023", {
        top: 50,
        skip: 10,
        select: "account_number,account_name,closing_balance",
        filter: "balance_type eq 'debit'",
        expand: "details"
      });

      expect(returnData).toHaveLength(3);
      expect(returnData[0].json).toEqual({
        account_number: "1000",
        account_name: "Cash and Cash Equivalents",
        balance_type: "debit",
        opening_balance: 50000.00,
        period_debits: 125000.00,
        period_credits: 85000.00,
        closing_balance: 90000.00,
        period: "2023-Q1"
      });
    });

    test("handles empty results", async () => {
      getAccountingSumsAndBalancesSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(0);
    });

    test("handles null response", async () => {
      getAccountingSumsAndBalancesSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("handles parameters with default values", async () => {
      const context = createMockContext({
        parameters: {
          "top": undefined,
          "skip": undefined,
          "select": undefined,
          "filter": undefined,
          "expand": undefined,
        }
      });
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingSumsAndBalancesSpy).toHaveBeenCalledWith(context, "client-123", "2023", {
        top: 100  // Default value when top is undefined
      });
    });
  });

  describe("get operation", () => {
    test("fetches single sums and balances by ID", async () => {
      const context = createMockContext();
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getAccountingSumsAndBalanceSpy).toHaveBeenCalledWith(context, "client-123", "2023", "BALANCE001");

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        account_number: "1000",
        account_name: "Cash and Cash Equivalents",
        balance_type: "debit",
        opening_balance: 50000.00,
        period_debits: 125000.00,
        period_credits: 85000.00,
        closing_balance: 90000.00,
        period: "2023-Q1",
        details: {
          transactions_count: 245,
          last_updated: "2023-03-31T23:59:59Z"
        }
      });
    });

    test("handles empty results for get operation", async () => {
      getAccountingSumsAndBalanceSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("handles null response for get operation", async () => {
      getAccountingSumsAndBalanceSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

  });

  describe("error handling", () => {
    test("throws NodeOperationError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("unsupportedOperation" as any, mockAuthContext, returnData)
      ).rejects.toThrow("Unknown operation: unsupportedOperation");
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      getAccountingSumsAndBalancesSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true)
        }
      });
      
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Error" });
    });

    test("propagates error when continueOnFail is false", async () => {
      getAccountingSumsAndBalancesSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext();
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData)
      ).rejects.toThrow("API Error");
    });

    test("handles network timeout errors", async () => {
      getAccountingSumsAndBalancesSpy.mockRejectedValueOnce(new Error("Network timeout"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true)
        }
      });
      
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "Network timeout" });
    });

    test("handles authentication errors", async () => {
      getAccountingSumsAndBalancesSpy.mockRejectedValueOnce(new Error("Unauthorized"));
      const context = createMockContext();
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData)
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper execution context", async () => {
      const context = createMockContext();
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingSumsAndBalancesSpy).toHaveBeenCalledWith(
        context,
        expect.any(String),
        expect.any(String),
        expect.any(Object)
      );
    });

    test("handles metadata properly", async () => {
      const context = createMockContext();
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual(mockAccountingSumsAndBalancesData[0]);
    });

    test("respects item index in error handling", async () => {
      getAccountingSumsAndBalancesSpy.mockRejectedValueOnce(new Error("Test error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true)
        }
      });
      
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 8);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({ error: "Test error" });
    });

    test("constructs proper sendSuccess function", async () => {
      const context = createMockContext();
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      // Verify that the handler constructs data properly through BaseResourceHandler
      expect(returnData).toHaveLength(3);
      expect(returnData.every(item => item.json !== undefined)).toBe(true);
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves select parameter", async () => {
      const context = createMockContext({
        parameters: { select: "account_number,closing_balance" }
      });
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingSumsAndBalancesSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ select: "account_number,closing_balance" })
      );
    });

    test("correctly retrieves filter parameter", async () => {
      const context = createMockContext({
        parameters: { filter: "closing_balance gt 0" }
      });
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingSumsAndBalancesSpy).toHaveBeenCalledWith(
        context,
        "client-123", 
        "2023",
        expect.objectContaining({ filter: "closing_balance gt 0" })
      );
    });

    test("correctly retrieves accountingSumsAndBalancesId parameter", async () => {
      const context = createMockContext({
        parameters: { accountingSumsAndBalancesId: "BALANCE999" }
      });
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingSumsAndBalancesSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.any(Object)
      );
    });

    test("correctly retrieves top and skip parameters", async () => {
      const context = createMockContext({
        parameters: { top: 25, skip: 5 }
      });
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingSumsAndBalancesSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ top: 25, skip: 5 })
      );
    });

    test("correctly retrieves expand parameter", async () => {
      const context = createMockContext({
        parameters: { expand: "transactions" }
      });
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingSumsAndBalancesSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ expand: "transactions" })
      );
    });
  });

  describe("data validation", () => {
    test("handles balance data with various numeric formats", async () => {
      const mockDataWithVariousNumbers = [
        {
          account_number: "1000",
          account_name: "Test Account",
          balance_type: "debit",
          opening_balance: 1250.75,
          period_debits: 2500,
          period_credits: 1000.25,
          closing_balance: 2750.5,
          period: "2023-Q1"
        }
      ];
      
      getAccountingSumsAndBalancesSpy.mockResolvedValueOnce(mockDataWithVariousNumbers);
      const context = createMockContext();
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({
        account_number: "1000",
        account_name: "Test Account",
        balance_type: "debit",
        opening_balance: 1250.75,
        period_debits: 2500,
        period_credits: 1000.25,
        closing_balance: 2750.5,
        period: "2023-Q1"
      });
    });

    test("handles balance data with negative balances", async () => {
      const mockDataWithNegativeBalances = [
        {
          account_number: "2000",
          account_name: "Liability Account",
          balance_type: "credit",
          opening_balance: -5000.00,
          period_debits: 1000.00,
          period_credits: 2000.00,
          closing_balance: -6000.00,
          period: "2023-Q1"
        }
      ];
      
      getAccountingSumsAndBalancesSpy.mockResolvedValueOnce(mockDataWithNegativeBalances);
      const context = createMockContext();
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({
        account_number: "2000",
        account_name: "Liability Account", 
        balance_type: "credit",
        opening_balance: -5000.00,
        period_debits: 1000.00,
        period_credits: 2000.00,
        closing_balance: -6000.00,
        period: "2023-Q1"
      });
    });

    test("handles balance data with missing optional fields", async () => {
      const mockDataWithMissingFields = [
        {
          account_number: "3000",
          account_name: "Minimal Account",
          balance_type: "debit",
          closing_balance: 1000.00
          // missing opening_balance, period_debits, period_credits, period
        }
      ];
      
      getAccountingSumsAndBalancesSpy.mockResolvedValueOnce(mockDataWithMissingFields);
      const context = createMockContext();
      const handler = new AccountingSumsAndBalancesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({
        account_number: "3000",
        account_name: "Minimal Account",
        balance_type: "debit",
        closing_balance: 1000.00
      });
    });
  });
});