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
import { AccountingSequenceResourceHandler } from "../../../../nodes/Accounting/handlers/AccountingSequenceResourceHandler";
import type { AuthContext } from "../../../../nodes/Accounting/types";
import { datevConnectClient } from "../../../../src/services/accountingClient";

// Test spies
let createAccountingSequenceSpy: any;
let getAccountingSequencesSpy: any;
let getAccountingSequenceSpy: any;
let getAccountingRecordsSpy: any;
let getAccountingRecordSpy: any;

// Mock data
const mockAccountingSequenceData = [
  {
    id: "seq-123",
    name: "Test Sequence 1",
    status: "active",
    created_date: "2023-01-01",
  },
  {
    id: "seq-456",
    name: "Test Sequence 2",
    status: "completed",
    created_date: "2023-01-02",
  },
];

const mockSingleAccountingSequence = {
  id: "seq-123",
  name: "Test Sequence",
  status: "active",
  created_date: "2023-01-01",
  description: "Test accounting sequence",
};

const mockAccountingRecordsData = [
  {
    id: "record-123",
    sequence_id: "seq-123",
    amount: 1000.0,
    account: "1200",
  },
  {
    id: "record-456",
    sequence_id: "seq-123",
    amount: 500.5,
    account: "4000",
  },
];

const mockSingleAccountingRecord = {
  id: "record-123",
  sequence_id: "seq-123",
  amount: 1000.0,
  account: "1200",
  description: "Test accounting record",
};

