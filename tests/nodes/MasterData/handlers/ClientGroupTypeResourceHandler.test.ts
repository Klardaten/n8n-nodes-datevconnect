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
import { ClientGroupTypeResourceHandler } from "../../../../nodes/MasterData/handlers/ClientGroupTypeResourceHandler";
import type { AuthContext } from "../../../../nodes/MasterData/types";
import * as datevConnectClientModule from "../../../../src/services/datevConnectClient";

// Test spies
let fetchClientGroupTypesSpy: any;
let fetchClientGroupTypeSpy: any;
let createClientGroupTypeSpy: any;
let updateClientGroupTypeSpy: any;

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
        // Client group type operations parameters
        select: "id,name,short_name",
        filter: "startswith(name, 'Test')",
        clientGroupTypeId: "k93f9chg-380c-494e-47c8-d12fff738192",
        clientGroupTypeData: JSON.stringify({
          short_name: "TGT",
          name: "Test Group Type",
          note: "Test group type for unit tests",
        }),
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

describe("ClientGroupTypeResourceHandler", () => {
  beforeEach(() => {
    fetchClientGroupTypesSpy = spyOn(
      datevConnectClientModule,
      "fetchClientGroupTypes",
    ).mockResolvedValue([]);
    fetchClientGroupTypeSpy = spyOn(
      datevConnectClientModule,
      "fetchClientGroupType",
    ).mockResolvedValue({});
    createClientGroupTypeSpy = spyOn(
      datevConnectClientModule,
      "createClientGroupType",
    ).mockResolvedValue(undefined);
    updateClientGroupTypeSpy = spyOn(
      datevConnectClientModule,
      "updateClientGroupType",
    ).mockResolvedValue(undefined);
  });

  afterEach(() => {
    fetchClientGroupTypesSpy?.mockRestore();
    fetchClientGroupTypeSpy?.mockRestore();
    createClientGroupTypeSpy?.mockRestore();
    updateClientGroupTypeSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches client group types with parameters", async () => {
      const mockResponse = [
        {
          id: "k93f9chg-380c-494e-47c8-d12fff738192",
          name: "Test Group Type",
          short_name: "TGT",
        },
        {
          id: "m85d7ahf-290b-384d-36b7-c01eee627081",
          name: "Another Group Type",
          short_name: "AGT",
        },
      ];

      fetchClientGroupTypesSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new ClientGroupTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchClientGroupTypesSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        top: 100,
        skip: 0,
        select: "id,name,short_name",
        filter: "startswith(name, 'Test')",
      });

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({
        id: "k93f9chg-380c-494e-47c8-d12fff738192",
        name: "Test Group Type",
        short_name: "TGT",
      });
      expect(returnData[1].json).toEqual({
        id: "m85d7ahf-290b-384d-36b7-c01eee627081",
        name: "Another Group Type",
        short_name: "AGT",
      });
    });

    test("handles empty results", async () => {
      const mockResponse: any[] = [];
      fetchClientGroupTypesSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new ClientGroupTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchClientGroupTypesSpy).toHaveBeenCalled();
      expect(returnData).toHaveLength(0);
    });

    test("handles parameters with default values", async () => {
      const mockContextWithDefaults = createMockContext({
        parameters: {
          select: undefined,
          filter: undefined,
        },
      });
      const mockResponse = [
        {
          id: "k93f9chg-380c-494e-47c8-d12fff738192",
          name: "Default Group Type",
        },
      ];
      fetchClientGroupTypesSpy.mockResolvedValue(mockResponse);

      const handler = new ClientGroupTypeResourceHandler(
        mockContextWithDefaults,
        0,
      );
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchClientGroupTypesSpy).toHaveBeenCalledWith({
        host: "https://api.example.com",
        token: "test-token",
        clientInstanceId: "instance-1",
        top: 100,
        skip: 0,
        select: undefined,
        filter: undefined,
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "k93f9chg-380c-494e-47c8-d12fff738192",
        name: "Default Group Type",
      });
    });
  });

  describe("get operation", () => {
    test("fetches single client group type by ID", async () => {
      const mockResponse = {
        id: "k93f9chg-380c-494e-47c8-d12fff738192",
        name: "Test Group Type",
        short_name: "TGT",
        note: "Test group type for unit tests",
      };

      fetchClientGroupTypeSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new ClientGroupTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(fetchClientGroupTypeSpy).toHaveBeenCalledWith({
        host: "https://api.example.com",
        token: "test-token",
        clientInstanceId: "instance-1",
        clientGroupTypeId: "k93f9chg-380c-494e-47c8-d12fff738192",
        select: "id,name,short_name",
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockResponse);
    });

    test("handles parameters with default values for get", async () => {
      const mockContextWithDefaults = createMockContext({
        parameters: {
          select: undefined,
          clientGroupTypeId: "k93f9chg-380c-494e-47c8-d12fff738192",
        },
      });
      const mockResponse = {
        id: "k93f9chg-380c-494e-47c8-d12fff738192",
        name: "Group Type",
      };
      fetchClientGroupTypeSpy.mockResolvedValue(mockResponse);

      const handler = new ClientGroupTypeResourceHandler(
        mockContextWithDefaults,
        0,
      );
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(fetchClientGroupTypeSpy).toHaveBeenCalledWith({
        host: "https://api.example.com",
        token: "test-token",
        clientInstanceId: "instance-1",
        clientGroupTypeId: "k93f9chg-380c-494e-47c8-d12fff738192",
        select: undefined,
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockResponse);
    });
  });

  describe("create operation", () => {
    test("creates client group type with data", async () => {
      createClientGroupTypeSpy.mockResolvedValue(undefined);

      const mockContext = createMockContext();
      const handler = new ClientGroupTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createClientGroupTypeSpy).toHaveBeenCalledWith({
        host: "https://api.example.com",
        token: "test-token",
        clientInstanceId: "instance-1",
        clientGroupType: {
          short_name: "TGT",
          name: "Test Group Type",
          note: "Test group type for unit tests",
        },
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("creates client group type without response data", async () => {
      createClientGroupTypeSpy.mockResolvedValue(undefined);

      const mockContext = createMockContext();
      const handler = new ClientGroupTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createClientGroupTypeSpy).toHaveBeenCalled();
      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });
  });

  describe("update operation", () => {
    test("updates client group type with data", async () => {
      updateClientGroupTypeSpy.mockResolvedValue(undefined);

      const mockContext = createMockContext();
      const handler = new ClientGroupTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("update", mockAuthContext, returnData);

      expect(updateClientGroupTypeSpy).toHaveBeenCalledWith({
        host: "https://api.example.com",
        token: "test-token",
        clientInstanceId: "instance-1",
        clientGroupTypeId: "k93f9chg-380c-494e-47c8-d12fff738192",
        clientGroupType: {
          short_name: "TGT",
          name: "Test Group Type",
          note: "Test group type for unit tests",
        },
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("updates client group type without response data", async () => {
      updateClientGroupTypeSpy.mockResolvedValue(undefined);

      const mockContext = createMockContext();
      const handler = new ClientGroupTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("update", mockAuthContext, returnData);

      expect(updateClientGroupTypeSpy).toHaveBeenCalled();
      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });
  });

  describe("error handling", () => {
    test("throws NodeApiError for unsupported operation", async () => {
      const mockContext = createMockContext();
      const handler = new ClientGroupTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("unsupported", mockAuthContext, returnData),
      ).rejects.toThrow(
        'The operation "unsupported" is not supported for resource "clientGroupType".',
      );
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      const mockContextWithContinueOnFail = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const apiError = new Error("API Error");
      fetchClientGroupTypesSpy.mockRejectedValue(apiError);

      const handler = new ClientGroupTypeResourceHandler(
        mockContextWithContinueOnFail,
        0,
      );
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        error: "API Error",
      });
    });

    test("propagates error when continueOnFail is false", async () => {
      const apiError = new Error("API Error");
      fetchClientGroupTypesSpy.mockRejectedValue(apiError);

      const mockContext = createMockContext();
      const handler = new ClientGroupTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow();
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper authentication context", async () => {
      const mockResponse = [
        { id: "k93f9chg-380c-494e-47c8-d12fff738192", name: "Test Group Type" },
      ];
      fetchClientGroupTypesSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new ClientGroupTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchClientGroupTypesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          host: mockAuthContext.host,
          token: mockAuthContext.token,
          clientInstanceId: mockAuthContext.clientInstanceId,
        }),
      );
    });

    test("handles metadata properly", async () => {
      const mockResponse = [
        { id: "k93f9chg-380c-494e-47c8-d12fff738192", name: "Test Group Type" },
      ];
      fetchClientGroupTypesSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new ClientGroupTypeResourceHandler(mockContext, 2);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "k93f9chg-380c-494e-47c8-d12fff738192",
        name: "Test Group Type",
      });
    });

    test("respects item index in error handling", async () => {
      const apiError = new Error("API Error");
      fetchClientGroupTypesSpy.mockRejectedValue(apiError);

      const mockContextWithContinueOnFail = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new ClientGroupTypeResourceHandler(
        mockContextWithContinueOnFail,
        3,
      );
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        error: "API Error",
      });
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves select parameter", async () => {
      const mockResponse = [
        { id: "k93f9chg-380c-494e-47c8-d12fff738192", name: "Test Group Type" },
      ];
      fetchClientGroupTypesSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new ClientGroupTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchClientGroupTypesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          select: "id,name,short_name",
        }),
      );
    });

    test("correctly retrieves filter parameter", async () => {
      const mockResponse = [
        { id: "k93f9chg-380c-494e-47c8-d12fff738192", name: "Test Group Type" },
      ];
      fetchClientGroupTypesSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new ClientGroupTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchClientGroupTypesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: "startswith(name, 'Test')",
        }),
      );
    });

    test("correctly retrieves clientGroupTypeId parameter", async () => {
      const mockResponse = {
        id: "k93f9chg-380c-494e-47c8-d12fff738192",
        name: "Test Group Type",
      };
      fetchClientGroupTypeSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new ClientGroupTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(fetchClientGroupTypeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          clientGroupTypeId: "k93f9chg-380c-494e-47c8-d12fff738192",
        }),
      );
    });
  });
});
