/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test, beforeEach, afterEach, spyOn, mock } from "bun:test";
import { ClientResourceHandler } from "../../../../nodes/MasterData/handlers/ClientResourceHandler";
import type { AuthContext } from "../../../../nodes/MasterData/types";
import * as datevConnectClientModule from "../../../../src/services/datevConnectClient";

// Test spies
let fetchClientsSpy: any;
let fetchClientSpy: any;
let createClientSpy: any;
let updateClientSpy: any;
let fetchClientResponsibilitiesSpy: any;
let updateClientResponsibilitiesSpy: any;
let fetchClientCategoriesSpy: any;
let updateClientCategoriesSpy: any;
let fetchClientGroupsSpy: any;
let updateClientGroupsSpy: any;
let fetchClientDeletionLogSpy: any;
let fetchNextFreeClientNumberSpy: any;

// Mock IExecuteFunctions
const createMockContext = (overrides: any = {}) => ({
  getCredentials: mock().mockResolvedValue({
    host: "https://api.example.com",
    email: "user@example.com",
    password: "secret",
    clientInstanceId: "instance-1",
    ...overrides.credentials,
  }),
  getNodeParameter: mock((name: string, itemIndex: number, defaultValue?: unknown) => {
    const mockParams: Record<string, unknown> = {
      // Client operations parameters
      "clientId": "client-123",
      "clientData": '{"name":"Test Client"}',
      "maxNumber": 1000,
      "responsibilitiesData": '[{"id":"resp-1"}]',
      "categoriesData": '[{"id":"cat-1"}]',
      "groupsData": '[{"id":"group-1"}]',
      "top": 50,
      "skip": 10,
      "select": "id,name",
      "filter": "status eq active",
      "start": 1000,
      "range": 500,
      ...overrides.parameters,
    };
    return mockParams[name] !== undefined ? mockParams[name] : defaultValue;
  }),
  getNode: mock(() => ({ name: "TestNode" })),
  helpers: {
    returnJsonArray: mock((data: any[]) => data.map(entry => ({ json: entry }))),
    constructExecutionMetaData: mock((data: any[], meta: any) => 
      data.map(entry => ({ ...entry, pairedItem: meta.itemData }))
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
    fetchClientsSpy = spyOn(datevConnectClientModule, "fetchClients").mockResolvedValue([]);
    fetchClientSpy = spyOn(datevConnectClientModule, "fetchClient").mockResolvedValue({ id: "client-123" });
    createClientSpy = spyOn(datevConnectClientModule, "createClient").mockResolvedValue(undefined);
    updateClientSpy = spyOn(datevConnectClientModule, "updateClient").mockResolvedValue(undefined);
    fetchClientResponsibilitiesSpy = spyOn(datevConnectClientModule, "fetchClientResponsibilities").mockResolvedValue([]);
    updateClientResponsibilitiesSpy = spyOn(datevConnectClientModule, "updateClientResponsibilities").mockResolvedValue(undefined);
    fetchClientCategoriesSpy = spyOn(datevConnectClientModule, "fetchClientCategories").mockResolvedValue([]);
    updateClientCategoriesSpy = spyOn(datevConnectClientModule, "updateClientCategories").mockResolvedValue(undefined);
    fetchClientGroupsSpy = spyOn(datevConnectClientModule, "fetchClientGroups").mockResolvedValue([]);
    updateClientGroupsSpy = spyOn(datevConnectClientModule, "updateClientGroups").mockResolvedValue(undefined);
    fetchClientDeletionLogSpy = spyOn(datevConnectClientModule, "fetchClientDeletionLog").mockResolvedValue([]);
    fetchNextFreeClientNumberSpy = spyOn(datevConnectClientModule, "fetchNextFreeClientNumber").mockResolvedValue({ next_free_number: 2000 });
  });

  afterEach(() => {
    fetchClientsSpy?.mockRestore();
    fetchClientSpy?.mockRestore();
    createClientSpy?.mockRestore();
    updateClientSpy?.mockRestore();
    fetchClientResponsibilitiesSpy?.mockRestore();
    updateClientResponsibilitiesSpy?.mockRestore();
    fetchClientCategoriesSpy?.mockRestore();
    updateClientCategoriesSpy?.mockRestore();
    fetchClientGroupsSpy?.mockRestore();
    updateClientGroupsSpy?.mockRestore();
    fetchClientDeletionLogSpy?.mockRestore();
    fetchNextFreeClientNumberSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches clients with parameters", async () => {
      const mockClients = [{ id: "1", name: "Client 1" }, { id: "2", name: "Client 2" }];
      fetchClientsSpy.mockResolvedValueOnce(mockClients);

      const context = createMockContext();
      const handler = new ClientResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchClientsSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        top: 50,
        skip: 10,
        select: "id,name",
        filter: "status eq active",
      });

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({ id: "1", name: "Client 1" });
      expect(returnData[1].json).toEqual({ id: "2", name: "Client 2" });
    });
  });

  describe("get operation", () => {
    test("fetches single client by ID", async () => {
      const mockClient = { id: "client-123", name: "Test Client" };
      fetchClientSpy.mockResolvedValueOnce(mockClient);

      const context = createMockContext();
      const handler = new ClientResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(fetchClientSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        clientId: "client-123",
        select: "id,name",
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockClient);
    });
  });

  describe("create operation", () => {
    test("creates client with data and maxNumber", async () => {
      const context = createMockContext();
      const handler = new ClientResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createClientSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        client: { name: "Test Client" },
        maxNumber: 1000,
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("creates client without maxNumber when 0", async () => {
      const context = createMockContext({
        parameters: { maxNumber: 0 },
      });
      const handler = new ClientResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createClientSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        client: { name: "Test Client" },
        maxNumber: undefined,
      });
    });
  });

  describe("update operation", () => {
    test("updates client with data", async () => {
      const context = createMockContext();
      const handler = new ClientResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("update", mockAuthContext, returnData);

      expect(updateClientSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        clientId: "client-123",
        client: { name: "Test Client" },
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });
  });

  describe("getResponsibilities operation", () => {
    test("fetches client responsibilities", async () => {
      const mockResponsibilities = [{ id: "resp-1", area: "Finance" }];
      fetchClientResponsibilitiesSpy.mockResolvedValueOnce(mockResponsibilities);

      const context = createMockContext();
      const handler = new ClientResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getResponsibilities", mockAuthContext, returnData);

      expect(fetchClientResponsibilitiesSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        clientId: "client-123",
        select: "id,name",
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ id: "resp-1", area: "Finance" });
    });
  });

  describe("updateResponsibilities operation", () => {
    test("updates client responsibilities", async () => {
      const context = createMockContext();
      const handler = new ClientResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("updateResponsibilities", mockAuthContext, returnData);

      expect(updateClientResponsibilitiesSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        clientId: "client-123",
        responsibilities: [{ id: "resp-1" }],
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });
  });

  describe("getClientCategories operation", () => {
    test("fetches client categories", async () => {
      const mockCategories = [{ id: "cat-1", name: "Category 1" }];
      fetchClientCategoriesSpy.mockResolvedValueOnce(mockCategories);

      const context = createMockContext();
      const handler = new ClientResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getClientCategories", mockAuthContext, returnData);

      expect(fetchClientCategoriesSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        clientId: "client-123",
        select: "id,name",
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ id: "cat-1", name: "Category 1" });
    });
  });

  describe("updateClientCategories operation", () => {
    test("updates client categories", async () => {
      const context = createMockContext();
      const handler = new ClientResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("updateClientCategories", mockAuthContext, returnData);

      expect(updateClientCategoriesSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        clientId: "client-123",
        categories: [{ id: "cat-1" }],
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });
  });

  describe("getClientGroups operation", () => {
    test("fetches client groups", async () => {
      const mockGroups = [{ id: "group-1", name: "Group 1" }];
      fetchClientGroupsSpy.mockResolvedValueOnce(mockGroups);

      const context = createMockContext();
      const handler = new ClientResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getClientGroups", mockAuthContext, returnData);

      expect(fetchClientGroupsSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        clientId: "client-123",
        select: "id,name",
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ id: "group-1", name: "Group 1" });
    });
  });

  describe("updateClientGroups operation", () => {
    test("updates client groups", async () => {
      const context = createMockContext();
      const handler = new ClientResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("updateClientGroups", mockAuthContext, returnData);

      expect(updateClientGroupsSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        clientId: "client-123",
        groups: [{ id: "group-1" }],
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });
  });

  describe("getDeletionLog operation", () => {
    test("fetches client deletion log", async () => {
      const mockDeletionLog = [{ id: "deleted-1", deletedAt: "2023-01-01" }];
      fetchClientDeletionLogSpy.mockResolvedValueOnce(mockDeletionLog);

      const context = createMockContext();
      const handler = new ClientResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getDeletionLog", mockAuthContext, returnData);

      expect(fetchClientDeletionLogSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        select: "id,name",
        filter: "status eq active",
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ id: "deleted-1", deletedAt: "2023-01-01" });
    });
  });

  describe("getNextFreeNumber operation", () => {
    test("fetches next free client number", async () => {
      const mockResult = { next_free_number: 2000 };
      fetchNextFreeClientNumberSpy.mockResolvedValueOnce(mockResult);

      const context = createMockContext();
      const handler = new ClientResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getNextFreeNumber", mockAuthContext, returnData);

      expect(fetchNextFreeClientNumberSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        start: 1000,
        range: 500,
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockResult);
    });

    test("omits range when 0", async () => {
      const context = createMockContext({
        parameters: { range: 0 },
      });
      const handler = new ClientResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getNextFreeNumber", mockAuthContext, returnData);

      expect(fetchNextFreeClientNumberSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        start: 1000,
        range: undefined,
      });
    });
  });

  describe("error handling", () => {
    test("throws NodeApiError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new ClientResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("unsupportedOp", mockAuthContext, returnData)
      ).rejects.toThrow("The operation \"unsupportedOp\" is not supported for resource \"client\".");
    });

    test("handles API errors gracefully", async () => {
      fetchClientsSpy.mockRejectedValueOnce(new Error("API Error"));

      const context = createMockContext({
        context: { continueOnFail: mock(() => true) },
      });
      const handler = new ClientResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Error" });
      expect(returnData[0].pairedItem).toEqual({ item: 0 });
    });
  });
});