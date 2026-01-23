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
import { AccountingStatisticsResourceHandler } from "../../../../nodes/Accounting/handlers/AccountingStatisticsResourceHandler";
import type { AuthContext } from "../../../../nodes/Accounting/types";
import { datevConnectClient } from "../../../../src/services/accountingClient";

// Test spies
let getAccountingStatisticsSpy: any;

const mockAccountingStatisticsData = [
  {
    id: "1",
    count_of_accounting_journal: 1250,
    count_of_accounting_prima_nota: 125,
    month: 1,
  },
  {
    id: "2",
    count_of_accounting_journal: 1380,
    count_of_accounting_prima_nota: 138,
    month: 2,
  },
  {
    id: "3",
    count_of_accounting_journal: 1450,
    count_of_accounting_prima_nota: 145,
    month: 3,
  },
];

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
        top: 50,
        skip: 10,
        select: "id,count_of_accounting_journal,month",
        filter: "month ge 1",
        expand: "details",

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

describe("AccountingStatisticsResourceHandler", () => {
  beforeEach(() => {
    getAccountingStatisticsSpy = spyOn(
      datevConnectClient.accounting,
      "getAccountingStatistics",
    ).mockResolvedValue(mockAccountingStatisticsData);
  });

  afterEach(() => {
    getAccountingStatisticsSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches accounting statistics with parameters", async () => {
      const context = createMockContext();
      const handler = new AccountingStatisticsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingStatisticsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        {
          top: 50,
          skip: 10,
          select: "id,count_of_accounting_journal,month",
          filter: "month ge 1",
          expand: "details",
        },
      );

      expect(returnData).toHaveLength(3);
      expect(returnData[0].json).toEqual({
        id: "1",
        count_of_accounting_journal: 1250,
        count_of_accounting_prima_nota: 125,
        month: 1,
      });
    });

    test("handles empty results", async () => {
      getAccountingStatisticsSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new AccountingStatisticsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(0);
    });

    test("handles null response", async () => {
      getAccountingStatisticsSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new AccountingStatisticsResourceHandler(context, 0);
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
      const handler = new AccountingStatisticsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingStatisticsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        {
          top: 100, // Default value when top is undefined
        },
      );
    });

    test("handles custom query parameters", async () => {
      const context = createMockContext({
        parameters: {
          top: 25,
          skip: 5,
          select: "period,net_income",
          filter: "net_income gt 0",
          expand: undefined, // Override default expand parameter
        },
      });
      const handler = new AccountingStatisticsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingStatisticsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        {
          top: 25,
          skip: 5,
          select: "period,net_income",
          filter: "net_income gt 0",
        },
      );
    });
  });

  describe("error handling", () => {
    test("throws NodeOperationError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new AccountingStatisticsResourceHandler(context, 0);
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
      getAccountingStatisticsSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new AccountingStatisticsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Error" });
    });

    test("propagates error when continueOnFail is false", async () => {
      getAccountingStatisticsSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext();
      const handler = new AccountingStatisticsResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("API Error");
    });

    test("handles network timeout errors", async () => {
      getAccountingStatisticsSpy.mockRejectedValueOnce(
        new Error("Network timeout"),
      );
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new AccountingStatisticsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "Network timeout" });
    });

    test("handles authentication errors", async () => {
      getAccountingStatisticsSpy.mockRejectedValueOnce(
        new Error("Unauthorized"),
      );
      const context = createMockContext();
      const handler = new AccountingStatisticsResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper execution context", async () => {
      const context = createMockContext();
      const handler = new AccountingStatisticsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingStatisticsSpy).toHaveBeenCalledWith(
        context,
        expect.any(String),
        expect.any(String),
        expect.any(Object),
      );
    });

    test("handles metadata properly", async () => {
      const context = createMockContext();
      const handler = new AccountingStatisticsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual(mockAccountingStatisticsData[0]);
    });

    test("respects item index in error handling", async () => {
      getAccountingStatisticsSpy.mockRejectedValueOnce(new Error("Test error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new AccountingStatisticsResourceHandler(context, 5);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({ error: "Test error" });
    });

    test("constructs proper sendSuccess function", async () => {
      const context = createMockContext();
      const handler = new AccountingStatisticsResourceHandler(context, 0);
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
        parameters: { select: "id,count_of_accounting_journal" },
      });
      const handler = new AccountingStatisticsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingStatisticsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ select: "id,count_of_accounting_journal" }),
      );
    });

    test("correctly retrieves filter parameter", async () => {
      const context = createMockContext({
        parameters: { filter: "count_of_accounting_journal gt 1000" },
      });
      const handler = new AccountingStatisticsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingStatisticsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({
          filter: "count_of_accounting_journal gt 1000",
        }),
      );
    });

    test("correctly retrieves top and skip parameters", async () => {
      const context = createMockContext({
        parameters: { top: 10, skip: 20 },
      });
      const handler = new AccountingStatisticsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingStatisticsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ top: 10, skip: 20 }),
      );
    });

    test("correctly retrieves expand parameter", async () => {
      const context = createMockContext({
        parameters: { expand: "financial_ratios" },
      });
      const handler = new AccountingStatisticsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingStatisticsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ expand: "financial_ratios" }),
      );
    });
  });

  describe("data validation", () => {
    test("handles statistics data with various numeric formats", async () => {
      const mockDataWithVariousNumbers = [
        {
          id: "15",
          count_of_accounting_journal: 1250,
          count_of_accounting_prima_nota: 125,
          month: 15,
        },
      ];

      getAccountingStatisticsSpy.mockResolvedValueOnce(
        mockDataWithVariousNumbers,
      );
      const context = createMockContext();
      const handler = new AccountingStatisticsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({
        id: "15",
        count_of_accounting_journal: 1250,
        count_of_accounting_prima_nota: 125,
        month: 15,
      });
    });

    test("handles statistics data with missing optional fields", async () => {
      const mockDataWithMissingFields = [
        {
          id: "1",
          count_of_accounting_journal: 1250,
          // missing count_of_accounting_prima_nota, month
        },
      ];

      getAccountingStatisticsSpy.mockResolvedValueOnce(
        mockDataWithMissingFields,
      );
      const context = createMockContext();
      const handler = new AccountingStatisticsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({
        id: "1",
        count_of_accounting_journal: 1250,
      });
    });
  });
});
