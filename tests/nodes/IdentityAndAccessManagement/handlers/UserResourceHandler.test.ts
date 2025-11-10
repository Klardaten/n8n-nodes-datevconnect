/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { NodeOperationError } from "n8n-workflow";
import { UserResourceHandler } from "../../../../nodes/IdentityAndAccessManagement/handlers/UserResourceHandler";
import { IdentityAndAccessManagementClient } from "../../../../src/services/identityAndAccessManagementClient";
import type { AuthContext } from "../../../../nodes/IdentityAndAccessManagement/types";

const authContext: AuthContext = {
  host: "https://localhost:58452",
  token: "token-123",
  clientInstanceId: "instance-abc",
};

describe("IdentityAndAccessManagement - UserResourceHandler", () => {
  let handler: UserResourceHandler;
  let context: any;

  beforeEach(() => {
    context = {
      getNodeParameter: mock(() => undefined),
      continueOnFail: mock(() => false),
      getNode: mock(() => ({ name: "IAM" })),
    };
    handler = new UserResourceHandler(context, 0);
  });

  test("getAll forwards filtering/pagination parameters", async () => {
    const fetchUsersSpy = spyOn(IdentityAndAccessManagementClient, "fetchUsers").mockResolvedValue({
      Resources: [{ id: "user-1" }],
      totalResults: 1,
    });

    context.getNodeParameter.mockImplementation((parameter: string) => {
      switch (parameter) {
        case "filter":
          return 'userName eq "max.mustermann"';
        case "attributes":
          return "id,userName";
        case "startIndex":
          return 2;
        case "count":
          return 25;
        default:
          return undefined;
      }
    });

    const returnData: any[] = [];
    await handler.execute("getAll", authContext, returnData);

    expect(fetchUsersSpy).toHaveBeenCalledWith({
      ...authContext,
      filter: 'userName eq "max.mustermann"',
      attributes: "id,userName",
      startIndex: 2,
      count: 25,
    });
    expect(returnData[0].json).toMatchObject({
      success: true,
      Resources: [{ id: "user-1" }],
    });

    fetchUsersSpy.mockRestore();
  });

  test("create operation parses JSON payload", async () => {
    const createUserSpy = spyOn(IdentityAndAccessManagementClient, "createUser").mockResolvedValue({
      id: "user-99",
    });

    context.getNodeParameter.mockImplementation((parameter: string) => {
      if (parameter === "userData") {
        return JSON.stringify({
          schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
          userName: "max.mustermann",
        });
      }
      return undefined;
    });

    const returnData: any[] = [];
    await handler.execute("create", authContext, returnData);

    expect(createUserSpy).toHaveBeenCalledWith({
      ...authContext,
      user: {
        schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
        userName: "max.mustermann",
      },
    });
    expect(returnData[0].json.id).toBe("user-99");

    createUserSpy.mockRestore();
  });

  test("update operation requires userId", async () => {
    const updateUserSpy = spyOn(IdentityAndAccessManagementClient, "updateUser").mockResolvedValue({
      id: "user-1",
      success: true,
    });

    context.getNodeParameter.mockImplementation((parameter: string) => {
      switch (parameter) {
        case "userId":
          return "user-1";
        case "userData":
          return '{"displayName":"Max Mustermann"}';
        default:
          return undefined;
      }
    });

    const returnData: any[] = [];
    await handler.execute("update", authContext, returnData);

    expect(updateUserSpy).toHaveBeenCalledWith({
      ...authContext,
      userId: "user-1",
      user: { displayName: "Max Mustermann" },
    });
    expect(returnData[0].json.success).toBe(true);

    updateUserSpy.mockRestore();
  });

  test("delete operation reports location metadata", async () => {
    const deleteUserSpy = spyOn(IdentityAndAccessManagementClient, "deleteUser").mockResolvedValue({
      location: "/iam/v1/Users/user-1",
    });

    context.getNodeParameter.mockImplementation((parameter: string) => {
      if (parameter === "userId") return "user-1";
      return undefined;
    });

    const returnData: any[] = [];
    await handler.execute("delete", authContext, returnData);

    expect(deleteUserSpy).toHaveBeenCalledWith({
      ...authContext,
      userId: "user-1",
    });
    expect(returnData[0].json).toEqual({
      success: true,
      userId: "user-1",
      deleted: true,
      location: "/iam/v1/Users/user-1",
    });

    deleteUserSpy.mockRestore();
  });

  test("propagates errors via continueOnFail", async () => {
    const fetchUsersSpy = spyOn(IdentityAndAccessManagementClient, "fetchUsers").mockRejectedValue(
      new Error("IAM error"),
    );
    context.continueOnFail.mockReturnValue(true);
    context.getNodeParameter.mockImplementation((parameter: string) => {
      if (parameter === "startIndex") {
        return 1;
      }
      if (parameter === "count") {
        return 100;
      }
      return "";
    });

    const returnData: any[] = [];
    await handler.execute("getAll", authContext, returnData);

    expect(returnData[0].json.error).toBe("IAM error");

    fetchUsersSpy.mockRestore();
  });

  test("throws for unsupported operation", async () => {
    await expect(
      handler.execute("unsupported", authContext, []),
    ).rejects.toThrow(NodeOperationError);
  });
});
