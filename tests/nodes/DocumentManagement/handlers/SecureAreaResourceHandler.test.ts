/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test, beforeEach, spyOn, mock } from "bun:test";
import { SecureAreaResourceHandler } from "../../../../nodes/DocumentManagement/handlers/SecureAreaResourceHandler";
import { DocumentManagementClient } from "../../../../src/services/documentManagementClient";
import type { AuthContext } from "../../../../nodes/DocumentManagement/types";

let secureAreaResourceHandler: SecureAreaResourceHandler;
let mockContext: any;

const mockAuthContext: AuthContext = {
  host: "localhost",
  token: "test-token",
  clientInstanceId: "test-client-id",
};

describe("SecureAreaResourceHandler", () => {
  beforeEach(() => {
    mockContext = {
      getNodeParameter: mock(() => undefined),
      continueOnFail: mock(() => false),
      getNode: mock(() => ({ type: "test-node" })),
      getCredentials: mock(() => null),
    };
    secureAreaResourceHandler = new SecureAreaResourceHandler(mockContext, 0);

    // Mock the DocumentManagementClient methods
    spyOn(DocumentManagementClient, "fetchSecureAreas").mockResolvedValue([
      { id: 1, name: "Confidential", description: "Confidential documents" },
      { id: 2, name: "Public", description: "Public documents" },
    ]);
  });

  test("getAll operation fetches secure areas", async () => {
    const returnData: any[] = [];
    await secureAreaResourceHandler.execute(
      "getAll",
      mockAuthContext,
      returnData,
    );

    expect(returnData).toHaveLength(2);
    expect(returnData[0].json).toEqual({
      success: true,
      id: 1,
      name: "Confidential",
      description: "Confidential documents",
    });
    expect(returnData[1].json).toEqual({
      success: true,
      id: 2,
      name: "Public",
      description: "Public documents",
    });
    expect(DocumentManagementClient.fetchSecureAreas).toHaveBeenCalledWith({
      host: "localhost",
      token: "test-token",
      clientInstanceId: "test-client-id",
    });
  });

  test("handles API errors gracefully when continueOnFail is true", async () => {
    mockContext.continueOnFail.mockReturnValue(true);
    spyOn(DocumentManagementClient, "fetchSecureAreas").mockRejectedValue(
      new Error("API Error"),
    );

    const returnData: any[] = [];
    await secureAreaResourceHandler.execute(
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
