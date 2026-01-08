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
import { AccountsPayableResourceHandler } from "../../../../nodes/Accounting/handlers/AccountsPayableResourceHandler";
import type { AuthContext } from "../../../../nodes/Accounting/types";
import { datevConnectClient } from "../../../../src/services/accountingClient";

// Test spies
let getAccountsPayableSpy: any;
let getAccountPayableSpy: any;
let getAccountsPayableCondensedSpy: any;

// Mock data
const mockAccountsPayableData = [
  {
    id: "ap-123",
    vendor_id: "vendor-123",
    amount: 2000.0,
    due_date: "2023-12-31",
    status: "open",
  },
  {
    id: "ap-456",
    vendor_id: "vendor-456",
    amount: 1250.75,
    due_date: "2023-11-30",
    status: "overdue",
  },
];

const mockSingleAccountPayable = {
  id: "ap-123",
  vendor_id: "vendor-123",
  amount: 2000.0,
  due_date: "2023-12-31",
  status: "open",
  description: "Supplier invoice payment",
};

const mockCondensedData = [
  {
    vendor_id: "vendor-123",
    total_amount: 3500.0,
    count: 2,
  },
  {
    vendor_id: "vendor-456",
    total_amount: 1250.75,
    count: 1,
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
        accountsPayableId: "ap-123",
        top: 50,
        skip: 10,
        select: "id,vendor_id,amount",
        filter: "status eq open",
        expand: "vendor",
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

describe("AccountsPayableResourceHandler", () => {
  beforeEach(() => {
    getAccountsPayableSpy = spyOn(
      datevConnectClient.accounting,
      "getAccountsPayable",
    ).mockResolvedValue(mockAccountsPayableData);
    getAccountPayableSpy = spyOn(
      datevConnectClient.accounting,
      "getAccountPayable",
    ).mockResolvedValue(mockSingleAccountPayable);
    getAccountsPayableCondensedSpy = spyOn(
      datevConnectClient.accounting,
      "getAccountsPayableCondensed",
    ).mockResolvedValue(mockCondensedData);
  });

  afterEach(() => {
    getAccountsPayableSpy?.mockRestore();
    getAccountPayableSpy?.mockRestore();
    getAccountsPayableCondensedSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches accounts payable with parameters", async () => {
      const context = createMockContext();
      const handler = new AccountsPayableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountsPayableSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        {
          top: 50,
          skip: 10,
          select: "id,vendor_id,amount",
          filter: "status eq open",
          expand: "vendor",
        },
      );

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({
        id: "ap-123",
        vendor_id: "vendor-123",
        amount: 2000.0,
        due_date: "2023-12-31",
        status: "open",
      });
    });

    test("handles empty results", async () => {
      getAccountsPayableSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new AccountsPayableResourceHandler(context, 0);
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
          expand: undefined,
        },
      });
      const handler = new AccountsPayableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountsPayableSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        {
          top: 100, // Default value when top is undefined
        },
      );
    });
  });

  describe("get operation", () => {
    test("fetches single account payable by ID", async () => {
      const context = createMockContext();
      const handler = new AccountsPayableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getAccountPayableSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "ap-123",
        {
          top: 50,
          skip: 10,
          select: "id,vendor_id,amount",
          filter: "status eq open",
          expand: "vendor",
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "ap-123",
        vendor_id: "vendor-123",
        amount: 2000.0,
        due_date: "2023-12-31",
        status: "open",
        description: "Supplier invoice payment",
      });
    });

    test("handles parameters with default values for get", async () => {
      const context = createMockContext({
        parameters: {
          top: undefined,
          skip: undefined,
          select: undefined,
          filter: undefined,
          expand: undefined,
          accountsPayableId: "test-ap-id",
        },
      });
      const handler = new AccountsPayableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getAccountPayableSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "test-ap-id",
        {
          top: 100,
        },
      );
    });
  });

  describe("getCondensed operation", () => {
    test("fetches condensed accounts payable data", async () => {
      const context = createMockContext();
      const handler = new AccountsPayableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getCondensed", mockAuthContext, returnData);

      expect(getAccountsPayableCondensedSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        {
          top: 50,
          skip: 10,
          select: "id,vendor_id,amount",
          filter: "status eq open",
          expand: "vendor",
        },
      );

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({
        vendor_id: "vendor-123",
        total_amount: 3500.0,
        count: 2,
      });
      expect(returnData[1].json).toEqual({
        vendor_id: "vendor-456",
        total_amount: 1250.75,
        count: 1,
      });
    });

    test("handles empty condensed results", async () => {
      getAccountsPayableCondensedSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new AccountsPayableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getCondensed", mockAuthContext, returnData);

      expect(returnData).toHaveLength(0);
    });
  });

  describe("error handling", () => {
    test("throws NodeApiError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new AccountsPayableResourceHandler(context, 0);
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
      getAccountsPayableSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new AccountsPayableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Error" });
    });

    test("propagates error when continueOnFail is false", async () => {
      getAccountsPayableSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext();
      const handler = new AccountsPayableResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("API Error");
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper execution context", async () => {
      const context = createMockContext();
      const handler = new AccountsPayableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountsPayableSpy).toHaveBeenCalledWith(
        context,
        expect.any(String),
        expect.any(String),
        expect.any(Object),
      );
    });

    test("handles metadata properly", async () => {
      const context = createMockContext();
      const handler = new AccountsPayableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual(mockAccountsPayableData[0]);
    });

    test("respects item index in error handling", async () => {
      getAccountsPayableSpy.mockRejectedValueOnce(new Error("Test error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new AccountsPayableResourceHandler(context, 5);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({ error: "Test error" });
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves select parameter", async () => {
      const context = createMockContext({
        parameters: { select: "id,amount,due_date" },
      });
      const handler = new AccountsPayableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountsPayableSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ select: "id,amount,due_date" }),
      );
    });

    test("correctly retrieves filter parameter", async () => {
      const context = createMockContext({
        parameters: { filter: "amount gt 1000" },
      });
      const handler = new AccountsPayableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountsPayableSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ filter: "amount gt 1000" }),
      );
    });

    test("correctly retrieves accountsPayableId parameter", async () => {
      const context = createMockContext({
        parameters: { accountsPayableId: "test-ap-id" },
      });
      const handler = new AccountsPayableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountsPayableSpy).toHaveBeenCalledWith(
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
      const handler = new AccountsPayableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountsPayableSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ top: 25, skip: 5 }),
      );
    });
  });
});
