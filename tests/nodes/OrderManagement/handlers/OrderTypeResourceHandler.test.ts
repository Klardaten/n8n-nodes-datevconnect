/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { OrderTypeResourceHandler } from "../../../../nodes/OrderManagement/handlers/OrderTypeResourceHandler";
import * as client from "../../../../src/services/orderManagementClient";
import type { AuthContext } from "../../../../nodes/OrderManagement/types";

const authContext: AuthContext = {
  host: "https://localhost:58454",
  token: "token",
  clientInstanceId: "inst",
};

describe("OrderTypeResourceHandler", () => {
  let handler: OrderTypeResourceHandler;
  let mockContext: any;

  beforeEach(() => {
    mockContext = {
      getNodeParameter: mock((_name: string, _idx: number, defaultValue?: unknown) => defaultValue),
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
    handler = new OrderTypeResourceHandler(mockContext, 0);
    spyOn(client, "fetchOrderTypes").mockResolvedValue([{ id: 1 }]);
  });

  test("getAll forwards pagination params", async () => {
    mockContext.getNodeParameter.mockImplementation((name: string, _idx: number, defaultValue?: unknown) => {
      if (name === "top") return 5;
      if (name === "skip") return 2;
      return defaultValue;
    });

    const returnData: any[] = [];
    await handler.execute("getAll", authContext, returnData);

    expect(client.fetchOrderTypes).toHaveBeenCalledWith({
      ...authContext,
      top: 5,
      skip: 2,
    });
    expect(returnData[0].json).toEqual({ id: 1 });
  });
});
