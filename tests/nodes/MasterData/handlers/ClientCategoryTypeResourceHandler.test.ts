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
import { ClientCategoryTypeResourceHandler } from "../../../../nodes/MasterData/handlers/ClientCategoryTypeResourceHandler";
import type { AuthContext } from "../../../../nodes/MasterData/types";
import * as datevConnectClientModule from "../../../../src/services/datevConnectClient";

// Test spies
let fetchClientCategoryTypesSpy: any;
let fetchClientCategoryTypeSpy: any;
let createClientCategoryTypeSpy: any;
let updateClientCategoryTypeSpy: any;

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
        // Client category type operations parameters
        select: "id,name,short_name",
        filter: "startswith(name, 'Test')",
        clientCategoryTypeId: "c43f9c3g-380c-494e-47c8-d12fff738188",
        clientCategoryTypeData: JSON.stringify({
          short_name: "TCT",
          name: "Test Category Type",
          note: "Test category type for unit tests",
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

describe("ClientCategoryTypeResourceHandler", () => {
  beforeEach(() => {
    fetchClientCategoryTypesSpy = spyOn(
      datevConnectClientModule,
      "fetchClientCategoryTypes",
    ).mockResolvedValue([]);
    fetchClientCategoryTypeSpy = spyOn(
      datevConnectClientModule,
      "fetchClientCategoryType",
    ).mockResolvedValue({});
    createClientCategoryTypeSpy = spyOn(
      datevConnectClientModule,
      "createClientCategoryType",
    ).mockResolvedValue(undefined);
    updateClientCategoryTypeSpy = spyOn(
      datevConnectClientModule,
      "updateClientCategoryType",
    ).mockResolvedValue(undefined);
  });

  afterEach(() => {
    fetchClientCategoryTypesSpy?.mockRestore();
    fetchClientCategoryTypeSpy?.mockRestore();
    createClientCategoryTypeSpy?.mockRestore();
    updateClientCategoryTypeSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches client category types with parameters", async () => {
      const mockResponse = [
        {
          id: "c43f9c3g-380c-494e-47c8-d12fff738188",
          name: "Test Category Type",
          short_name: "TCT",
        },
        {
          id: "d54g8d4h-491d-495f-48d9-e23ggg849199",
          name: "Another Category Type",
          short_name: "ACT",
        },
      ];

      fetchClientCategoryTypesSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new ClientCategoryTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchClientCategoryTypesSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        top: 100,
        skip: 0,
        select: "id,name,short_name",
        filter: "startswith(name, 'Test')",
      });
      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({
        id: "c43f9c3g-380c-494e-47c8-d12fff738188",
        name: "Test Category Type",
        short_name: "TCT",
      });
      expect(returnData[1].json).toEqual({
        id: "d54g8d4h-491d-495f-48d9-e23ggg849199",
        name: "Another Category Type",
        short_name: "ACT",
      });
    });

    test("handles empty results", async () => {
      const mockResponse: any[] = [];
      fetchClientCategoryTypesSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new ClientCategoryTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchClientCategoryTypesSpy).toHaveBeenCalled();
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
          id: "c43f9c3g-380c-494e-47c8-d12fff738188",
          name: "Default Category Type",
        },
      ];
      fetchClientCategoryTypesSpy.mockResolvedValue(mockResponse);

      const handler = new ClientCategoryTypeResourceHandler(
        mockContextWithDefaults,
        0,
      );
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchClientCategoryTypesSpy).toHaveBeenCalledWith({
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
        id: "c43f9c3g-380c-494e-47c8-d12fff738188",
        name: "Default Category Type",
      });
    });
  });

  describe("get operation", () => {
    test("fetches single client category type by ID", async () => {
      const mockResponse = {
        id: "c43f9c3g-380c-494e-47c8-d12fff738188",
        name: "Test Category Type",
        short_name: "TCT",
        note: "Test category type for unit tests",
      };

      fetchClientCategoryTypeSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new ClientCategoryTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(fetchClientCategoryTypeSpy).toHaveBeenCalledWith({
        host: "https://api.example.com",
        token: "test-token",
        clientInstanceId: "instance-1",
        clientCategoryTypeId: "c43f9c3g-380c-494e-47c8-d12fff738188",
        select: "id,name,short_name",
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockResponse);
    });

    test("handles parameters with default values for get", async () => {
      const mockContextWithDefaults = createMockContext({
        parameters: {
          select: undefined,
          clientCategoryTypeId: "c43f9c3g-380c-494e-47c8-d12fff738188",
        },
      });
      const mockResponse = {
        id: "c43f9c3g-380c-494e-47c8-d12fff738188",
        name: "Category Type",
      };
      fetchClientCategoryTypeSpy.mockResolvedValue(mockResponse);

      const handler = new ClientCategoryTypeResourceHandler(
        mockContextWithDefaults,
        0,
      );
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(fetchClientCategoryTypeSpy).toHaveBeenCalledWith({
        host: "https://api.example.com",
        token: "test-token",
        clientInstanceId: "instance-1",
        clientCategoryTypeId: "c43f9c3g-380c-494e-47c8-d12fff738188",
        select: undefined,
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockResponse);
    });
  });

  describe("create operation", () => {
    test("creates client category type with data", async () => {
      createClientCategoryTypeSpy.mockResolvedValue(undefined);

      const mockContext = createMockContext();
      const handler = new ClientCategoryTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createClientCategoryTypeSpy).toHaveBeenCalledWith({
        host: "https://api.example.com",
        token: "test-token",
        clientInstanceId: "instance-1",
        clientCategoryType: {
          short_name: "TCT",
          name: "Test Category Type",
          note: "Test category type for unit tests",
        },
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("creates client category type without response data", async () => {
      createClientCategoryTypeSpy.mockResolvedValue(undefined);

      const mockContext = createMockContext();
      const handler = new ClientCategoryTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createClientCategoryTypeSpy).toHaveBeenCalled();
      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });
  });

  describe("update operation", () => {
    test("updates client category type with data", async () => {
      updateClientCategoryTypeSpy.mockResolvedValue(undefined);

      const mockContext = createMockContext();
      const handler = new ClientCategoryTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("update", mockAuthContext, returnData);

      expect(updateClientCategoryTypeSpy).toHaveBeenCalledWith({
        host: "https://api.example.com",
        token: "test-token",
        clientInstanceId: "instance-1",
        clientCategoryTypeId: "c43f9c3g-380c-494e-47c8-d12fff738188",
        clientCategoryType: {
          short_name: "TCT",
          name: "Test Category Type",
          note: "Test category type for unit tests",
        },
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("updates client category type without response data", async () => {
      updateClientCategoryTypeSpy.mockResolvedValue(undefined);

      const mockContext = createMockContext();
      const handler = new ClientCategoryTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("update", mockAuthContext, returnData);

      expect(updateClientCategoryTypeSpy).toHaveBeenCalled();
      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });
  });

  describe("error handling", () => {
    test("throws NodeApiError for unsupported operation", async () => {
      const mockContext = createMockContext();
      const handler = new ClientCategoryTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("unsupported", mockAuthContext, returnData),
      ).rejects.toThrow(
        'The operation "unsupported" is not supported for resource "clientCategoryType".',
      );
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      const mockContextWithContinueOnFail = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const apiError = new Error("API Error");
      fetchClientCategoryTypesSpy.mockRejectedValue(apiError);

      const handler = new ClientCategoryTypeResourceHandler(
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
      fetchClientCategoryTypesSpy.mockRejectedValue(apiError);

      const mockContext = createMockContext();
      const handler = new ClientCategoryTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow();
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper authentication context", async () => {
      const mockResponse = [
        {
          id: "c43f9c3g-380c-494e-47c8-d12fff738188",
          name: "Test Category Type",
        },
      ];
      fetchClientCategoryTypesSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new ClientCategoryTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchClientCategoryTypesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          host: mockAuthContext.host,
          token: mockAuthContext.token,
          clientInstanceId: mockAuthContext.clientInstanceId,
        }),
      );
    });

    test("handles metadata properly", async () => {
      const mockResponse = [
        {
          id: "c43f9c3g-380c-494e-47c8-d12fff738188",
          name: "Test Category Type",
        },
      ];
      fetchClientCategoryTypesSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new ClientCategoryTypeResourceHandler(mockContext, 2);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "c43f9c3g-380c-494e-47c8-d12fff738188",
        name: "Test Category Type",
      });
    });

    test("respects item index in error handling", async () => {
      const apiError = new Error("API Error");
      fetchClientCategoryTypesSpy.mockRejectedValue(apiError);

      const mockContextWithContinueOnFail = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new ClientCategoryTypeResourceHandler(
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
        {
          id: "c43f9c3g-380c-494e-47c8-d12fff738188",
          name: "Test Category Type",
        },
      ];
      fetchClientCategoryTypesSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new ClientCategoryTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchClientCategoryTypesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          select: "id,name,short_name",
        }),
      );
    });

    test("correctly retrieves filter parameter", async () => {
      const mockResponse = [
        {
          id: "c43f9c3g-380c-494e-47c8-d12fff738188",
          name: "Test Category Type",
        },
      ];
      fetchClientCategoryTypesSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new ClientCategoryTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchClientCategoryTypesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: "startswith(name, 'Test')",
        }),
      );
    });

    test("correctly retrieves clientCategoryTypeId parameter", async () => {
      const mockResponse = {
        id: "c43f9c3g-380c-494e-47c8-d12fff738188",
        name: "Test Category Type",
      };
      fetchClientCategoryTypeSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new ClientCategoryTypeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(fetchClientCategoryTypeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          clientCategoryTypeId: "c43f9c3g-380c-494e-47c8-d12fff738188",
        }),
      );
    });
  });
});
