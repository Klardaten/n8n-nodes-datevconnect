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
import { FiscalYearResourceHandler } from "../../../../nodes/Accounting/handlers/FiscalYearResourceHandler";
import type { AuthContext } from "../../../../nodes/Accounting/types";
import { datevConnectClient } from "../../../../src/services/accountingClient";

// Test spies
let getFiscalYearsSpy: any;
let getFiscalYearSpy: any;

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
        fiscalYearId: "2023",
        top: 50,
        skip: 10,
        select: "id,period_from,period_to",
        filter: "status eq active",
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
  fiscalYearId: "2023", // Add fiscalYearId for get operations
};

describe("FiscalYearResourceHandler", () => {
  beforeEach(() => {
    getFiscalYearsSpy = spyOn(
      datevConnectClient.accounting,
      "getFiscalYears",
    ).mockResolvedValue([
      {
        id: "2023",
        period_from: "2023-01-01",
        period_to: "2023-12-31",
        status: "active",
      },
      {
        id: "2022",
        period_from: "2022-01-01",
        period_to: "2022-12-31",
        status: "closed",
      },
    ]);

    getFiscalYearSpy = spyOn(
      datevConnectClient.accounting,
      "getFiscalYear",
    ).mockResolvedValue({
      id: "2023",
      period_from: "2023-01-01",
      period_to: "2023-12-31",
      status: "active",
      created_at: "2023-01-01T00:00:00Z",
    });
  });

  afterEach(() => {
    getFiscalYearsSpy?.mockRestore();
    getFiscalYearSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches fiscal years with parameters", async () => {
      const context = createMockContext();
      const handler = new FiscalYearResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getFiscalYearsSpy).toHaveBeenCalledWith(context, "client-123", {
        top: 50,
        skip: 10,
        select: "id,period_from,period_to",
        filter: "status eq active",
      });

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({
        id: "2023",
        period_from: "2023-01-01",
        period_to: "2023-12-31",
        status: "active",
      });
    });

    test("handles empty results", async () => {
      getFiscalYearsSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new FiscalYearResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(0);
    });

    test("handles parameters with default values", async () => {
      const context = createMockContext({
        parameters: {
          top: undefined,
          skip: undefined,
          select: undefined,
          filter: undefined,
        },
      });
      const handler = new FiscalYearResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getFiscalYearsSpy).toHaveBeenCalledWith(context, "client-123", {
        top: 100, // Default value when top is undefined
      });
    });
  });

  describe("get operation", () => {
    test("fetches single fiscal year by ID", async () => {
      const context = createMockContext();
      const handler = new FiscalYearResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getFiscalYearSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        {
          top: 50,
          skip: 10,
          select: "id,period_from,period_to",
          filter: "status eq active",
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "2023",
        period_from: "2023-01-01",
        period_to: "2023-12-31",
        status: "active",
        created_at: "2023-01-01T00:00:00Z",
      });
    });

    test("handles parameters with default values for get", async () => {
      const context = createMockContext({
        parameters: {
          fiscalYearId: "2023",
          select: undefined,
        },
      });
      const handler = new FiscalYearResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getFiscalYearSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        {
          top: 50,
          skip: 10,
          filter: "status eq active",
        },
      );
    });
  });

  describe("error handling", () => {
    test("throws NodeApiError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new FiscalYearResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute(
          "unsupportedOperation" as any,
          mockAuthContext,
          returnData,
        ),
      ).rejects.toThrow(
        'The operation "unsupportedOperation" is not supported for resource "fiscalYear".',
      );
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      getFiscalYearsSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });
      const handler = new FiscalYearResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Error" });
    });

    test("propagates error when continueOnFail is false", async () => {
      getFiscalYearsSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext();
      const handler = new FiscalYearResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("API Error");
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper execution context", async () => {
      const context = createMockContext();
      const handler = new FiscalYearResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getFiscalYearsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        expect.any(Object),
      );
    });

    test("handles metadata properly", async () => {
      const context = createMockContext();
      const handler = new FiscalYearResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0]).toHaveProperty("pairedItem");
      expect(returnData[0].pairedItem).toEqual({ item: 0 });
    });

    test("respects item index in error handling", async () => {
      const context = createMockContext();
      const handler = new FiscalYearResourceHandler(context, 3); // Different item index
      const returnData: any[] = [];

      await expect(
        handler.execute(
          "unsupportedOperation" as any,
          mockAuthContext,
          returnData,
        ),
      ).rejects.toThrow(
        'The operation "unsupportedOperation" is not supported for resource "fiscalYear".',
      );
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves select parameter", async () => {
      const context = createMockContext({
        parameters: { select: "id,period_from,period_to,status" },
      });
      const handler = new FiscalYearResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getFiscalYearsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        expect.objectContaining({ select: "id,period_from,period_to,status" }),
      );
    });

    test("correctly retrieves filter parameter", async () => {
      const context = createMockContext({
        parameters: { filter: "status eq 'active'" },
      });
      const handler = new FiscalYearResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getFiscalYearsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        expect.objectContaining({ filter: "status eq 'active'" }),
      );
    });

    test("correctly retrieves fiscalYearId parameter", async () => {
      const context = createMockContext({
        parameters: { fiscalYearId: "test-fiscal-year-id" },
      });
      const handler = new FiscalYearResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getFiscalYearSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        {
          top: 50,
          skip: 10,
          select: "id,period_from,period_to",
          filter: "status eq active",
        },
      );
    });

    test("correctly retrieves top and skip parameters", async () => {
      const context = createMockContext({
        parameters: {
          top: 25,
          skip: 5,
        },
      });
      const handler = new FiscalYearResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getFiscalYearsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        expect.objectContaining({
          top: 25,
          skip: 5,
        }),
      );
    });
  });
});
