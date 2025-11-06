/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test, beforeEach, spyOn, mock } from "bun:test";
import { DocumentResourceHandler } from "../../../../nodes/DocumentManagement/handlers/DocumentResourceHandler";
import { DocumentManagementClient } from "../../../../src/services/documentManagementClient";
import type { AuthContext } from "../../../../nodes/DocumentManagement/types";

let documentResourceHandler: DocumentResourceHandler;
let mockContext: any;

const mockAuthContext: AuthContext = {
  host: "localhost",
  token: "test-token",
  clientInstanceId: "test-client-id"
};

describe("DocumentResourceHandler", () => {
  beforeEach(() => {
    mockContext = {
      getNodeParameter: mock(() => undefined),
      continueOnFail: mock(() => false),
      getNode: mock(() => ({ type: "test-node" })),
      getCredentials: mock(() => null),
    };
    documentResourceHandler = new DocumentResourceHandler(mockContext, 0);

    // Mock the DocumentManagementClient methods
    spyOn(DocumentManagementClient, "fetchDocuments").mockResolvedValue([
      {
        id: "doc-123",
        description: "Sample document",
        class: { id: 1, name: "Document" },
        state: { id: "active", name: "Active" },
      },
    ]);

    spyOn(DocumentManagementClient, "createDocument").mockResolvedValue({
      id: "new-doc-123",
      success: true,
      location: "/documents/new-doc-123",
    });

    spyOn(DocumentManagementClient, "fetchDocument").mockResolvedValue({
      id: "doc-123",
      description: "Sample document",
      class: { id: 1, name: "Document" },
      state: { id: "active", name: "Active" },
    });

    spyOn(DocumentManagementClient, "deleteDocument").mockResolvedValue(undefined);
    spyOn(DocumentManagementClient, "deleteDocumentPermanently").mockResolvedValue(undefined);
  });

  test("getAll operation fetches documents", async () => {
    mockContext.getNodeParameter.mockImplementation((paramName: string) => {
      switch (paramName) {
        case "filter":
          return "";
        case "top":
          return 10;
        case "skip":
          return 0;
        default:
          return undefined;
      }
    });

    const returnData: any[] = [];
    await documentResourceHandler.execute("getAll", mockAuthContext, returnData);

    expect(returnData).toHaveLength(1);
    expect(returnData[0].json).toEqual({
      success: true,
      id: "doc-123",
      description: "Sample document",
      class: { id: 1, name: "Document" },
      state: { id: "active", name: "Active" },
    });
    expect(DocumentManagementClient.fetchDocuments).toHaveBeenCalledWith({
      host: "localhost",
      token: "test-token",
      clientInstanceId: "test-client-id",
      filter: undefined,
      top: 10,
      skip: undefined,
    });
  });

  test("get operation fetches single document by ID", async () => {
    mockContext.getNodeParameter.mockImplementation((paramName: string) => {
      if (paramName === "documentId") return "doc-123";
      return undefined;
    });

    const returnData: any[] = [];
    await documentResourceHandler.execute("get", mockAuthContext, returnData);

    expect(returnData).toHaveLength(1);
    expect(returnData[0].json.success).toBe(true);
    expect(returnData[0].json.id).toBe("doc-123");
  });

  test("create operation creates document with data", async () => {
    mockContext.getNodeParameter.mockImplementation((paramName: string) => {
      if (paramName === "documentData") return JSON.stringify({
        description: "Test document",
        class: { id: 1 },
        state: { id: "active" },
      });
      return undefined;
    });

    const returnData: any[] = [];
    await documentResourceHandler.execute("create", mockAuthContext, returnData);

    expect(returnData).toHaveLength(1);
    expect(returnData[0].json).toEqual({
      id: "new-doc-123",
      success: true,
      location: "/documents/new-doc-123",
    });
    expect(DocumentManagementClient.createDocument).toHaveBeenCalledWith({
      host: "localhost",
      token: "test-token",
      clientInstanceId: "test-client-id",
      document: {
        description: "Test document",
        class: { id: 1 },
        state: { id: "active" },
      },
    });
  });

  test("delete operation deletes document by ID", async () => {
    mockContext.getNodeParameter.mockImplementation((paramName: string) => {
      if (paramName === "documentId") return "doc-123";
      return undefined;
    });

    const returnData: any[] = [];
    await documentResourceHandler.execute("delete", mockAuthContext, returnData);

    expect(returnData).toHaveLength(1);
    expect(returnData[0].json.success).toBe(true);
    expect(returnData[0].json.documentId).toBe("doc-123");
    expect(returnData[0].json.deleted).toBe(true);
  });

  test("handles API errors gracefully when continueOnFail is true", async () => {
    mockContext.continueOnFail.mockReturnValue(true);
    mockContext.getNodeParameter.mockImplementation(() => {
      throw new Error("API Error");
    });

    const returnData: any[] = [];
    await documentResourceHandler.execute("getAll", mockAuthContext, returnData);

    expect(returnData).toHaveLength(1);
    expect(returnData[0].json.error).toBeDefined();
  });
});