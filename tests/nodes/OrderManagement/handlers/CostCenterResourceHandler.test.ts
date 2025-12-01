/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { CostCenterResourceHandler } from "../../../../nodes/OrderManagement/handlers/CostCenterResourceHandler";
import * as client from "../../../../src/services/orderManagementClient";
import type { AuthContext } from "../../../../nodes/OrderManagement/types";

const authContext: AuthContext = {
  host: "https://localhost:58454",
  token: "token",
  clientInstanceId: "inst",
};

describe("CostCenterResourceHandler", () => {
  let handler: CostCenterResourceHandler;
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
    handler = new CostCenterResourceHandler(mockContext, 0);
    spyOn(client, "fetchOrderManagementCostCenters").mockResolvedValue([{ costcenter_id: "c1" }]);
  });

  test("getAll forwards params", async () => {
    mockContext.getNodeParameter.mockImplementation((name: string, _idx: number, defaultValue?: unknown) => {
      if (name === "select") return "costcenter_id";
      return defaultValue;
    });

    const returnData: any[] = [];
    await handler.execute("getAll", authContext, returnData);

    expect(client.fetchOrderManagementCostCenters).toHaveBeenCalledWith({
      ...authContext,
      select: "costcenter_id",
      filter: undefined,
      top: 100,
      skip: undefined,
    });
    expect(returnData[0].json.costcenter_id).toBe("c1");
  });
});
