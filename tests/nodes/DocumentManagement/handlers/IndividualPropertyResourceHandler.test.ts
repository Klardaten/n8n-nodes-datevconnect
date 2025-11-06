/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test, beforeEach, spyOn, mock } from "bun:test";
import { IndividualPropertyResourceHandler } from "../../../../nodes/DocumentManagement/handlers/IndividualPropertyResourceHandler";
import { DocumentManagementClient } from "../../../../src/services/documentManagementClient";
import type { AuthContext } from "../../../../nodes/DocumentManagement/types";

let individualPropertyResourceHandler: IndividualPropertyResourceHandler;
let mockContext: any;

const mockAuthContext: AuthContext = {
  host: "localhost",
  token: "test-token",
  clientInstanceId: "test-client-id"
};

describe("IndividualPropertyResourceHandler", () => {
  beforeEach(() => {
    mockContext = {
      getNodeParameter: mock(() => undefined),
      continueOnFail: mock(() => false),
      getNode: mock(() => ({ type: "test-node" })),
      getCredentials: mock(() => null),
    };
    individualPropertyResourceHandler = new IndividualPropertyResourceHandler(mockContext, 0);

    // Mock the DocumentManagementClient methods
    spyOn(DocumentManagementClient, "fetchIndividualProperties").mockResolvedValue([
      { id: 1, name: "Custom Property 1", data_type: "string" },
      { id: 2, name: "Custom Property 2", data_type: "number" }
    ]);
  });

  test("getAll operation fetches individual properties", async () => {
    const returnData: any[] = [];
    await individualPropertyResourceHandler.execute("getAll", mockAuthContext, returnData);

    expect(returnData).toHaveLength(2);
    expect(returnData[0].json).toEqual({
      success: true,
      id: 1,
      name: "Custom Property 1",
      data_type: "string"
    });
    expect(returnData[1].json).toEqual({
      success: true,
      id: 2,
      name: "Custom Property 2",
      data_type: "number"
    });
    expect(DocumentManagementClient.fetchIndividualProperties).toHaveBeenCalledWith({
      host: "localhost",
      token: "test-token",
      clientInstanceId: "test-client-id",
    });
  });

  test("handles API errors gracefully when continueOnFail is true", async () => {
    mockContext.continueOnFail.mockReturnValue(true);
    spyOn(DocumentManagementClient, "fetchIndividualProperties").mockRejectedValue(new Error("API Error"));
    
    const returnData: any[] = [];
    await individualPropertyResourceHandler.execute("getAll", mockAuthContext, returnData);

    expect(returnData).toHaveLength(1);
    expect(returnData[0].json).toEqual({
      error: "API Error"
    });
  });
});