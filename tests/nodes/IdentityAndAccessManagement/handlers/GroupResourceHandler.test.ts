/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { NodeOperationError } from "n8n-workflow";
import { GroupResourceHandler } from "../../../../nodes/IdentityAndAccessManagement/handlers/GroupResourceHandler";
import { IdentityAndAccessManagementClient } from "../../../../src/services/identityAndAccessManagementClient";
import type { AuthContext } from "../../../../nodes/IdentityAndAccessManagement/types";

const authContext: AuthContext = {
  host: "https://localhost:58452",
  token: "token-123",
  clientInstanceId: "instance-abc",
};

describe("IdentityAndAccessManagement - GroupResourceHandler", () => {
  let handler: GroupResourceHandler;
  let context: any;

  beforeEach(() => {
    context = {
      getNodeParameter: mock(() => undefined),
      continueOnFail: mock(() => false),
      getNode: mock(() => ({ name: "IAM" })),
    };
    handler = new GroupResourceHandler(context, 0);
  });

  test("getAll operation fetches groups", async () => {
    const fetchGroupsSpy = spyOn(IdentityAndAccessManagementClient, "fetchGroups").mockResolvedValue({
      Resources: [{ id: "group-1" }],
    });

    const returnData: any[] = [];
    await handler.execute("getAll", authContext, returnData);

    expect(fetchGroupsSpy).toHaveBeenCalledWith(authContext);
    expect(returnData[0].json).toMatchObject({
      success: true,
      Resources: [{ id: "group-1" }],
    });

    fetchGroupsSpy.mockRestore();
  });

  test("get operation requires groupId", async () => {
    const fetchGroupSpy = spyOn(IdentityAndAccessManagementClient, "fetchGroup").mockResolvedValue({
      id: "group-1",
      displayName: "Administrators",
    });

    context.getNodeParameter.mockImplementation((parameter: string) => {
      if (parameter === "groupId") return "group-1";
      return undefined;
    });

    const returnData: any[] = [];
    await handler.execute("get", authContext, returnData);

    expect(fetchGroupSpy).toHaveBeenCalledWith({
      ...authContext,
      groupId: "group-1",
    });
    expect(returnData[0].json.displayName).toBe("Administrators");

    fetchGroupSpy.mockRestore();
  });

  test("create operation parses JSON payload", async () => {
    const createGroupSpy = spyOn(IdentityAndAccessManagementClient, "createGroup").mockResolvedValue({
      id: "group-2",
      success: true,
    });

    context.getNodeParameter.mockImplementation((parameter: string) => {
      if (parameter === "groupData") {
        return '{"displayName":"Sachbearbeiter","schemas":["urn:ietf:params:scim:schemas:core:2.0:Group"]}';
      }
      return undefined;
    });

    const returnData: any[] = [];
    await handler.execute("create", authContext, returnData);

    expect(createGroupSpy).toHaveBeenCalledWith({
      ...authContext,
      group: {
        displayName: "Sachbearbeiter",
        schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
      },
    });
    expect(returnData[0].json.id).toBe("group-2");

    createGroupSpy.mockRestore();
  });

  test("update operation sends groupId and payload", async () => {
    const updateGroupSpy = spyOn(IdentityAndAccessManagementClient, "updateGroup").mockResolvedValue({
      id: "group-3",
      success: true,
    });

    context.getNodeParameter.mockImplementation((parameter: string) => {
      switch (parameter) {
        case "groupId":
          return "group-3";
        case "groupData":
          return '{"members":[]}';
        default:
          return undefined;
      }
    });

    const returnData: any[] = [];
    await handler.execute("update", authContext, returnData);

    expect(updateGroupSpy).toHaveBeenCalledWith({
      ...authContext,
      groupId: "group-3",
      group: { members: [] },
    });
    expect(returnData[0].json.id).toBe("group-3");

    updateGroupSpy.mockRestore();
  });

  test("delete operation reports deletion metadata", async () => {
    const deleteGroupSpy = spyOn(IdentityAndAccessManagementClient, "deleteGroup").mockResolvedValue({
      location: "/iam/v1/Groups/group-3",
    });

    context.getNodeParameter.mockImplementation((parameter: string) => {
      if (parameter === "groupId") return "group-3";
      return undefined;
    });

    const returnData: any[] = [];
    await handler.execute("delete", authContext, returnData);

    expect(returnData[0].json).toEqual({
      success: true,
      groupId: "group-3",
      deleted: true,
      location: "/iam/v1/Groups/group-3",
    });

    deleteGroupSpy.mockRestore();
  });

  test("continueOnFail captures client errors", async () => {
    const fetchGroupSpy = spyOn(IdentityAndAccessManagementClient, "fetchGroup").mockRejectedValue(
      new Error("boom"),
    );
    context.continueOnFail.mockReturnValue(true);
    context.getNodeParameter.mockImplementation((parameter: string) =>
      parameter === "groupId" ? "group-404" : undefined,
    );

    const returnData: any[] = [];
    await handler.execute("get", authContext, returnData);

    expect(returnData[0].json.error).toBe("boom");

    fetchGroupSpy.mockRestore();
  });

  test("throws for unsupported operation", async () => {
    await expect(
      handler.execute("unsupported", authContext, []),
    ).rejects.toThrow(NodeOperationError);
  });
});
