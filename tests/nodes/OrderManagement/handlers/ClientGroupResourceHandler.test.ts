/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { ClientGroupResourceHandler } from "../../../../nodes/OrderManagement/handlers/ClientGroupResourceHandler";
import * as client from "../../../../src/services/orderManagementClient";
import type { AuthContext } from "../../../../nodes/OrderManagement/types";

const authContext: AuthContext = {
  host: "https://localhost:58454",
  token: "token",
  clientInstanceId: "inst",
};

describe("ClientGroupResourceHandler", () => {
  let handler: ClientGroupResourceHandler;
  let mockContext: any;

  beforeEach(() => {
    mockContext = {
      getNodeParameter: mock(() => undefined),
      continueOnFail: mock(() => false),
      getNode: mock(() => ({ type: "test-node" })),
      helpers: {
        returnJsonArray: (data: Array<Record<string, unknown>>) => data.map((json) => ({ json })),
        constructExecutionMetaData: (
          data: Array<{ json: Record<string, unknown> }>,
          { itemData }: { itemData: { item: number } },
        ) => data.map((entry) => ({ ...entry, pairedItem: itemData })),
      },
    };
    handler = new ClientGroupResourceHandler(mockContext, 0);
    spyOn(client, "fetchClientGroup").mockResolvedValue({ client_group: "MH" });
  });

  test("get forwards clientId", async () => {
    mockContext.getNodeParameter.mockImplementation((name: string) => {
      if (name === "clientId") return "abc";
      return undefined;
    });

    const returnData: any[] = [];
    await handler.execute("get", authContext, returnData);

    expect(client.fetchClientGroup).toHaveBeenCalledWith({
      ...authContext,
      clientId: "abc",
    });
    expect(returnData[0].json.client_group).toBe("MH");
  });
});
