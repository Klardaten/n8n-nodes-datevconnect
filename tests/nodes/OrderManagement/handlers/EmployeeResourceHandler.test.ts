/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { EmployeeResourceHandler } from "../../../../nodes/OrderManagement/handlers/EmployeeResourceHandler";
import * as client from "../../../../src/services/orderManagementClient";
import type { AuthContext } from "../../../../nodes/OrderManagement/types";

const authContext: AuthContext = {
  host: "https://localhost:58454",
  token: "token",
  clientInstanceId: "inst",
};

describe("EmployeeResourceHandler", () => {
  let handler: EmployeeResourceHandler;
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
    handler = new EmployeeResourceHandler(mockContext, 0);
    spyOn(client, "fetchEmployeeCapacities").mockResolvedValue([
      { employee_id: "e1" },
    ]);
    spyOn(client, "fetchEmployeesWithGroup").mockResolvedValue([
      { employee_id: "e2" },
    ]);
    spyOn(client, "fetchEmployeeQualifications").mockResolvedValue([
      { qualification_id: 1 },
    ]);
    spyOn(client, "fetchEmployeeCostRates").mockResolvedValue([
      { cost_rate_number: 10 },
    ]);
    spyOn(client, "fetchChargeRates").mockResolvedValue([{ charge_rate: 120 }]);
  });

  test("getCapacities forwards params", async () => {
    mockContext.getNodeParameter.mockImplementation(
      (name: string, _idx: number, defaultValue?: unknown) => {
        if (name === "filter") return "employee_id eq 1";
        if (name === "top") return 5;
        if (name === "skip") return 0;
        return defaultValue;
      },
    );

    const returnData: any[] = [];
    await handler.execute("getCapacities", authContext, returnData);

    expect(client.fetchEmployeeCapacities).toHaveBeenCalledWith({
      ...authContext,
      select: undefined,
      filter: "employee_id eq 1",
      top: 5,
      skip: undefined,
    });
    expect(returnData[0].json.employee_id).toBe("e1");
  });

  test("getWithGroup forwards params", async () => {
    mockContext.getNodeParameter.mockImplementation(
      (name: string, _idx: number, defaultValue?: unknown) => {
        if (name === "filter") return "employee_number ge 1";
        return defaultValue;
      },
    );
    const returnData: any[] = [];
    await handler.execute("getWithGroup", authContext, returnData);

    expect(client.fetchEmployeesWithGroup).toHaveBeenCalled();
    expect(returnData[0].json.employee_id).toBe("e2");
  });

  test("getQualifications forwards params", async () => {
    const returnData: any[] = [];
    await handler.execute("getQualifications", authContext, returnData);

    expect(client.fetchEmployeeQualifications).toHaveBeenCalled();
    expect(returnData[0].json.qualification_id).toBe(1);
  });

  test("getCostRates forwards params", async () => {
    const returnData: any[] = [];
    await handler.execute("getCostRates", authContext, returnData);

    expect(client.fetchEmployeeCostRates).toHaveBeenCalled();
    expect(returnData[0].json.cost_rate_number).toBe(10);
  });

  test("getChargeRates forwards params", async () => {
    const returnData: any[] = [];
    await handler.execute("getChargeRates", authContext, returnData);

    expect(client.fetchChargeRates).toHaveBeenCalled();
    expect(returnData[0].json.charge_rate).toBe(120);
  });
});
