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
import { AccountsReceivableResourceHandler } from "../../../../nodes/Accounting/handlers/AccountsReceivableResourceHandler";
import type { AuthContext } from "../../../../nodes/Accounting/types";
import { datevConnectClient } from "../../../../src/services/accountingClient";

// Test spies
let getAccountsReceivableSpy: any;
let getAccountReceivableSpy: any;
let getAccountsReceivableCondensedSpy: any;

// Mock data
const mockAccountsReceivableData = [
  {
    id: "ar-123",
    customer_id: "cust-123",
    amount: 1000.0,
    due_date: "2023-12-31",
    status: "open",
  },
  {
    id: "ar-456",
    customer_id: "cust-456",
    amount: 750.5,
    due_date: "2023-11-30",
    status: "overdue",
  },
];

const mockSingleAccountReceivable = {
  id: "ar-123",
  customer_id: "cust-123",
  amount: 1000.0,
  due_date: "2023-12-31",
  status: "open",
  description: "Invoice payment",
};

const mockCondensedData = [
  {
    customer_id: "cust-123",
    total_amount: 1500.0,
    count: 3,
  },
  {
    customer_id: "cust-456",
    total_amount: 750.5,
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
        accountsReceivableId: "ar-123",
        top: 50,
        skip: 10,
        select: "id,customer_id,amount",
        filter: "status eq open",
        expand: "customer",
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

describe("AccountsReceivableResourceHandler", () => {
  beforeEach(() => {
    getAccountsReceivableSpy = spyOn(
      datevConnectClient.accounting,
      "getAccountsReceivable",
    ).mockResolvedValue(mockAccountsReceivableData);
    getAccountReceivableSpy = spyOn(
      datevConnectClient.accounting,
      "getAccountReceivable",
    ).mockResolvedValue(mockSingleAccountReceivable);
    getAccountsReceivableCondensedSpy = spyOn(
      datevConnectClient.accounting,
      "getAccountsReceivableCondensed",
    ).mockResolvedValue(mockCondensedData);
  });

  afterEach(() => {
    getAccountsReceivableSpy?.mockRestore();
    getAccountReceivableSpy?.mockRestore();
    getAccountsReceivableCondensedSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches accounts receivable with parameters", async () => {
      const context = createMockContext();
      const handler = new AccountsReceivableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountsReceivableSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        {
          top: 50,
          skip: 10,
          select: "id,customer_id,amount",
          filter: "status eq open",
          expand: "customer",
        },
      );

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({
        id: "ar-123",
        customer_id: "cust-123",
        amount: 1000.0,
        due_date: "2023-12-31",
        status: "open",
      });
    });

    test("handles empty results", async () => {
      getAccountsReceivableSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new AccountsReceivableResourceHandler(context, 0);
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
      const handler = new AccountsReceivableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountsReceivableSpy).toHaveBeenCalledWith(
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
    test("fetches single account receivable by ID", async () => {
      const context = createMockContext();
      const handler = new AccountsReceivableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getAccountReceivableSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "ar-123",
        {
          top: 50,
          skip: 10,
          select: "id,customer_id,amount",
          filter: "status eq open",
          expand: "customer",
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockSingleAccountReceivable);
    });

    test("handles parameters with default values for get", async () => {
      const context = createMockContext({
        parameters: {
          top: undefined,
          skip: undefined,
          select: undefined,
          filter: undefined,
          expand: undefined,
          accountsReceivableId: "test-ar-id",
        },
      });
      const handler = new AccountsReceivableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getAccountReceivableSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "test-ar-id",
        {
          top: 100, // Default value when top is undefined
        },
      );
    });
  });

  describe("getCondensed operation", () => {
    test("fetches condensed accounts receivable data", async () => {
      const context = createMockContext();
      const handler = new AccountsReceivableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getCondensed", mockAuthContext, returnData);

      expect(getAccountsReceivableCondensedSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        {
          top: 50,
          skip: 10,
          select: "id,customer_id,amount",
          filter: "status eq open",
          expand: "customer",
        },
      );

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({
        customer_id: "cust-123",
        total_amount: 1500.0,
        count: 3,
      });
    });

    test("handles empty condensed results", async () => {
      getAccountsReceivableCondensedSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new AccountsReceivableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getCondensed", mockAuthContext, returnData);

      expect(returnData).toHaveLength(0);
    });
  });

  describe("error handling", () => {
    test("throws NodeApiError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new AccountsReceivableResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute(
          "unsupportedOperation" as any,
          mockAuthContext,
          returnData,
        ),
      ).rejects.toThrow(
        'The operation "unsupportedOperation" is not supported for resource "accountsReceivable".',
      );
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      getAccountsReceivableSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new AccountsReceivableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Error" });
    });

    test("propagates error when continueOnFail is false", async () => {
      getAccountsReceivableSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext();
      const handler = new AccountsReceivableResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("API Error");
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper execution context", async () => {
      const context = createMockContext();
      const handler = new AccountsReceivableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountsReceivableSpy).toHaveBeenCalledWith(
        context,
        expect.any(String),
        expect.any(String),
        expect.any(Object),
      );
    });

    test("handles metadata properly", async () => {
      const context = createMockContext();
      const handler = new AccountsReceivableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual(mockAccountsReceivableData[0]);
    });

    test("respects item index in error handling", async () => {
      getAccountsReceivableSpy.mockRejectedValueOnce(new Error("Test error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new AccountsReceivableResourceHandler(context, 5);
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
      const handler = new AccountsReceivableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountsReceivableSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ select: "id,amount,due_date" }),
      );
    });

    test("correctly retrieves filter parameter", async () => {
      const context = createMockContext({
        parameters: { filter: "amount gt 500" },
      });
      const handler = new AccountsReceivableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountsReceivableSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ filter: "amount gt 500" }),
      );
    });

    test("correctly retrieves accountsReceivableId parameter", async () => {
      const context = createMockContext({
        parameters: { accountsReceivableId: "test-ar-id" },
      });
      const handler = new AccountsReceivableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getAccountReceivableSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "test-ar-id",
        expect.any(Object),
      );
    });

    test("correctly retrieves top and skip parameters", async () => {
      const context = createMockContext({
        parameters: { top: 25, skip: 5 },
      });
      const handler = new AccountsReceivableResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountsReceivableSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ top: 25, skip: 5 }),
      );
    });
  });
});
