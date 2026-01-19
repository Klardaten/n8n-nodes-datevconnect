/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test, beforeEach, spyOn, mock } from "bun:test";
import { IndividualReference2ResourceHandler } from "../../../../nodes/DocumentManagement/handlers/IndividualReference2ResourceHandler";
import { DocumentManagementClient } from "../../../../src/services/documentManagementClient";
import type { AuthContext } from "../../../../nodes/DocumentManagement/types";

let individualReference2ResourceHandler: IndividualReference2ResourceHandler;
let mockContext: any;

const mockAuthContext: AuthContext = {
  host: "localhost",
  token: "test-token",
  clientInstanceId: "test-client-id",
};

describe("IndividualReference2ResourceHandler", () => {
  beforeEach(() => {
    mockContext = {
      getNodeParameter: mock(() => undefined),
      continueOnFail: mock(() => false),
      getNode: mock(() => ({ type: "test-node" })),
      getCredentials: mock(() => null),
    };
    individualReference2ResourceHandler =
      new IndividualReference2ResourceHandler(mockContext, 0);

    // Mock the DocumentManagementClient methods
    spyOn(
      DocumentManagementClient,
      "fetchIndividualReferences2",
    ).mockResolvedValue([
      {
        id: 1,
        name: "Reference 2-1",
        correspondence_partner_domain: "clients",
      },
      {
        id: 2,
        name: "Reference 2-2",
        correspondence_partner_domain: "employees",
      },
    ]);

    spyOn(
      DocumentManagementClient,
      "createIndividualReference2",
    ).mockResolvedValue([
      {
        id: 3,
        name: "Test Reference 2",
        correspondence_partner_domain: "legal",
      },
    ]);
  });

  test("getAll operation fetches individual references 2", async () => {
    const returnData: any[] = [];
    await individualReference2ResourceHandler.execute(
      "getAll",
      mockAuthContext,
      returnData,
    );

    expect(returnData).toHaveLength(2);
    expect(returnData[0].json).toEqual({
      success: true,
      id: 1,
      name: "Reference 2-1",
      correspondence_partner_domain: "clients",
    });
    expect(returnData[1].json).toEqual({
      success: true,
      id: 2,
      name: "Reference 2-2",
      correspondence_partner_domain: "employees",
    });
    expect(
      DocumentManagementClient.fetchIndividualReferences2,
    ).toHaveBeenCalledWith({
      host: "localhost",
      token: "test-token",
      clientInstanceId: "test-client-id",
      top: undefined,
      skip: undefined,
    });
  });

  test("create operation creates individual reference 2", async () => {
    // Mock the required parameter
    mockContext.getNodeParameter.mockImplementation((name: string) => {
      if (name === "individualReferenceData") {
        return JSON.stringify({
          name: "Test Reference 2",
          correspondence_partner_domain: "legal",
        });
      }
      return undefined;
    });

    const returnData: any[] = [];
    await individualReference2ResourceHandler.execute(
      "create",
      mockAuthContext,
      returnData,
    );

    expect(returnData).toHaveLength(1);
    expect(returnData[0].json).toEqual({
      success: true,
      id: 3,
      name: "Test Reference 2",
      correspondence_partner_domain: "legal",
    });
    expect(
      DocumentManagementClient.createIndividualReference2,
    ).toHaveBeenCalledWith({
      host: "localhost",
      token: "test-token",
      clientInstanceId: "test-client-id",
      individualReference: {
        name: "Test Reference 2",
        correspondence_partner_domain: "legal",
      },
    });
  });

  test("handles API errors gracefully when continueOnFail is true", async () => {
    mockContext.continueOnFail.mockReturnValue(true);
    spyOn(
      DocumentManagementClient,
      "fetchIndividualReferences2",
    ).mockRejectedValue(new Error("API Error"));

    const returnData: any[] = [];
    await individualReference2ResourceHandler.execute(
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
