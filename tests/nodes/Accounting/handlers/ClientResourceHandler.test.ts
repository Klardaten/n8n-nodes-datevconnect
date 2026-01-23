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
import { ClientResourceHandler } from "../../../../nodes/Accounting/handlers/ClientResourceHandler";
import type { AuthContext } from "../../../../nodes/Accounting/types";
import { datevConnectClient } from "../../../../src/services/accountingClient";

// Test spies
let getClientsSpy: any;
let getClientSpy: any;

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
        clientId: "client-123",
        top: 50,
        skip: 10,
        select: "id,name",
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
};

describe("ClientResourceHandler", () => {
  beforeEach(() => {
    getClientsSpy = spyOn(
      datevConnectClient.accounting,
      "getClients",
    ).mockResolvedValue([
      {
        id: "client-1",
        name: "Test Client 1",
        consultant_number: "1001",
        client_number: "10001",
      },
      {
        id: "client-2",
        name: "Test Client 2",
        consultant_number: "1002",
        client_number: "10002",
      },
    ]);
    getClientSpy = spyOn(
      datevConnectClient.accounting,
      "getClient",
    ).mockResolvedValue({
      id: "client-123",
      name: "Test Client",
      consultant_number: "1001",
      client_number: "10001",
    });
  });

  afterEach(() => {
    getClientsSpy?.mockRestore();
    getClientSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches clients with parameters", async () => {
      const context = createMockContext();
      const handler = new ClientResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getClientsSpy).toHaveBeenCalledWith(context, {
        top: 50,
        skip: 10,
        select: "id,name",
        filter: "status eq active",
      });

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({
        id: "client-1",
        name: "Test Client 1",
        consultant_number: "1001",
        client_number: "10001",
      });
    });

    test("handles empty results", async () => {
      getClientsSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new ClientResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(0);
    });

    test("handles parameters with default values", async () => {
      const context = createMockContext({
        parameters: {
          // Override the default mock parameters to simulate no parameters provided
          top: undefined,
          skip: undefined,
          select: undefined,
          filter: undefined,
        },
      });
      const handler = new ClientResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getClientsSpy).toHaveBeenCalledWith(context, {
        top: 100, // Default value
        skip: 0, // Default value
      });
    });
  });

  describe("get operation", () => {
    test("fetches single client by ID", async () => {
      const context = createMockContext();
      const handler = new ClientResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getClientSpy).toHaveBeenCalledWith(context, "client-123", {
        host: "https://api.example.com",
        token: "test-token",
        clientInstanceId: "instance-1",
        select: "id,name",
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "client-123",
        name: "Test Client",
        consultant_number: "1001",
        client_number: "10001",
      });
    });

    test("handles parameters with default values for get", async () => {
      const context = createMockContext({
        parameters: {
          clientId: "client-123",
        },
      });
      const handler = new ClientResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getClientSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        expect.objectContaining({
          host: "https://api.example.com",
          token: "test-token",
          clientInstanceId: "instance-1",
        }),
      );
    });
  });

  describe("error handling", () => {
    test("throws NodeApiError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new ClientResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute(
          "unsupportedOperation" as any,
          mockAuthContext,
          returnData,
        ),
      ).rejects.toThrow(
        'The operation "unsupportedOperation" is not supported for resource "client".',
      );
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      getClientsSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });
      const handler = new ClientResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Error" });
    });

    test("propagates error when continueOnFail is false", async () => {
      getClientsSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext();
      const handler = new ClientResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("API Error");
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper execution context", async () => {
      const context = createMockContext();
      const handler = new ClientResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getClientsSpy).toHaveBeenCalledWith(context, expect.any(Object));
    });

    test("handles metadata properly", async () => {
      const context = createMockContext();
      const handler = new ClientResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0]).toHaveProperty("pairedItem");
      expect(returnData[0].pairedItem).toEqual({ item: 0 });
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves select parameter", async () => {
      const context = createMockContext({
        parameters: { select: "id,name,number" },
      });
      const handler = new ClientResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getClientsSpy).toHaveBeenCalledWith(
        context,
        expect.objectContaining({ select: "id,name,number" }),
      );
    });

    test("correctly retrieves filter parameter", async () => {
      const context = createMockContext({
        parameters: { filter: "status eq 'active'" },
      });
      const handler = new ClientResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getClientsSpy).toHaveBeenCalledWith(
        context,
        expect.objectContaining({ filter: "status eq 'active'" }),
      );
    });

    test("correctly retrieves clientId parameter", async () => {
      const context = createMockContext({
        parameters: { clientId: "test-client-id" },
      });
      const handler = new ClientResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getClientSpy).toHaveBeenCalledWith(
        context,
        "test-client-id",
        expect.any(Object),
      );
    });
  });
});
