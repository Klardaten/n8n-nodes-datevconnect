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
import { AreaOfResponsibilityResourceHandler } from "../../../../nodes/MasterData/handlers/AreaOfResponsibilityResourceHandler";
import type { AuthContext } from "../../../../nodes/MasterData/types";
import * as datevConnectClientModule from "../../../../src/services/datevConnectClient";

// Test spies
let fetchAreaOfResponsibilitiesSpy: any;

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
        // Area of responsibility operations parameters
        select: "id,name,status",
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
};

describe("AreaOfResponsibilityResourceHandler", () => {
  beforeEach(() => {
    fetchAreaOfResponsibilitiesSpy = spyOn(
      datevConnectClientModule,
      "fetchAreaOfResponsibilities",
    ).mockResolvedValue([
      {
        id: "AB",
        name: "Anlagenbuchführung",
        standard: true,
        status: "active",
      },
      {
        id: "MV",
        name: "Mandatsverantwortung",
        standard: true,
        status: "active",
      },
    ]);
  });

  afterEach(() => {
    fetchAreaOfResponsibilitiesSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches area of responsibilities with parameters", async () => {
      const mockContext = createMockContext();
      const handler = new AreaOfResponsibilityResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchAreaOfResponsibilitiesSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        top: 100,
        skip: 0,
        select: "id,name,status",
        filter: "status eq active",
      });
      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({
        id: "AB",
        name: "Anlagenbuchführung",
        standard: true,
        status: "active",
      });
      expect(returnData[1].json).toEqual({
        id: "MV",
        name: "Mandatsverantwortung",
        standard: true,
        status: "active",
      });
    });

    test("handles empty results", async () => {
      fetchAreaOfResponsibilitiesSpy.mockResolvedValue([]);
      const mockContext = createMockContext();
      const handler = new AreaOfResponsibilityResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchAreaOfResponsibilitiesSpy).toHaveBeenCalled();
      expect(returnData).toHaveLength(0);
    });

    test("handles parameters with default values", async () => {
      const mockContextWithDefaults = createMockContext({
        parameters: {
          select: undefined,
          filter: undefined,
        },
      });
      const handler = new AreaOfResponsibilityResourceHandler(
        mockContextWithDefaults,
        0,
      );
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchAreaOfResponsibilitiesSpy).toHaveBeenCalledWith({
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
      const handler = new AreaOfResponsibilityResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("unsupported", mockAuthContext, returnData),
      ).rejects.toThrow(
        'The operation "unsupported" is not supported for resource "areaOfResponsibility".',
      );
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      fetchAreaOfResponsibilitiesSpy.mockRejectedValue(new Error("API Error"));
      const mockContextWithContinueOnFail = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });
      const handler = new AreaOfResponsibilityResourceHandler(
        mockContextWithContinueOnFail,
        0,
      );
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toMatchObject({
        error: expect.any(String),
      });
    });

    test("propagates error when continueOnFail is false", async () => {
      fetchAreaOfResponsibilitiesSpy.mockRejectedValue(new Error("API Error"));
      const mockContext = createMockContext();
      const handler = new AreaOfResponsibilityResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow();
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper authentication context", async () => {
      const mockContext = createMockContext();
      const handler = new AreaOfResponsibilityResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchAreaOfResponsibilitiesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          host: "https://api.example.com",
          token: "test-token",
          clientInstanceId: "instance-1",
        }),
      );
    });

    test("handles metadata properly", async () => {
      const mockContext = createMockContext();
      const handler = new AreaOfResponsibilityResourceHandler(mockContext, 2);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(2);
      expect(returnData[0]).toMatchObject({
        json: {
          id: "AB",
          name: "Anlagenbuchführung",
          standard: true,
          status: "active",
        },
        pairedItem: { item: 2 },
      });
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves select parameter", async () => {
      const mockContext = createMockContext();
      const handler = new AreaOfResponsibilityResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchAreaOfResponsibilitiesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          select: "id,name,status",
        }),
      );
    });

    test("correctly retrieves filter parameter", async () => {
      const mockContext = createMockContext();
      const handler = new AreaOfResponsibilityResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchAreaOfResponsibilitiesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: "status eq active",
        }),
      );
    });
  });
});
