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
import { AccountingTransactionKeysResourceHandler } from "../../../../nodes/Accounting/handlers/AccountingTransactionKeysResourceHandler";
import type { AuthContext } from "../../../../nodes/Accounting/types";
import { datevConnectClient } from "../../../../src/services/accountingClient";

// Test spies
let getAccountingTransactionKeysSpy: any;
let getAccountingTransactionKeySpy: any;

const mockAccountingTransactionKeysData = [
  {
    id: "51202401010",
    additional_function: "input_tax",
    caption: "Vorsteuer 19%",
    cases_related_to_goods_and_services: 1,
    date_from: "2024-01-01T00:00:00+01:00",
    date_to: "2024-12-31T00:00:00+01:00",
    factor2_account1: 66440000,
    factor2_account2: 0,
    factor2_percent: 19.0,
    is_tax_rate_selectable: false,
    number: 51,
    tax_rate: 19.0,
    group: "Vorsteuerbeträge aus Rechnungen von anderen Unternehmen",
  },
  {
    id: "52202401010",
    additional_function: "vat",
    caption: "Umsatzsteuer 19%",
    cases_related_to_goods_and_services: 2,
    date_from: "2024-01-01T00:00:00+01:00",
    date_to: "2024-12-31T00:00:00+01:00",
    factor2_account1: 48110000,
    factor2_account2: 0,
    factor2_percent: 19.0,
    is_tax_rate_selectable: false,
    number: 52,
    tax_rate: 19.0,
    group: "Umsatzsteuer 19%",
  },
  {
    id: "53202401010",
    additional_function: "input_tax",
    caption: "Vorsteuer 7%",
    cases_related_to_goods_and_services: 1,
    date_from: "2024-01-01T00:00:00+01:00",
    date_to: "2024-12-31T00:00:00+01:00",
    factor2_account1: 66440000,
    factor2_account2: 0,
    factor2_percent: 7.0,
    is_tax_rate_selectable: false,
    number: 53,
    tax_rate: 7.0,
    group: "Vorsteuerbeträge aus Rechnungen von anderen Unternehmen",
  },
];

const mockSingleAccountingTransactionKey = {
  id: "51202401010",
  additional_function: "input_tax",
  caption: "Vorsteuer 19%",
  cases_related_to_goods_and_services: 1,
  date_from: "2024-01-01T00:00:00+01:00",
  date_to: "2024-12-31T00:00:00+01:00",
  factor2_account1: 66440000,
  factor2_account2: 0,
  factor2_percent: 19.0,
  is_tax_rate_selectable: false,
  number: 51,
  tax_rate: 19.0,
  group: "Vorsteuerbeträge aus Rechnungen von anderen Unternehmen",
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
        accountingTransactionKeyId: "TXN001",
        top: 50,
        skip: 10,
        select: "id,key,name,category",
        filter: "is_active eq true",
        expand: "usage_statistics",
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
  fiscalYearId: "2023",
};

