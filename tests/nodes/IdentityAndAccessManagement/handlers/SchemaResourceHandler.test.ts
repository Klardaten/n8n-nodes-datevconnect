/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { NodeOperationError } from "n8n-workflow";
import { SchemaResourceHandler } from "../../../../nodes/IdentityAndAccessManagement/handlers/SchemaResourceHandler";
import { IdentityAndAccessManagementClient } from "../../../../src/services/identityAndAccessManagementClient";
import type { AuthContext } from "../../../../nodes/IdentityAndAccessManagement/types";

const authContext: AuthContext = {
  host: "https://localhost:58452",
  token: "token-123",
  clientInstanceId: "instance-abc",
};

describe("IdentityAndAccessManagement - SchemaResourceHandler", () => {
  let handler: SchemaResourceHandler;
  let context: any;

  beforeEach(() => {
    context = {
      getNodeParameter: mock(() => undefined),
      continueOnFail: mock(() => false),
      getNode: mock(() => ({ name: "IAM" })),
    };
    handler = new SchemaResourceHandler(context, 0);
  });

  test("getAll operation fetches schemas", async () => {
    const fetchSchemasSpy = spyOn(IdentityAndAccessManagementClient, "fetchSchemas").mockResolvedValue({
      Resources: [{ id: "urn:ietf:params:scim:schemas:core:2.0:User" }],
    });

    const returnData: any[] = [];
    await handler.execute("getAll", authContext, returnData);

    expect(fetchSchemasSpy).toHaveBeenCalledWith(authContext);
    expect(returnData[0].json.Resources).toHaveLength(1);

    fetchSchemasSpy.mockRestore();
  });

  test("get operation requires schemaId parameter", async () => {
    const fetchSchemaSpy = spyOn(IdentityAndAccessManagementClient, "fetchSchema").mockResolvedValue({
      id: "urn:ietf:params:scim:schemas:core:2.0:User",
    });

    context.getNodeParameter.mockImplementation((parameter: string) => {
      if (parameter === "schemaId") {
        return "urn:ietf:params:scim:schemas:core:2.0:User";
      }
      return undefined;
    });

    const returnData: any[] = [];
    await handler.execute("get", authContext, returnData);

    expect(fetchSchemaSpy).toHaveBeenCalledWith({
      ...authContext,
      schemaId: "urn:ietf:params:scim:schemas:core:2.0:User",
    });
    expect(returnData[0].json.id).toContain("core:2.0:User");

    fetchSchemaSpy.mockRestore();
  });

  test("throws NodeOperationError for unsupported operations", async () => {
    await expect(
      handler.execute("create", authContext, []),
    ).rejects.toThrow(NodeOperationError);
  });
});
