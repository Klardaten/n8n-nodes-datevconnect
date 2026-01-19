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
import { BankResourceHandler } from "../../../../nodes/MasterData/handlers/BankResourceHandler";
import type { AuthContext } from "../../../../nodes/MasterData/types";
import * as datevConnectClientModule from "../../../../src/services/datevConnectClient";

// Test spies
let fetchBanksSpy: any;

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
        // Bank operations parameters
        select: "id,name,city",
        filter: "city eq Nürnberg",
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
};

describe("BankResourceHandler", () => {
  beforeEach(() => {
    fetchBanksSpy = spyOn(
      datevConnectClientModule,
      "fetchBanks",
    ).mockResolvedValue([
      {
        id: "007130",
        bank_code: "76050101",
        bic: "SSKNDE77XXX",
        city: "Nürnberg",
        country_code: "DE",
        name: "Sparkasse Nürnberg",
        standard: true,
        timestamp: "2019-03-31T20:06:51.670",
      },
    ]);
  });

  afterEach(() => {
    fetchBanksSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches banks with parameters", async () => {
      const mockContext = createMockContext();
      const handler = new BankResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchBanksSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        top: 100,
        skip: 0,
        select: "id,name,city",
        filter: "city eq Nürnberg",
      });
      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "007130",
        bank_code: "76050101",
        bic: "SSKNDE77XXX",
        city: "Nürnberg",
        country_code: "DE",
        name: "Sparkasse Nürnberg",
        standard: true,
        timestamp: "2019-03-31T20:06:51.670",
      });
    });

    test("handles empty results", async () => {
      fetchBanksSpy.mockResolvedValue([]);
      const mockContext = createMockContext();
      const handler = new BankResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchBanksSpy).toHaveBeenCalled();
      expect(returnData).toHaveLength(0);
    });

    test("handles parameters with default values", async () => {
      const mockContextWithDefaults = createMockContext({
        parameters: {
          select: undefined,
          filter: undefined,
        },
      });
      const handler = new BankResourceHandler(mockContextWithDefaults, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchBanksSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        top: 100,
        skip: 0,
        select: undefined,
        filter: undefined,
      });
    });
  });

  describe("error handling", () => {
    test("throws NodeApiError for unsupported operation", async () => {
      const mockContext = createMockContext();
      const handler = new BankResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("unsupported", mockAuthContext, returnData),
      ).rejects.toThrow(
        'The operation "unsupported" is not supported for resource "bank".',
      );
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      fetchBanksSpy.mockRejectedValue(new Error("API Error"));
      const mockContextWithContinueOnFail = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });
      const handler = new BankResourceHandler(mockContextWithContinueOnFail, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toMatchObject({
        error: expect.any(String),
      });
    });

    test("propagates error when continueOnFail is false", async () => {
      fetchBanksSpy.mockRejectedValue(new Error("API Error"));
      const mockContext = createMockContext();
      const handler = new BankResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow();
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper authentication context", async () => {
      const mockContext = createMockContext();
      const handler = new BankResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchBanksSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          host: "https://api.example.com",
          token: "test-token",
          clientInstanceId: "instance-1",
        }),
      );
    });

    test("handles metadata properly", async () => {
      const mockContext = createMockContext();
      const handler = new BankResourceHandler(mockContext, 2);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0]).toMatchObject({
        json: {
          id: "007130",
          bank_code: "76050101",
          bic: "SSKNDE77XXX",
          city: "Nürnberg",
          country_code: "DE",
          name: "Sparkasse Nürnberg",
          standard: true,
          timestamp: "2019-03-31T20:06:51.670",
        },
        pairedItem: { item: 2 },
      });
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves select parameter", async () => {
      const mockContext = createMockContext();
      const handler = new BankResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchBanksSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          select: "id,name,city",
        }),
      );
    });

    test("correctly retrieves filter parameter", async () => {
      const mockContext = createMockContext();
      const handler = new BankResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchBanksSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: "city eq Nürnberg",
        }),
      );
    });
  });
});
