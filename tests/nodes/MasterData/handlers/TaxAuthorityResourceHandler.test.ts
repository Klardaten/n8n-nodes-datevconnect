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
import { TaxAuthorityResourceHandler } from "../../../../nodes/MasterData/handlers/TaxAuthorityResourceHandler";
import type { AuthContext } from "../../../../nodes/MasterData/types";
import * as datevConnectClientModule from "../../../../src/services/datevConnectClient";

// Test spies
let fetchTaxAuthoritiesSpy: any;

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
        // Tax authority operations parameters (only select and filter are used)
        select: "id,name,code",
        filter: "active eq true",
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

describe("TaxAuthorityResourceHandler", () => {
  beforeEach(() => {
    fetchTaxAuthoritiesSpy = spyOn(
      datevConnectClientModule,
      "fetchTaxAuthorities",
    ).mockResolvedValue([]);
  });

  afterEach(() => {
    fetchTaxAuthoritiesSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches tax authorities with parameters", async () => {
      const mockTaxAuthorities = [
        { id: "1", name: "Tax Authority 1", code: "TA001" },
        { id: "2", name: "Tax Authority 2", code: "TA002" },
      ];
      fetchTaxAuthoritiesSpy.mockResolvedValueOnce(mockTaxAuthorities);

      const context = createMockContext();
      const handler = new TaxAuthorityResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchTaxAuthoritiesSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        top: 100,
        skip: 0,
        select: "id,name,code",
        filter: "active eq true",
      });

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({
        id: "1",
        name: "Tax Authority 1",
        code: "TA001",
      });
      expect(returnData[1].json).toEqual({
        id: "2",
        name: "Tax Authority 2",
        code: "TA002",
      });
    });

    test("handles empty results", async () => {
      fetchTaxAuthoritiesSpy.mockResolvedValueOnce([]);

      const context = createMockContext();
      const handler = new TaxAuthorityResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchTaxAuthoritiesSpy).toHaveBeenCalled();
      expect(returnData).toHaveLength(0);
    });

    test("handles parameters with default values", async () => {
      const mockTaxAuthorities = [{ id: "1", name: "Tax Authority 1" }];
      fetchTaxAuthoritiesSpy.mockResolvedValueOnce(mockTaxAuthorities);

      const context = createMockContext({
        parameters: {
          select: undefined,
          filter: undefined,
        },
      });
      const handler = new TaxAuthorityResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchTaxAuthoritiesSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        top: 100,
        skip: 0,
        select: undefined,
        filter: undefined,
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ id: "1", name: "Tax Authority 1" });
    });
  });

  describe("error handling", () => {
    test("throws NodeApiError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new TaxAuthorityResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("unsupportedOp", mockAuthContext, returnData),
      ).rejects.toThrow(
        'The operation "unsupportedOp" is not supported for resource "taxAuthority".',
      );
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      fetchTaxAuthoritiesSpy.mockRejectedValueOnce(
        new Error("API Connection Failed"),
      );

      const context = createMockContext({
        context: { continueOnFail: mock(() => true) },
      });
      const handler = new TaxAuthorityResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Connection Failed" });
      expect(returnData[0].pairedItem).toEqual({ item: 0 });
    });

    test("throws error when continueOnFail is false", async () => {
      fetchTaxAuthoritiesSpy.mockRejectedValueOnce(
        new Error("API Connection Failed"),
      );

      const context = createMockContext({
        context: { continueOnFail: mock(() => false) },
      });
      const handler = new TaxAuthorityResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("API Connection Failed");
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper authentication context", async () => {
      const mockTaxAuthorities = [{ id: "1", name: "Tax Authority 1" }];
      fetchTaxAuthoritiesSpy.mockResolvedValueOnce(mockTaxAuthorities);

      const customAuthContext: AuthContext = {
        host: "https://custom.api.com",
        token: "custom-token",
        clientInstanceId: "custom-instance",
      };

      const context = createMockContext();
      const handler = new TaxAuthorityResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", customAuthContext, returnData);

      expect(fetchTaxAuthoritiesSpy).toHaveBeenCalledWith({
        ...customAuthContext,
        top: 100,
        skip: 0,
        select: "id,name,code",
        filter: "active eq true",
      });
    });

    test("handles metadata properly", async () => {
      const mockTaxAuthorities = [{ id: "1", name: "Tax Authority 1" }];
      fetchTaxAuthoritiesSpy.mockResolvedValueOnce(mockTaxAuthorities);

      const context = createMockContext();
      const handler = new TaxAuthorityResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      // Verify metadata construction is called
      expect(context.helpers.constructExecutionMetaData).toHaveBeenCalledWith(
        [{ json: { id: "1", name: "Tax Authority 1" } }],
        { itemData: { item: 0 } },
      );
    });
  });
});