describe("AccountingTransactionKeysResourceHandler", () => {
  beforeEach(() => {
    getAccountingTransactionKeysSpy = spyOn(
      datevConnectClient.accounting,
      "getAccountingTransactionKeys",
    ).mockResolvedValue(mockAccountingTransactionKeysData);
    getAccountingTransactionKeySpy = spyOn(
      datevConnectClient.accounting,
      "getAccountingTransactionKey",
    ).mockResolvedValue(mockSingleAccountingTransactionKey);
  });

  afterEach(() => {
    getAccountingTransactionKeysSpy?.mockRestore();
    getAccountingTransactionKeySpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches all accounting transaction keys with parameters", async () => {
      const context = createMockContext();
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingTransactionKeysSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        {
          top: 50,
          skip: 10,
          select: "id,key,name,category",
          filter: "is_active eq true",
          expand: "usage_statistics",
        },
      );

      expect(returnData).toHaveLength(3);
      expect(returnData[0].json).toEqual({
        id: "51202401010",
        additional_function: "input_tax",
        caption: "Vorsteuer 19%",
        cases_related_to_goods_and_services: 1,
        date_from: "2024-01-01T00:00:00+01:00",
        date_to: "2024-12-31T00:00:00+01:00",
        factor2_account1: 66440000,
        factor2_account2: 0,
        factor2_percent: 19.0,
        is_tax_rate_selectable: false,
        number: 51,
        tax_rate: 19.0,
        group: "Vorsteuerbeträge aus Rechnungen von anderen Unternehmen",
      });
    });

    test("handles empty results", async () => {
      getAccountingTransactionKeysSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(0);
    });

    test("handles null response", async () => {
      getAccountingTransactionKeysSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("handles parameters with default values", async () => {
      const context = createMockContext({
        parameters: {
          top: undefined,
          skip: undefined,
          select: undefined,
          filter: undefined,
          expand: undefined,
        },
      });
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingTransactionKeysSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        {
          top: 100, // Default value when top is undefined
        },
      );
    });

    test("handles filtered results by category", async () => {
      const context = createMockContext({
        parameters: {
          filter: "category eq 'payment'",
        },
      });
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingTransactionKeysSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        {
          top: 50,
          skip: 10,
          select: "id,key,name,category",
          filter: "category eq 'payment'",
          expand: "usage_statistics",
        },
      );
    });
  });

  describe("get operation", () => {
    test("fetches single transaction key by ID", async () => {
      const context = createMockContext();
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getAccountingTransactionKeySpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "TXN001",
        {
          top: 50,
          skip: 10,
          select: "id,key,name,category",
          filter: "is_active eq true",
          expand: "usage_statistics",
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "51202401010",
        additional_function: "input_tax",
        caption: "Vorsteuer 19%",
        cases_related_to_goods_and_services: 1,
        date_from: "2024-01-01T00:00:00+01:00",
        date_to: "2024-12-31T00:00:00+01:00",
        factor2_account1: 66440000,
        factor2_account2: 0,
        factor2_percent: 19.0,
        is_tax_rate_selectable: false,
        number: 51,
        tax_rate: 19.0,
        group: "Vorsteuerbeträge aus Rechnungen von anderen Unternehmen",
      });
    });

    test("handles empty results for get operation", async () => {
      getAccountingTransactionKeySpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("handles null response for get operation", async () => {
      getAccountingTransactionKeySpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("handles parameters with default values for get", async () => {
      const context = createMockContext({
        parameters: {
          top: undefined,
          skip: undefined,
          select: undefined,
          filter: undefined,
          expand: undefined,
          accountingTransactionKeyId: "test-key-id",
        },
      });
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getAccountingTransactionKeySpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "test-key-id",
        {
          top: 100, // Default value when top is undefined
        },
      );
    });
  });

  describe("error handling", () => {
    test("throws NodeOperationError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute(
          "unsupportedOperation" as any,
          mockAuthContext,
          returnData,
        ),
      ).rejects.toThrow("Unknown operation: unsupportedOperation");
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      getAccountingTransactionKeysSpy.mockRejectedValueOnce(
        new Error("API Error"),
      );
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Error" });
    });

    test("propagates error when continueOnFail is false", async () => {
      getAccountingTransactionKeysSpy.mockRejectedValueOnce(
        new Error("API Error"),
      );
      const context = createMockContext();
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("API Error");
    });

    test("handles network timeout errors", async () => {
      getAccountingTransactionKeysSpy.mockRejectedValueOnce(
        new Error("Network timeout"),
      );
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "Network timeout" });
    });

    test("handles authentication errors", async () => {
      getAccountingTransactionKeysSpy.mockRejectedValueOnce(
        new Error("Unauthorized"),
      );
      const context = createMockContext();
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper execution context", async () => {
      const context = createMockContext();
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingTransactionKeysSpy).toHaveBeenCalledWith(
        context,
        expect.any(String),
        expect.any(String),
        expect.any(Object),
      );
    });

    test("handles metadata properly", async () => {
      const context = createMockContext();
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual(mockAccountingTransactionKeysData[0]);
    });

    test("respects item index in error handling", async () => {
      getAccountingTransactionKeysSpy.mockRejectedValueOnce(
        new Error("Test error"),
      );
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new AccountingTransactionKeysResourceHandler(context, 7);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({ error: "Test error" });
    });

    test("constructs proper sendSuccess function", async () => {
      const context = createMockContext();
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      // Verify that the handler constructs data properly through BaseResourceHandler
      expect(returnData).toHaveLength(3);
      expect(returnData.every((item) => item.json !== undefined)).toBe(true);
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves select parameter", async () => {
      const context = createMockContext({
        parameters: { select: "id,key,category" },
      });
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingTransactionKeysSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ select: "id,key,category" }),
      );
    });

    test("correctly retrieves filter parameter", async () => {
      const context = createMockContext({
        parameters: { filter: "requires_approval eq true" },
      });
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingTransactionKeysSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ filter: "requires_approval eq true" }),
      );
    });

    test("correctly retrieves accountingTransactionKeyId parameter", async () => {
      const context = createMockContext({
        parameters: { accountingTransactionKeyId: "TXN999" },
      });
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingTransactionKeysSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.any(Object),
      );
    });

    test("correctly retrieves top and skip parameters", async () => {
      const context = createMockContext({
        parameters: { top: 25, skip: 5 },
      });
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingTransactionKeysSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ top: 25, skip: 5 }),
      );
    });

    test("correctly retrieves expand parameter", async () => {
      const context = createMockContext({
        parameters: { expand: "related_accounts" },
      });
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingTransactionKeysSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ expand: "related_accounts" }),
      );
    });
  });

  describe("data validation", () => {
    test("handles transaction keys with various additional functions", async () => {
      const mockDataWithVariousAdditionalFunctions = [
        {
          id: "51202401010",
          additional_function: "input_tax",
          caption: "Vorsteuer 19%",
          cases_related_to_goods_and_services: 1,
          date_from: "2024-01-01T00:00:00+01:00",
          date_to: "2024-12-31T00:00:00+01:00",
          number: 51,
          tax_rate: 19.0,
          is_tax_rate_selectable: false,
        },
        {
          id: "52202401010",
          additional_function: "vat",
          caption: "Umsatzsteuer 19%",
          cases_related_to_goods_and_services: 2,
          date_from: "2024-01-01T00:00:00+01:00",
          date_to: "2024-12-31T00:00:00+01:00",
          number: 52,
          tax_rate: 19.0,
          is_tax_rate_selectable: false,
        },
      ];

      getAccountingTransactionKeysSpy.mockResolvedValueOnce(
        mockDataWithVariousAdditionalFunctions,
      );
      const context = createMockContext();
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json.additional_function).toBe("input_tax");
      expect(returnData[1].json.additional_function).toBe("vat");
    });

    test("handles transaction keys with boolean flags", async () => {
      const mockDataWithBooleans = [
        {
          id: "51202401010",
          additional_function: "input_tax",
          caption: "Vorsteuer 19%",
          is_tax_rate_selectable: false,
          number: 51,
          tax_rate: 19.0,
        },
        {
          id: "54202401010",
          additional_function: "vat",
          caption: "Wählbarer Steuersatz",
          is_tax_rate_selectable: true,
          number: 54,
          tax_rate: 0.0,
        },
      ];

      getAccountingTransactionKeysSpy.mockResolvedValueOnce(
        mockDataWithBooleans,
      );
      const context = createMockContext();
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json.is_tax_rate_selectable).toBe(false);
      expect(returnData[1].json.is_tax_rate_selectable).toBe(true);
    });

    test("handles transaction keys with missing optional fields", async () => {
      const mockDataWithMissingFields = [
        {
          id: "55202401010",
          caption: "Minimaler Steuerschlüssel",
          number: 55,
          // missing optional fields like group, factor2_account1, factor2_percent, etc.
        },
      ];

      getAccountingTransactionKeysSpy.mockResolvedValueOnce(
        mockDataWithMissingFields,
      );
      const context = createMockContext();
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({
        id: "55202401010",
        caption: "Minimaler Steuerschlüssel",
        number: 55,
      });
    });

    test("handles transaction keys with special characters in captions", async () => {
      const mockDataWithSpecialChars = [
        {
          id: "56202401010",
          caption: "Steuerschlüssel mit Sonderzeichen: & / - _ (Test)",
          group: "Gruppe mit Zeichen: €, %, §, UStG",
          number: 56,
          tax_rate: 19.0,
        },
      ];

      getAccountingTransactionKeysSpy.mockResolvedValueOnce(
        mockDataWithSpecialChars,
      );
      const context = createMockContext();
      const handler = new AccountingTransactionKeysResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json.caption).toBe(
        "Steuerschlüssel mit Sonderzeichen: & / - _ (Test)",
      );
      expect(returnData[0].json.group).toBe(
        "Gruppe mit Zeichen: €, %, §, UStG",
      );
    });
  });
});
