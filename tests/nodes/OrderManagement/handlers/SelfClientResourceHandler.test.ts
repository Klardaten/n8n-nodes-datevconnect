/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { SelfClientResourceHandler } from "../../../../nodes/OrderManagement/handlers/SelfClientResourceHandler";
import * as client from "../../../../src/services/orderManagementClient";
import type { AuthContext } from "../../../../nodes/OrderManagement/types";

const authContext: AuthContext = {
  host: "https://localhost:58454",
  token: "token",
  clientInstanceId: "inst",
};

describe("SelfClientResourceHandler", () => {
  let handler: SelfClientResourceHandler;
  let mockContext: any;

  beforeEach(() => {
    mockContext = {
      getNodeParameter: mock(
        (_name: string, _idx: number, defaultValue?: unknown) => defaultValue,
      ),
      continueOnFail: mock(() => false),
      getNode: mock(() => ({ type: "test-node" })),
      helpers: {
        returnJsonArray: (data: Array<Record<string, unknown>>) =>
          data.map((json) => ({ json })),
        constructExecutionMetaData: (
          data: Array<{ json: Record<string, unknown> }>,
          { itemData }: { itemData: { item: number } },
        ) => data.map((entry) => ({ ...entry, pairedItem: itemData })),
      },
    };
    handler = new SelfClientResourceHandler(mockContext, 0);
    spyOn(client, "fetchSelfClients").mockResolvedValue([
      { client_id: "self" },
    ]);
  });

  test("getAll forwards params", async () => {
    mockContext.getNodeParameter.mockImplementation(
      (name: string, _idx: number, defaultValue?: unknown) => {
        if (name === "top") return 1;
        return defaultValue;
      },
    );

    const returnData: any[] = [];
    await handler.execute("getAll", authContext, returnData);

    expect(client.fetchSelfClients).toHaveBeenCalledWith({
      ...authContext,
      select: undefined,
      top: 1,
      skip: undefined,
    });
    expect(returnData[0].json.client_id).toBe("self");
  });
});
