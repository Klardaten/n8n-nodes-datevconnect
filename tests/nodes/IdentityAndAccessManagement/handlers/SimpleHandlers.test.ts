/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, mock, spyOn, test } from "bun:test";
import { NodeOperationError } from "n8n-workflow";
import { ServiceProviderConfigResourceHandler } from "../../../../nodes/IdentityAndAccessManagement/handlers/ServiceProviderConfigResourceHandler";
import { ResourceTypeResourceHandler } from "../../../../nodes/IdentityAndAccessManagement/handlers/ResourceTypeResourceHandler";
import { CurrentUserResourceHandler } from "../../../../nodes/IdentityAndAccessManagement/handlers/CurrentUserResourceHandler";
import { IdentityAndAccessManagementClient } from "../../../../src/services/identityAndAccessManagementClient";
import type { AuthContext } from "../../../../nodes/IdentityAndAccessManagement/types";

const authContext: AuthContext = {
  host: "https://localhost:58452",
  token: "token-123",
  clientInstanceId: "instance-abc",
};

function createContext() {
  return {
    getNodeParameter: mock(() => undefined),
    continueOnFail: mock(() => false),
    getNode: mock(() => ({ name: "IAM" })),
  };
}

describe("IdentityAndAccessManagement - simple handlers", () => {
  test("ServiceProviderConfigResourceHandler only supports get", async () => {
    const context = createContext();
    const handler = new ServiceProviderConfigResourceHandler(context, 0);
    const fetchSpy = spyOn(
      IdentityAndAccessManagementClient,
      "fetchServiceProviderConfig",
    ).mockResolvedValue({
      documentationUri: "https://docs",
    });

    const returnData: any[] = [];
    await handler.execute("get", authContext, returnData);

    expect(fetchSpy).toHaveBeenCalledWith(authContext);
    expect(returnData[0].json.documentationUri).toBe("https://docs");

    await expect(
      handler.execute("getAll", authContext, []),
    ).rejects.toThrow(NodeOperationError);

    fetchSpy.mockRestore();
  });

  test("ResourceTypeResourceHandler returns SCIM resource types", async () => {
    const context = createContext();
    const handler = new ResourceTypeResourceHandler(context, 0);
    const fetchSpy = spyOn(
      IdentityAndAccessManagementClient,
      "fetchResourceTypes",
    ).mockResolvedValue({ Resources: [{ name: "User" }] });

    const returnData: any[] = [];
    await handler.execute("getAll", authContext, returnData);

    expect(fetchSpy).toHaveBeenCalledWith(authContext);
    expect(returnData[0].json.Resources?.[0].name).toBe("User");

    fetchSpy.mockRestore();
  });

  test("CurrentUserResourceHandler fetches /Users/me", async () => {
    const context = createContext();
    const handler = new CurrentUserResourceHandler(context, 0);
    const fetchSpy = spyOn(IdentityAndAccessManagementClient, "fetchCurrentUser").mockResolvedValue({
      id: "current-user",
    });

    const returnData: any[] = [];
    await handler.execute("get", authContext, returnData);

    expect(fetchSpy).toHaveBeenCalledWith(authContext);
    expect(returnData[0].json.id).toBe("current-user");

    await expect(
      handler.execute("getAll", authContext, []),
    ).rejects.toThrow(NodeOperationError);

    fetchSpy.mockRestore();
  });
});