const mockCreatedSequence = {
  id: "seq-new",
  name: "New Sequence",
  status: "created",
  created_date: "2023-01-15",
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
        accountingSequenceId: "seq-123",
        accountingRecordId: "record-123",
        accountingSequenceData: '{"name": "Test Sequence", "status": "active"}',
        top: 50,
        skip: 10,
        select: "id,name,status",
        filter: "status eq active",
        expand: "relationships",
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

describe("AccountingSequenceResourceHandler", () => {
  beforeEach(() => {
    createAccountingSequenceSpy = spyOn(
      datevConnectClient.accounting,
      "createAccountingSequence",
    ).mockResolvedValue(mockCreatedSequence);
    getAccountingSequencesSpy = spyOn(
      datevConnectClient.accounting,
      "getAccountingSequences",
    ).mockResolvedValue(mockAccountingSequenceData);
    getAccountingSequenceSpy = spyOn(
      datevConnectClient.accounting,
      "getAccountingSequence",
    ).mockResolvedValue(mockSingleAccountingSequence);
    getAccountingRecordsSpy = spyOn(
      datevConnectClient.accounting,
      "getAccountingRecords",
    ).mockResolvedValue(mockAccountingRecordsData);
    getAccountingRecordSpy = spyOn(
      datevConnectClient.accounting,
      "getAccountingRecord",
    ).mockResolvedValue(mockSingleAccountingRecord);
  });

  afterEach(() => {
    createAccountingSequenceSpy?.mockRestore();
    getAccountingSequencesSpy?.mockRestore();
    getAccountingSequenceSpy?.mockRestore();
    getAccountingRecordsSpy?.mockRestore();
    getAccountingRecordSpy?.mockRestore();
  });

  describe("create operation", () => {
    test("creates accounting sequence with data", async () => {
      const context = createMockContext();
      const handler = new AccountingSequenceResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createAccountingSequenceSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        { name: "Test Sequence", status: "active" },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockCreatedSequence);
    });

    test("creates accounting sequence without response data", async () => {
      createAccountingSequenceSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new AccountingSequenceResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("throws error for invalid JSON data", async () => {
      const context = createMockContext({
        parameters: { accountingSequenceData: "invalid json" },
      });
      const handler = new AccountingSequenceResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("create", mockAuthContext, returnData),
      ).rejects.toThrow();
    });

    test("throws error for array data", async () => {
      const context = createMockContext({
        parameters: { accountingSequenceData: '["array", "data"]' },
      });
      const handler = new AccountingSequenceResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("create", mockAuthContext, returnData),
      ).rejects.toThrow("Accounting sequence data must be a valid JSON object");
    });
  });

  describe("getAll operation", () => {
    test("fetches accounting sequences", async () => {
      const context = createMockContext();
      const handler = new AccountingSequenceResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingSequencesSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
      );

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({
        id: "seq-123",
        name: "Test Sequence 1",
        status: "active",
        created_date: "2023-01-01",
      });
    });

    test("handles empty results", async () => {
      getAccountingSequencesSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new AccountingSequenceResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(0);
    });
  });

  describe("get operation", () => {
    test("fetches single accounting sequence by ID", async () => {
      const context = createMockContext();
      const handler = new AccountingSequenceResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getAccountingSequenceSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "seq-123",
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockSingleAccountingSequence);
    });

    test("handles null response for get", async () => {
      getAccountingSequenceSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new AccountingSequenceResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });
  });

  describe("getAccountingRecords operation", () => {
    test("fetches accounting records for sequence", async () => {
      const context = createMockContext();
      const handler = new AccountingSequenceResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute(
        "getAccountingRecords",
        mockAuthContext,
        returnData,
      );

      expect(getAccountingRecordsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "seq-123",
        {
          top: 50,
          skip: 10,
          select: "id,name,status",
          filter: "status eq active",
          expand: "relationships",
        },
      );

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({
        id: "record-123",
        sequence_id: "seq-123",
        amount: 1000.0,
        account: "1200",
      });
    });

    test("handles empty accounting records results", async () => {
      getAccountingRecordsSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new AccountingSequenceResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute(
        "getAccountingRecords",
        mockAuthContext,
        returnData,
      );

      expect(returnData).toHaveLength(0);
    });
  });

  describe("getAccountingRecord operation", () => {
    test("fetches single accounting record by ID", async () => {
      const context = createMockContext();
      const handler = new AccountingSequenceResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAccountingRecord", mockAuthContext, returnData);

      expect(getAccountingRecordSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "seq-123",
        "record-123",
        {
          top: 50,
          skip: 10,
          select: "id,name,status",
          filter: "status eq active",
          expand: "relationships",
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockSingleAccountingRecord);
    });

    test("handles null response for single record", async () => {
      getAccountingRecordSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new AccountingSequenceResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAccountingRecord", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });
  });

  describe("error handling", () => {
    test("throws NodeApiError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new AccountingSequenceResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute(
          "unsupportedOperation" as any,
          mockAuthContext,
          returnData,
        ),
      ).rejects.toThrow(
        'The operation "unsupportedOperation" is not supported for resource "accountingSequence".',
      );
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      getAccountingSequencesSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new AccountingSequenceResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Error" });
    });

    test("propagates error when continueOnFail is false", async () => {
      getAccountingSequencesSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext();
      const handler = new AccountingSequenceResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("API Error");
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper execution context", async () => {
      const context = createMockContext();
      const handler = new AccountingSequenceResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getAccountingSequencesSpy).toHaveBeenCalledWith(
        context,
        expect.any(String),
        expect.any(String),
      );
    });

    test("handles metadata properly", async () => {
      const context = createMockContext();
      const handler = new AccountingSequenceResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual(mockAccountingSequenceData[0]);
    });

    test("respects item index in error handling", async () => {
      getAccountingSequencesSpy.mockRejectedValueOnce(new Error("Test error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new AccountingSequenceResourceHandler(context, 5);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({ error: "Test error" });
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves accountingSequenceId parameter", async () => {
      const context = createMockContext({
        parameters: { accountingSequenceId: "test-seq-id" },
      });
      const handler = new AccountingSequenceResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getAccountingSequenceSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "test-seq-id",
      );
    });

    test("correctly retrieves accountingRecordId parameter", async () => {
      const context = createMockContext({
        parameters: {
          accountingSequenceId: "test-seq-id",
          accountingRecordId: "test-record-id",
        },
      });
      const handler = new AccountingSequenceResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAccountingRecord", mockAuthContext, returnData);

      expect(getAccountingRecordSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "test-seq-id",
        "test-record-id",
        expect.any(Object),
      );
    });

    test("correctly parses JSON accountingSequenceData parameter", async () => {
      const testData = {
        name: "Custom Sequence",
        status: "pending",
        priority: 1,
      };
      const context = createMockContext({
        parameters: { accountingSequenceData: JSON.stringify(testData) },
      });
      const handler = new AccountingSequenceResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createAccountingSequenceSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        testData,
      );
    });

    test("correctly retrieves query parameters for records operations", async () => {
      const context = createMockContext({
        parameters: {
          top: 25,
          skip: 5,
          select: "id,amount",
          filter: "amount gt 1000",
        },
      });
      const handler = new AccountingSequenceResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute(
        "getAccountingRecords",
        mockAuthContext,
        returnData,
      );

      expect(getAccountingRecordsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "seq-123",
        expect.objectContaining({
          top: 25,
          skip: 5,
          select: "id,amount",
          filter: "amount gt 1000",
        }),
      );
    });
  });
});
