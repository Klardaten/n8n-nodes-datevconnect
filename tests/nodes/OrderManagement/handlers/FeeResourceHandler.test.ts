/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { FeeResourceHandler } from "../../../../nodes/OrderManagement/handlers/FeeResourceHandler";
import * as client from "../../../../src/services/orderManagementClient";
import type { AuthContext } from "../../../../nodes/OrderManagement/types";

const authContext: AuthContext = {
  host: "https://localhost:58454",
  token: "token",
  clientInstanceId: "inst",
};

describe("FeeResourceHandler", () => {
  let handler: FeeResourceHandler;
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
    handler = new FeeResourceHandler(mockContext, 0);
    spyOn(client, "fetchFees").mockResolvedValue([{ fee_plan_number: 30 }]);
    spyOn(client, "fetchFeePlans").mockResolvedValue([{ fee_plan_name: "Plan" }]);
  });

  test("getFees forwards params", async () => {
    mockContext.getNodeParameter.mockImplementation((name: string, _idx: number, defaultValue?: unknown) => {
      if (name === "filter") return "fee_plan_number eq 30";
      if (name === "top") return 2;
      return defaultValue;
    });
    const returnData: any[] = [];
    await handler.execute("getFees", authContext, returnData);

    expect(client.fetchFees).toHaveBeenCalledWith({
      ...authContext,
      select: undefined,
      filter: "fee_plan_number eq 30",
      top: 2,
      skip: undefined,
    });
    expect(returnData[0].json.fee_plan_number).toBe(30);
  });

  test("getFeePlans forwards params", async () => {
    const returnData: any[] = [];
    await handler.execute("getFeePlans", authContext, returnData);

    expect(client.fetchFeePlans).toHaveBeenCalled();
    expect(returnData[0].json.fee_plan_name).toBe("Plan");
  });
});
