/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { OrderResourceHandler } from "../../../../nodes/OrderManagement/handlers/OrderResourceHandler";
import * as orderManagementClient from "../../../../src/services/orderManagementClient";
import type { AuthContext } from "../../../../nodes/OrderManagement/types";

let handler: OrderResourceHandler;
let mockContext: any;

const authContext: AuthContext = {
  host: "https://localhost:58454",
  token: "token",
  clientInstanceId: "inst",
};

describe("OrderResourceHandler", () => {
  beforeEach(() => {
    mockContext = {
      getNodeParameter: mock(() => undefined),
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
    handler = new OrderResourceHandler(mockContext, 0);

    spyOn(orderManagementClient, "fetchOrders").mockResolvedValue([
      { orderid: 1 },
    ]);
    spyOn(orderManagementClient, "fetchOrder").mockResolvedValue({
      orderid: 2,
    });
    spyOn(orderManagementClient, "updateOrder").mockResolvedValue(undefined);
    spyOn(orderManagementClient, "fetchOrdersMonthlyValues").mockResolvedValue([
      { month: "2024-01" },
    ]);
    spyOn(orderManagementClient, "fetchOrderCostItems").mockResolvedValue([
      { costitem: 1 },
    ]);
    spyOn(orderManagementClient, "fetchOrdersStateWork").mockResolvedValue([
      { state: "done" },
    ]);
    spyOn(
      orderManagementClient,
      "fetchSubordersStateBillingAll",
    ).mockResolvedValue([{ billing: "ok" }]);
    spyOn(orderManagementClient, "fetchExpensePostings").mockResolvedValue([
      { expenseposting_id: "ep1" },
    ]);
    spyOn(orderManagementClient, "updateSuborder").mockResolvedValue(undefined);
    spyOn(orderManagementClient, "createExpensePosting").mockResolvedValue({
      id: "exp-1",
    });
  });

  test("getAll operation fetches orders with parameters", async () => {
    mockContext.getNodeParameter.mockImplementation((name: string) => {
      const map: Record<string, unknown> = {
        select: "orderid",
        filter: "client_id eq 1",
        costRate: 2,
        expand: "suborders",
        top: 5,
        skip: 1,
      };
      return map[name];
    });

    const returnData: any[] = [];
    await handler.execute("getAll", authContext, returnData);

    expect(orderManagementClient.fetchOrders).toHaveBeenCalledWith({
      ...authContext,
      select: "orderid",
      filter: "client_id eq 1",
      costRate: 2,
      expand: "suborders",
      top: 5,
      skip: 1,
    });
    expect(returnData[0].json).toEqual({ orderid: 1 });
  });

  test("getAll operation requires expand=suborders when costRate is set", async () => {
    mockContext.getNodeParameter.mockImplementation(
      (name: string, _itemIndex: number, defaultValue?: unknown) => {
        if (name === "costRate") return 2;
        return defaultValue;
      },
    );

    const returnData: any[] = [];
    await expect(
      handler.execute("getAll", authContext, returnData),
    ).rejects.toThrow(/suborders/);
    expect(returnData).toHaveLength(0);
  });

  test("getAll operation rejects costRate outside allowed range", async () => {
    mockContext.getNodeParameter.mockImplementation(
      (name: string, _itemIndex: number, defaultValue?: unknown) => {
        if (name === "costRate") return 10;
        return defaultValue;
      },
    );

    const returnData: any[] = [];
    await expect(
      handler.execute("getAll", authContext, returnData),
    ).rejects.toThrow(/between 1 and 9/);
    expect(returnData).toHaveLength(0);
  });

  test("get operation fetches a single order", async () => {
    mockContext.getNodeParameter.mockImplementation((name: string) => {
      if (name === "orderId") return 42;
      if (name === "select") return "orderid";
      if (name === "costRate") return 0;
      return undefined;
    });

    const returnData: any[] = [];
    await handler.execute("get", authContext, returnData);

    expect(orderManagementClient.fetchOrder).toHaveBeenCalledWith({
      ...authContext,
      orderId: 42,
      select: "orderid",
      costRate: undefined,
      expand: undefined,
    });
    expect(returnData[0].json).toEqual({ orderid: 2 });
  });

  test("get operation requires expand=suborders when costRate is set", async () => {
    mockContext.getNodeParameter.mockImplementation(
      (name: string, _itemIndex: number, defaultValue?: unknown) => {
        if (name === "orderId") return 42;
        if (name === "costRate") return 1;
        return defaultValue;
      },
    );

    const returnData: any[] = [];
    await expect(
      handler.execute("get", authContext, returnData),
    ).rejects.toThrow(/suborders/);
    expect(returnData).toHaveLength(0);
  });

  test("get operation rejects costRate outside allowed range", async () => {
    mockContext.getNodeParameter.mockImplementation(
      (name: string, _itemIndex: number, defaultValue?: unknown) => {
        if (name === "orderId") return 42;
        if (name === "costRate") return -1;
        return defaultValue;
      },
    );

    const returnData: any[] = [];
    await expect(
      handler.execute("get", authContext, returnData),
    ).rejects.toThrow(/between 1 and 9/);
    expect(returnData).toHaveLength(0);
  });

  test("update operation passes payload", async () => {
    mockContext.getNodeParameter.mockImplementation((name: string) => {
      if (name === "orderId") return 99;
      if (name === "orderData")
        return JSON.stringify({ planned_turnover: 1000 });
      return undefined;
    });

    const returnData: any[] = [];
    await handler.execute("update", authContext, returnData);

    expect(orderManagementClient.updateOrder).toHaveBeenCalledWith({
      ...authContext,
      orderId: 99,
      order: { planned_turnover: 1000 },
    });
    expect(returnData[0].json.success).toBe(true);
  });

  test("updateSuborder operation sends ids and payload", async () => {
    mockContext.getNodeParameter.mockImplementation((name: string) => {
      if (name === "orderId") return 10;
      if (name === "suborderId") return 5;
      if (name === "suborderData") return { planned_end: "2024-12-31" };
      return undefined;
    });

    const returnData: any[] = [];
    await handler.execute("updateSuborder", authContext, returnData);

    expect(orderManagementClient.updateSuborder).toHaveBeenCalledWith({
      ...authContext,
      orderId: 10,
      suborderId: 5,
      suborder: { planned_end: "2024-12-31" },
    });
    expect(returnData[0].json.success).toBe(true);
    expect(returnData[0].json.suborderId).toBe(5);
  });

  test("createExpensePosting passes integration flags and payload", async () => {
    mockContext.getNodeParameter.mockImplementation((name: string) => {
      const map: Record<string, unknown> = {
        orderId: 1,
        suborderId: 2,
        automaticIntegration: true,
        deleteMassdataOnFailure: false,
        expensePostingData: '{"cost_amount":50}',
      };
      return map[name];
    });

    const returnData: any[] = [];
    await handler.execute("createExpensePosting", authContext, returnData);

    expect(orderManagementClient.createExpensePosting).toHaveBeenCalledWith({
      ...authContext,
      orderId: 1,
      suborderId: 2,
      automaticIntegration: true,
      deleteMassdataOnFailure: false,
      expensePosting: { cost_amount: 50 },
    });
    expect(returnData[0].json).toEqual({ id: "exp-1" });
  });

  test("handles errors via continueOnFail", async () => {
    mockContext.continueOnFail.mockReturnValue(true);
    mockContext.getNodeParameter.mockImplementation(() => {
      throw new Error("boom");
    });

    const returnData: any[] = [];
    await handler.execute("getAll", authContext, returnData);

    expect(returnData[0].json.error).toBeDefined();
  });
});
