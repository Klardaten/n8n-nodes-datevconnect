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
import { LegalFormResourceHandler } from "../../../../nodes/MasterData/handlers/LegalFormResourceHandler";
import type { AuthContext } from "../../../../nodes/MasterData/types";
import * as datevConnectClientModule from "../../../../src/services/datevConnectClient";

// Test spies
let fetchLegalFormsSpy: any;

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
        // Legal form operations parameters
        select: "id,display_name,nation",
        nationalRight: "german",
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

describe("LegalFormResourceHandler", () => {
  beforeEach(() => {
    fetchLegalFormsSpy = spyOn(
      datevConnectClientModule,
      "fetchLegalForms",
    ).mockResolvedValue([]);
  });

  afterEach(() => {
    fetchLegalFormsSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches legal forms with parameters", async () => {
      const mockLegalForms = [
        {
          id: "000001",
          display_name: "GmbH - Gesellschaft mit beschränkter Haftung",
          short_name: "GmbH",
          long_name: "Gesellschaft mit beschränkter Haftung",
          nation: "DE",
          type: 3,
        },
        {
          id: "000002",
          display_name: "AG - Aktiengesellschaft",
          short_name: "AG",
          long_name: "Aktiengesellschaft",
          nation: "DE",
          type: 3,
        },
      ];
      fetchLegalFormsSpy.mockResolvedValueOnce(mockLegalForms);

      const context = createMockContext();
      const handler = new LegalFormResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchLegalFormsSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        top: 100,
        skip: 0,
        select: "id,display_name,nation",
        nationalRight: "german",
      });

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({
        id: "000001",
        display_name: "GmbH - Gesellschaft mit beschränkter Haftung",
        short_name: "GmbH",
        long_name: "Gesellschaft mit beschränkter Haftung",
        nation: "DE",
        type: 3,
      });
      expect(returnData[1].json).toEqual({
        id: "000002",
        display_name: "AG - Aktiengesellschaft",
        short_name: "AG",
        long_name: "Aktiengesellschaft",
        nation: "DE",
        type: 3,
      });
    });

    test("handles empty results", async () => {
      fetchLegalFormsSpy.mockResolvedValueOnce([]);

      const context = createMockContext();
      const handler = new LegalFormResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchLegalFormsSpy).toHaveBeenCalled();
      expect(returnData).toHaveLength(0);
    });

    test("handles parameters with default values", async () => {
      const mockLegalForms = [
        {
          id: "000001",
          display_name: "GmbH - Gesellschaft mit beschränkter Haftung",
        },
      ];
      fetchLegalFormsSpy.mockResolvedValueOnce(mockLegalForms);

      const context = createMockContext({
        parameters: {
          select: undefined,
          nationalRight: undefined,
        },
      });
      const handler = new LegalFormResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchLegalFormsSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        top: 100,
        skip: 0,
        select: undefined,
        nationalRight: undefined,
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "000001",
        display_name: "GmbH - Gesellschaft mit beschränkter Haftung",
      });
    });

    test("handles Austrian national right parameter", async () => {
      const mockAustrianLegalForms = [
        {
          id: "A00001",
          display_name: "GmbH - Gesellschaft mit beschränkter Haftung",
          nation: "AT",
          type: 3,
        },
      ];
      fetchLegalFormsSpy.mockResolvedValueOnce(mockAustrianLegalForms);

      const context = createMockContext({
        parameters: {
          select: "id,display_name,nation,type",
          nationalRight: "austrian",
        },
      });
      const handler = new LegalFormResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchLegalFormsSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        top: 100,
        skip: 0,
        select: "id,display_name,nation,type",
        nationalRight: "austrian",
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "A00001",
        display_name: "GmbH - Gesellschaft mit beschränkter Haftung",
        nation: "AT",
        type: 3,
      });
    });

    test("handles different legal form types", async () => {
      const mockLegalForms = [
        {
          id: "000001",
          display_name: "Einzelunternehmen",
          type: 1,
          nation: "DE",
        },
        {
          id: "000002",
          display_name: "OHG - Offene Handelsgesellschaft",
          type: 2,
          nation: "DE",
        },
        {
          id: "000003",
          display_name: "GmbH - Gesellschaft mit beschränkter Haftung",
          type: 3,
          nation: "DE",
        },
        {
          id: "000004",
          display_name: "e.V. - Eingetragener Verein",
          type: 4,
          nation: "DE",
        },
      ];
      fetchLegalFormsSpy.mockResolvedValueOnce(mockLegalForms);

      const context = createMockContext({
        parameters: {
          select: "id,display_name,type,nation",
          nationalRight: "german",
        },
      });
      const handler = new LegalFormResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(4);
      expect(returnData.map((item) => item.json.type)).toEqual([1, 2, 3, 4]);
    });
  });

  describe("error handling", () => {
    test("throws NodeApiError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new LegalFormResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("unsupportedOp", mockAuthContext, returnData),
      ).rejects.toThrow(
        'The operation "unsupportedOp" is not supported for resource "legalForm".',
      );
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      fetchLegalFormsSpy.mockRejectedValueOnce(
        new Error("API Connection Failed"),
      );

      const context = createMockContext({
        context: { continueOnFail: mock(() => true) },
      });
      const handler = new LegalFormResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Connection Failed" });
      expect(returnData[0].pairedItem).toEqual({ item: 0 });
    });

    test("throws error when continueOnFail is false", async () => {
      fetchLegalFormsSpy.mockRejectedValueOnce(
        new Error("API Connection Failed"),
      );

      const context = createMockContext({
        context: { continueOnFail: mock(() => false) },
      });
      const handler = new LegalFormResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("API Connection Failed");
    });

    test("handles DATEVconnect API errors with proper message", async () => {
      const apiError = new Error(
        "DATEVconnect request failed (400 Bad Request): Invalid national right parameter",
      );
      fetchLegalFormsSpy.mockRejectedValueOnce(apiError);

      const context = createMockContext({
        context: { continueOnFail: mock(() => true) },
      });
      const handler = new LegalFormResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        error:
          "DATEVconnect request failed (400 Bad Request): Invalid national right parameter",
      });
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper authentication context", async () => {
      const mockLegalForms = [
        {
          id: "000001",
          display_name: "GmbH - Gesellschaft mit beschränkter Haftung",
        },
      ];
      fetchLegalFormsSpy.mockResolvedValueOnce(mockLegalForms);

      const customAuthContext: AuthContext = {
        host: "https://custom.api.com",
        token: "custom-token",
        clientInstanceId: "custom-instance",
      };

      const context = createMockContext();
      const handler = new LegalFormResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", customAuthContext, returnData);

      expect(fetchLegalFormsSpy).toHaveBeenCalledWith({
        ...customAuthContext,
        top: 100,
        skip: 0,
        select: "id,display_name,nation",
        nationalRight: "german",
      });
    });

    test("handles metadata properly", async () => {
      const mockLegalForms = [
        {
          id: "000001",
          display_name: "GmbH - Gesellschaft mit beschränkter Haftung",
        },
      ];
      fetchLegalFormsSpy.mockResolvedValueOnce(mockLegalForms);

      const context = createMockContext();
      const handler = new LegalFormResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      // Verify metadata construction is called
      expect(context.helpers.constructExecutionMetaData).toHaveBeenCalledWith(
        [
          {
            json: {
              id: "000001",
              display_name: "GmbH - Gesellschaft mit beschränkter Haftung",
            },
          },
        ],
        { itemData: { item: 0 } },
      );
    });

    test("respects item index in error handling", async () => {
      fetchLegalFormsSpy.mockRejectedValueOnce(new Error("Test Error"));

      const context = createMockContext({
        context: { continueOnFail: mock(() => true) },
      });
      const handler = new LegalFormResourceHandler(context as any, 2);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].pairedItem).toEqual({ item: 2 });
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves select parameter", async () => {
      const mockLegalForms = [{ id: "000001" }];
      fetchLegalFormsSpy.mockResolvedValueOnce(mockLegalForms);

      const context = createMockContext({
        parameters: {
          select: "id,short_name,long_name,type",
        },
      });
      const handler = new LegalFormResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchLegalFormsSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        top: 100,
        skip: 0,
        select: "id,short_name,long_name,type",
        nationalRight: "german",
      });
    });

    test("correctly retrieves nationalRight parameter", async () => {
      const mockLegalForms = [{ id: "000001" }];
      fetchLegalFormsSpy.mockResolvedValueOnce(mockLegalForms);

      const context = createMockContext({
        parameters: {
          nationalRight: "austrian",
        },
      });
      const handler = new LegalFormResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchLegalFormsSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        top: 100,
        skip: 0,
        select: "id,display_name,nation",
        nationalRight: "austrian",
      });
    });

    test("handles empty string nationalRight parameter", async () => {
      const mockLegalForms = [{ id: "000001" }];
      fetchLegalFormsSpy.mockResolvedValueOnce(mockLegalForms);

      const context = createMockContext({
        parameters: {
          nationalRight: "",
        },
      });
      const handler = new LegalFormResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchLegalFormsSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        top: 100,
        skip: 0,
        select: "id,display_name,nation",
        nationalRight: undefined, // Empty string should be converted to undefined
      });
    });
  });
});
