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
import { GeneralLedgerAccountsResourceHandler } from "../../../../nodes/Accounting/handlers/GeneralLedgerAccountsResourceHandler";
import type { AuthContext } from "../../../../nodes/Accounting/types";
import { datevConnectClient } from "../../../../src/services/accountingClient";

// Test spies
let getGeneralLedgerAccountsSpy: any;
let getGeneralLedgerAccountSpy: any;
let getUtilizedGeneralLedgerAccountsSpy: any;

const mockGeneralLedgerAccountsData = [
  {
    id: "10000000",
    account_number: 10000000,
    caption: "Kasse",
    additional_function: 0,
    function_description: "Kasse",
    function_extension: 0,
    main_function: 1,
  },
  {
    id: "40000000",
    account_number: 40000000,
    caption: "Umsatzerlöse",
    additional_function: 0,
    function_description: "Sales Revenue",
    function_extension: 80,
    main_function: 40,
  },
];

const mockSingleGeneralLedgerAccount = {
  id: "10000000",
  account_number: 10000000,
  caption: "Kasse",
  additional_function: 0,
  function_description: "Kasse",
  function_extension: 0,
  main_function: 1,
};

const mockUtilizedAccountsData = [
  {
    id: "10000000",
    account_number: 10000000,
    caption: "Kasse",
    additional_function: 0,
    function_description: "Kasse",
  },
  {
    id: "12000000",
    account_number: 12000000,
    caption: "Forderungen",
    additional_function: 0,
    function_description: "Accounts Receivable",
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
        generalLedgerAccountId: "1000",
        top: 50,
        skip: 10,
        select: "id,name,account_type",
        filter: "is_active eq true",
        expand: "transactions",
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

describe("GeneralLedgerAccountsResourceHandler", () => {
  beforeEach(() => {
    getGeneralLedgerAccountsSpy = spyOn(
      datevConnectClient.accounting,
      "getGeneralLedgerAccounts",
    ).mockResolvedValue(mockGeneralLedgerAccountsData);
    getGeneralLedgerAccountSpy = spyOn(
      datevConnectClient.accounting,
      "getGeneralLedgerAccount",
    ).mockResolvedValue(mockSingleGeneralLedgerAccount);
    getUtilizedGeneralLedgerAccountsSpy = spyOn(
      datevConnectClient.accounting,
      "getUtilizedGeneralLedgerAccounts",
    ).mockResolvedValue(mockUtilizedAccountsData);
  });

  afterEach(() => {
    getGeneralLedgerAccountsSpy?.mockRestore();
    getGeneralLedgerAccountSpy?.mockRestore();
    getUtilizedGeneralLedgerAccountsSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches general ledger accounts with parameters", async () => {
      const context = createMockContext();
      const handler = new GeneralLedgerAccountsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getGeneralLedgerAccountsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        {
          top: 50,
          skip: 10,
          select: "id,name,account_type",
          filter: "is_active eq true",
          expand: "transactions",
        },
      );

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({
        id: "10000000",
        account_number: 10000000,
        caption: "Kasse",
        additional_function: 0,
        function_description: "Kasse",
        function_extension: 0,
        main_function: 1,
      });
    });

    test("handles empty results", async () => {
      getGeneralLedgerAccountsSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new GeneralLedgerAccountsResourceHandler(context, 0);
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
      const handler = new GeneralLedgerAccountsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getGeneralLedgerAccountsSpy).toHaveBeenCalledWith(
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
    test("fetches single general ledger account by ID", async () => {
      const context = createMockContext();
      const handler = new GeneralLedgerAccountsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getGeneralLedgerAccountSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "1000",
        {
          top: 50,
          skip: 10,
          select: "id,name,account_type",
          filter: "is_active eq true",
          expand: "transactions",
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "10000000",
        account_number: 10000000,
        caption: "Kasse",
        additional_function: 0,
        function_description: "Kasse",
        function_extension: 0,
        main_function: 1,
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
          generalLedgerAccountId: "test-account-id",
        },
      });
      const handler = new GeneralLedgerAccountsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getGeneralLedgerAccountSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "test-account-id",
        {
          top: 100,
        },
      );
    });
  });

  describe("getUtilized operation", () => {
    test("fetches utilized general ledger accounts", async () => {
      const context = createMockContext();
      const handler = new GeneralLedgerAccountsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getUtilized", mockAuthContext, returnData);

      expect(getUtilizedGeneralLedgerAccountsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        {
          top: 50,
          skip: 10,
          select: "id,name,account_type",
          filter: "is_active eq true",
          expand: "transactions",
        },
      );

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({
        id: "10000000",
        account_number: 10000000,
        caption: "Kasse",
        additional_function: 0,
        function_description: "Kasse",
      });
      expect(returnData[1].json).toEqual({
        id: "12000000",
        account_number: 12000000,
        caption: "Forderungen",
        additional_function: 0,
        function_description: "Accounts Receivable",
      });
    });

    test("handles empty utilized results", async () => {
      getUtilizedGeneralLedgerAccountsSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new GeneralLedgerAccountsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getUtilized", mockAuthContext, returnData);

      expect(returnData).toHaveLength(0);
    });
  });

  describe("error handling", () => {
    test("throws NodeApiError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new GeneralLedgerAccountsResourceHandler(context, 0);
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
      getGeneralLedgerAccountsSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new GeneralLedgerAccountsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Error" });
    });

    test("propagates error when continueOnFail is false", async () => {
      getGeneralLedgerAccountsSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext();
      const handler = new GeneralLedgerAccountsResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("API Error");
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper execution context", async () => {
      const context = createMockContext();
      const handler = new GeneralLedgerAccountsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getGeneralLedgerAccountsSpy).toHaveBeenCalledWith(
        context,
        expect.any(String),
        expect.any(String),
        expect.any(Object),
      );
    });

    test("handles metadata properly", async () => {
      const context = createMockContext();
      const handler = new GeneralLedgerAccountsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual(mockGeneralLedgerAccountsData[0]);
    });

    test("respects item index in error handling", async () => {
      getGeneralLedgerAccountsSpy.mockRejectedValueOnce(
        new Error("Test error"),
      );
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new GeneralLedgerAccountsResourceHandler(context, 5);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({ error: "Test error" });
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves select parameter", async () => {
      const context = createMockContext({
        parameters: { select: "id,name,balance" },
      });
      const handler = new GeneralLedgerAccountsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getGeneralLedgerAccountsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ select: "id,name,balance" }),
      );
    });

    test("correctly retrieves filter parameter", async () => {
      const context = createMockContext({
        parameters: { filter: "account_type eq asset" },
      });
      const handler = new GeneralLedgerAccountsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getGeneralLedgerAccountsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ filter: "account_type eq asset" }),
      );
    });

    test("correctly retrieves generalLedgerAccountId parameter", async () => {
      const context = createMockContext({
        parameters: { generalLedgerAccountId: "test-account-id" },
      });
      const handler = new GeneralLedgerAccountsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getGeneralLedgerAccountsSpy).toHaveBeenCalledWith(
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
      const handler = new GeneralLedgerAccountsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getGeneralLedgerAccountsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ top: 25, skip: 5 }),
      );
    });
  });
});
