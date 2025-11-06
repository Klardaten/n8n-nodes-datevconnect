/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test, beforeEach, spyOn, mock } from "bun:test";
import { IndividualReference1ResourceHandler } from "../../../../nodes/DocumentManagement/handlers/IndividualReference1ResourceHandler";
import { DocumentManagementClient } from "../../../../src/services/documentManagementClient";
import type { AuthContext } from "../../../../nodes/DocumentManagement/types";

let individualReference1ResourceHandler: IndividualReference1ResourceHandler;
let mockContext: any;

const mockAuthContext: AuthContext = {
  host: "localhost",
  token: "test-token",
  clientInstanceId: "test-client-id"
};

describe("IndividualReference1ResourceHandler", () => {
  beforeEach(() => {
    mockContext = {
      getNodeParameter: mock(() => undefined),
      continueOnFail: mock(() => false),
      getNode: mock(() => ({ type: "test-node" })),
      getCredentials: mock(() => null),
    };
    individualReference1ResourceHandler = new IndividualReference1ResourceHandler(mockContext, 0);

    // Mock the DocumentManagementClient methods
    spyOn(DocumentManagementClient, "fetchIndividualReferences1").mockResolvedValue([
      { id: 1, name: "Reference 1", correspondence_partner_guid: null },
      { id: 2, name: "Reference 2", correspondence_partner_guid: "guid-123" }
    ]);

    spyOn(DocumentManagementClient, "createIndividualReference1").mockResolvedValue([
      { id: 3, name: "Test Reference", correspondence_partner_guid: "guid-456" }
    ]);
  });

  test("getAll operation fetches individual references 1", async () => {
    const returnData: any[] = [];
    await individualReference1ResourceHandler.execute("getAll", mockAuthContext, returnData);

    expect(returnData).toHaveLength(2);
    expect(returnData[0].json).toEqual({
      success: true,
      id: 1,
      name: "Reference 1",
      correspondence_partner_guid: null
    });
    expect(returnData[1].json).toEqual({
      success: true,
      id: 2,
      name: "Reference 2",
      correspondence_partner_guid: "guid-123"
    });
    expect(DocumentManagementClient.fetchIndividualReferences1).toHaveBeenCalledWith({
      host: "localhost",
      token: "test-token",
      clientInstanceId: "test-client-id",
      top: undefined,
      skip: undefined,
    });
  });

  test("create operation creates individual reference 1", async () => {
    // Mock the required parameter
    mockContext.getNodeParameter.mockImplementation((name: string) => {
      if (name === "individualReferenceData") {
        return JSON.stringify({ name: "Test Reference" });
      }
      return undefined;
    });

    const returnData: any[] = [];
    await individualReference1ResourceHandler.execute("create", mockAuthContext, returnData);

    expect(returnData).toHaveLength(1);
    expect(returnData[0].json).toEqual({
      success: true,
      id: 3,
      name: "Test Reference",
      correspondence_partner_guid: "guid-456"
    });
    expect(DocumentManagementClient.createIndividualReference1).toHaveBeenCalledWith({
      host: "localhost",
      token: "test-token",
      clientInstanceId: "test-client-id",
      individualReference: { name: "Test Reference" },
    });
  });

  test("handles API errors gracefully when continueOnFail is true", async () => {
    mockContext.continueOnFail.mockReturnValue(true);
    spyOn(DocumentManagementClient, "fetchIndividualReferences1").mockRejectedValue(new Error("API Error"));

    const returnData: any[] = [];
    await individualReference1ResourceHandler.execute("getAll", mockAuthContext, returnData);

    expect(returnData).toHaveLength(1);
    expect(returnData[0].json).toEqual({
      error: "API Error",
    });
  });
});