/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test, beforeEach, spyOn, mock } from "bun:test";
import { PropertyTemplateResourceHandler } from "../../../../nodes/DocumentManagement/handlers/PropertyTemplateResourceHandler";
import { DocumentManagementClient } from "../../../../src/services/documentManagementClient";
import type { AuthContext } from "../../../../nodes/DocumentManagement/types";

let propertyTemplateResourceHandler: PropertyTemplateResourceHandler;
let mockContext: any;

const mockAuthContext: AuthContext = {
  host: "localhost",
  token: "test-token",
  clientInstanceId: "test-client-id",
};

describe("PropertyTemplateResourceHandler", () => {
  beforeEach(() => {
    mockContext = {
      getNodeParameter: mock(() => undefined),
      continueOnFail: mock(() => false),
      getNode: mock(() => ({ type: "test-node" })),
      getCredentials: mock(() => null),
    };
    propertyTemplateResourceHandler = new PropertyTemplateResourceHandler(
      mockContext,
      0,
    );

    // Mock the DocumentManagementClient methods
    spyOn(DocumentManagementClient, "fetchPropertyTemplates").mockResolvedValue(
      [
        { id: 1, name: "Invoice Template", document_class: 1 },
        { id: 2, name: "Contract Template", document_class: 2 },
      ],
    );
  });

  test("getAll operation fetches property templates", async () => {
    mockContext.getNodeParameter.mockImplementation((paramName: string) => {
      if (paramName === "filter") return "document_class eq 1";
      return undefined;
    });

    const returnData: any[] = [];
    await propertyTemplateResourceHandler.execute(
      "getAll",
      mockAuthContext,
      returnData,
    );

    expect(returnData).toHaveLength(2);
    expect(returnData[0].json).toEqual({
      success: true,
      id: 1,
      name: "Invoice Template",
      document_class: 1,
    });
    expect(returnData[1].json).toEqual({
      success: true,
      id: 2,
      name: "Contract Template",
      document_class: 2,
    });
    expect(
      DocumentManagementClient.fetchPropertyTemplates,
    ).toHaveBeenCalledWith({
      host: "localhost",
      token: "test-token",
      clientInstanceId: "test-client-id",
      filter: "document_class eq 1",
    });
  });

  test("getAll operation without filter", async () => {
    mockContext.getNodeParameter.mockImplementation((paramName: string) => {
      if (paramName === "filter") return "";
      return undefined;
    });

    const returnData: any[] = [];
    await propertyTemplateResourceHandler.execute(
      "getAll",
      mockAuthContext,
      returnData,
    );

    expect(
      DocumentManagementClient.fetchPropertyTemplates,
    ).toHaveBeenCalledWith({
      host: "localhost",
      token: "test-token",
      clientInstanceId: "test-client-id",
      filter: undefined,
    });
  });

  test("handles API errors gracefully when continueOnFail is true", async () => {
    mockContext.continueOnFail.mockReturnValue(true);
    mockContext.getNodeParameter.mockImplementation(
      (paramName: string, itemIndex: number, defaultValue: any) => {
        if (paramName === "filter") return defaultValue || "";
        return defaultValue;
      },
    );
    spyOn(DocumentManagementClient, "fetchPropertyTemplates").mockRejectedValue(
      new Error("API Error"),
    );

    const returnData: any[] = [];
    await propertyTemplateResourceHandler.execute(
      "getAll",
      mockAuthContext,
      returnData,
    );

    expect(returnData).toHaveLength(1);
    expect(returnData[0].json).toEqual({
      error: "API Error",
    });
  });
});
