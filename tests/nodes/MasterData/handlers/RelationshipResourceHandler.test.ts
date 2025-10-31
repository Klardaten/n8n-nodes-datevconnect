/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test, beforeEach, afterEach, spyOn, mock } from "bun:test";
import { RelationshipResourceHandler } from "../../../../nodes/MasterData/handlers/RelationshipResourceHandler";
import type { AuthContext } from "../../../../nodes/MasterData/types";
import * as datevConnectClientModule from "../../../../src/services/datevConnectClient";

// Test spies
let fetchRelationshipsSpy: any;
let fetchRelationshipTypesSpy: any;

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
      // Relationship operations parameters (only select and filter are used)
      "select": "id,type,status",
      "filter": "status eq active",
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

describe("RelationshipResourceHandler", () => {
  beforeEach(() => {
    fetchRelationshipsSpy = spyOn(datevConnectClientModule, "fetchRelationships").mockResolvedValue([]);
    fetchRelationshipTypesSpy = spyOn(datevConnectClientModule, "fetchRelationshipTypes").mockResolvedValue([]);
  });

  afterEach(() => {
    fetchRelationshipsSpy?.mockRestore();
    fetchRelationshipTypesSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches relationships with parameters", async () => {
      const mockRelationships = [
        { id: "1", type: "business", status: "active" },
        { id: "2", type: "personal", status: "active" },
      ];
      fetchRelationshipsSpy.mockResolvedValueOnce(mockRelationships);

      const context = createMockContext();
      const handler = new RelationshipResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchRelationshipsSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        select: "id,type,status",
        filter: "status eq active",
      });

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({ id: "1", type: "business", status: "active" });
      expect(returnData[1].json).toEqual({ id: "2", type: "personal", status: "active" });
    });

    test("handles empty results", async () => {
      fetchRelationshipsSpy.mockResolvedValueOnce([]);

      const context = createMockContext();
      const handler = new RelationshipResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchRelationshipsSpy).toHaveBeenCalled();
      expect(returnData).toHaveLength(0);
    });

    test("handles parameters with default values", async () => {
      const mockRelationships = [{ id: "1", type: "business" }];
      fetchRelationshipsSpy.mockResolvedValueOnce(mockRelationships);

      const context = createMockContext({
        parameters: {
          select: undefined,
          filter: undefined,
        },
      });
      const handler = new RelationshipResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchRelationshipsSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        select: undefined,
        filter: undefined,
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ id: "1", type: "business" });
    });
  });

  describe("getTypes operation", () => {
    test("fetches relationship types with parameters", async () => {
      const mockRelationshipTypes = [
        { id: "1", name: "Business Partner", category: "business" },
        { id: "2", name: "Employee", category: "employment" },
      ];
      fetchRelationshipTypesSpy.mockResolvedValueOnce(mockRelationshipTypes);

      const context = createMockContext();
      const handler = new RelationshipResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getTypes", mockAuthContext, returnData);

      expect(fetchRelationshipTypesSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        select: "id,type,status",
        filter: "status eq active",
      });

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({ id: "1", name: "Business Partner", category: "business" });
      expect(returnData[1].json).toEqual({ id: "2", name: "Employee", category: "employment" });
    });

    test("handles empty results for getTypes", async () => {
      fetchRelationshipTypesSpy.mockResolvedValueOnce([]);

      const context = createMockContext();
      const handler = new RelationshipResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getTypes", mockAuthContext, returnData);

      expect(fetchRelationshipTypesSpy).toHaveBeenCalled();
      expect(returnData).toHaveLength(0);
    });

    test("handles parameters with default values for getTypes", async () => {
      const mockRelationshipTypes = [{ id: "1", name: "Manager" }];
      fetchRelationshipTypesSpy.mockResolvedValueOnce(mockRelationshipTypes);

      const context = createMockContext({
        parameters: {
          select: undefined,
          filter: undefined,
        },
      });
      const handler = new RelationshipResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getTypes", mockAuthContext, returnData);

      expect(fetchRelationshipTypesSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        select: undefined,
        filter: undefined,
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ id: "1", name: "Manager" });
    });
  });

  describe("error handling", () => {
    test("throws NodeApiError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new RelationshipResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("unsupportedOp", mockAuthContext, returnData)
      ).rejects.toThrow("The operation \"unsupportedOp\" is not supported for resource \"relationship\".");
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      fetchRelationshipsSpy.mockRejectedValueOnce(new Error("Network timeout"));

      const context = createMockContext({
        context: { continueOnFail: mock(() => true) },
      });
      const handler = new RelationshipResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "Network timeout" });
      expect(returnData[0].pairedItem).toEqual({ item: 0 });
    });

    test("propagates error when continueOnFail is false", async () => {
      fetchRelationshipsSpy.mockRejectedValueOnce(new Error("API Connection Failed"));

      const context = createMockContext({
        context: { continueOnFail: mock(() => false) },
      });
      const handler = new RelationshipResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData)
      ).rejects.toThrow("API Connection Failed");
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper authentication context", async () => {
      const mockRelationships = [{ id: "1", type: "business" }];
      fetchRelationshipsSpy.mockResolvedValueOnce(mockRelationships);

      const customAuthContext: AuthContext = {
        host: "https://staging.api.com",
        token: "staging-token",
        clientInstanceId: "staging-instance",
      };

      const context = createMockContext();
      const handler = new RelationshipResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", customAuthContext, returnData);

      expect(fetchRelationshipsSpy).toHaveBeenCalledWith({
        ...customAuthContext,
        select: "id,type,status",
        filter: "status eq active",
      });
    });

    test("handles metadata properly", async () => {
      const mockRelationships = [{ id: "rel-123", type: "business" }];
      fetchRelationshipsSpy.mockResolvedValueOnce(mockRelationships);

      const context = createMockContext();
      const handler = new RelationshipResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      // Verify metadata construction is called
      expect(context.helpers.constructExecutionMetaData).toHaveBeenCalledWith(
        [{ json: { id: "rel-123", type: "business" } }],
        { itemData: { item: 0 } }
      );
    });
  });
});