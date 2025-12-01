/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, spyOn, test } from "bun:test";
import {
  createExpensePosting,
  fetchChargeRates,
  fetchClientGroup,
  fetchEmployeeCapacities,
  fetchExpensePostings,
  fetchFeePlans,
  fetchFees,
  fetchInvoice,
  fetchInvoices,
  fetchOrder,
  fetchOrderManagementCostCenters,
  fetchOrderMonthlyValues,
  fetchOrderTypes,
  fetchOrders,
  updateOrder,
  updateSuborder,
} from "../../src/services/orderManagementClient";

describe("OrderManagementClient - All Endpoints", () => {
  const mockFetch = spyOn(global, "fetch");

  beforeEach(() => {
    mockFetch.mockReset();
  });

  test("GET /ordertypes - fetchOrderTypes", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" } as any,
      json: async () => [{ id: 1, ordertype: "110" }],
    } as Response);

    const result = await fetchOrderTypes({
      host: "https://localhost:58454",
      token: "test-token",
      clientInstanceId: "test-client-id",
      top: 5,
      skip: 2,
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect((url as URL).toString()).toBe(
      "https://localhost:58454/datev/api/order-management/v1/ordertypes?top=5&skip=2",
    );
    expect(options).toEqual({
      method: "GET",
      headers: {
        Authorization: "Bearer test-token",
        "x-client-instance-id": "test-client-id",
        Accept: "application/json;charset=utf-8",
      },
    });

    expect(result).toEqual([{ id: 1, ordertype: "110" }]);
  });

  test("GET /clientgroup - fetchClientGroup", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" } as any,
      json: async () => ({ client_id: "abc", client_group: "MH" }),
    } as Response);

    const result = await fetchClientGroup({
      host: "https://localhost:58454",
      token: "token",
      clientInstanceId: "inst",
      clientId: "abc",
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect((url as URL).toString()).toBe(
      "https://localhost:58454/datev/api/order-management/v1/clientgroup?clientid=abc",
    );
    expect(options).toEqual({
      method: "GET",
      headers: {
        Authorization: "Bearer token",
        "x-client-instance-id": "inst",
        Accept: "application/json;charset=utf-8",
      },
    });

    expect(result).toEqual({ client_id: "abc", client_group: "MH" });
  });

  test("GET /orders - fetchOrders with filter and expand", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" } as any,
      json: async () => [{ orderid: 1, order_name: "Order A" }],
    } as Response);

    const result = await fetchOrders({
      host: "https://localhost:58454/",
      token: "token",
      clientInstanceId: "inst",
      select: "orderid,order_name",
      filter: "client_id eq 123",
      costRate: 3,
      expand: "suborders",
      top: 10,
      skip: 5,
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect((url as URL).toString()).toBe(
      "https://localhost:58454/datev/api/order-management/v1/orders?select=orderid%2Corder_name&filter=client_id+eq+123&costrate=3&top=10&skip=5&expand=suborders",
    );
    expect(options).toEqual({
      method: "GET",
      headers: {
        Authorization: "Bearer token",
        "x-client-instance-id": "inst",
        Accept: "application/json;charset=utf-8",
      },
    });

    expect(result).toEqual([{ orderid: 1, order_name: "Order A" }]);
  });

  test("GET /orders/{orderid} - fetchOrder with costRate and expand", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" } as any,
      json: async () => ({ orderid: 11, order_name: "Order B" }),
    } as Response);

    const result = await fetchOrder({
      host: "https://localhost:58454",
      token: "token",
      clientInstanceId: "inst",
      orderId: 11,
      select: "order_name",
      costRate: 2,
      expand: "suborders",
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect((url as URL).toString()).toBe(
      "https://localhost:58454/datev/api/order-management/v1/orders/11?select=order_name&costrate=2&expand=suborders",
    );
    expect(options).toEqual({
      method: "GET",
      headers: {
        Authorization: "Bearer token",
        "x-client-instance-id": "inst",
        Accept: "application/json;charset=utf-8",
      },
    });

    expect(result).toEqual({ orderid: 11, order_name: "Order B" });
  });

  test("PUT /orders/{orderid} - updateOrder", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: { get: () => null } as any,
    } as Response);

    const body = { planned_turnover: 1000 };
    const result = await updateOrder({
      host: "https://localhost:58454",
      token: "token",
      clientInstanceId: "inst",
      orderId: 22,
      order: body,
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect((url as URL).toString()).toBe(
      "https://localhost:58454/datev/api/order-management/v1/orders/22",
    );
    expect(options).toEqual({
      method: "PUT",
      headers: {
        Authorization: "Bearer token",
        "x-client-instance-id": "inst",
        Accept: "application/json;charset=utf-8",
        "content-type": "application/json;charset=utf-8",
      },
      body: JSON.stringify(body),
    });

    expect(result).toBeUndefined();
  });

  test("GET /orders/{orderid}/monthlyvalues - fetchOrderMonthlyValues", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" } as any,
      json: async () => [{ month: "2024-01", total_costs: 100 }],
    } as Response);

    const result = await fetchOrderMonthlyValues({
      host: "https://localhost:58454",
      token: "token",
      clientInstanceId: "inst",
      orderId: 33,
      costRate: 4,
      select: "total_costs",
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect((url as URL).toString()).toBe(
      "https://localhost:58454/datev/api/order-management/v1/orders/33/monthlyvalues?select=total_costs&costrate=4",
    );
    expect(options).toEqual({
      method: "GET",
      headers: {
        Authorization: "Bearer token",
        "x-client-instance-id": "inst",
        Accept: "application/json;charset=utf-8",
      },
    });

    expect(result).toEqual([{ month: "2024-01", total_costs: 100 }]);
  });

  test("POST /orders/{orderid}/suborders/{suborderid}/expensepostings - createExpensePosting", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" } as any,
      json: async () => ({ id: "exp-1", success: true }),
    } as Response);

    const payload = { cost_amount: 50 };
    const result = await createExpensePosting({
      host: "https://localhost:58454",
      token: "token",
      clientInstanceId: "inst",
      orderId: 44,
      suborderId: 2,
      automaticIntegration: true,
      deleteMassdataOnFailure: false,
      expensePosting: payload,
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect((url as URL).toString()).toBe(
      "https://localhost:58454/datev/api/order-management/v1/orders/44/suborders/2/expensepostings?automaticintegration=true&deletemassdataonfailure=false",
    );
    expect(options).toEqual({
      method: "POST",
      headers: {
        Authorization: "Bearer token",
        "x-client-instance-id": "inst",
        Accept: "application/json;charset=utf-8",
        "content-type": "application/json;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    expect(result).toEqual({ id: "exp-1", success: true });
  });

  test("PUT /orders/{orderid}/suborders/{suborderid} - updateSuborder", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: { get: () => null } as any,
    } as Response);

    const payload = { planned_end: "2024-12-31" };
    const result = await updateSuborder({
      host: "https://localhost:58454",
      token: "token",
      clientInstanceId: "inst",
      orderId: 55,
      suborderId: 9,
      suborder: payload,
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect((url as URL).toString()).toBe(
      "https://localhost:58454/datev/api/order-management/v1/orders/55/suborders/9",
    );
    expect(options).toEqual({
      method: "PUT",
      headers: {
        Authorization: "Bearer token",
        "x-client-instance-id": "inst",
        Accept: "application/json;charset=utf-8",
        "content-type": "application/json;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    expect(result).toBeUndefined();
  });

  test("GET /invoices and /invoices/{id}", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "application/json" } as any,
        json: async () => [{ invoice_number: 123 }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "application/json" } as any,
        json: async () => ({ invoiceid: 10, invoice_number: 123 }),
      } as Response);

    const list = await fetchInvoices({
      host: "https://localhost:58454",
      token: "token",
      clientInstanceId: "inst",
      filter: "client_id eq abc",
      top: 20,
      skip: 0,
    });

    const firstCall = mockFetch.mock.calls[0];
    expect((firstCall[0] as URL).toString()).toBe(
      "https://localhost:58454/datev/api/order-management/v1/invoices?filter=client_id+eq+abc&top=20&skip=0",
    );
    expect(firstCall[1]).toEqual({
      method: "GET",
      headers: {
        Authorization: "Bearer token",
        "x-client-instance-id": "inst",
        Accept: "application/json;charset=utf-8",
      },
    });

    const detail = await fetchInvoice({
      host: "https://localhost:58454",
      token: "token",
      clientInstanceId: "inst",
      invoiceId: 10,
    });

    const secondCall = mockFetch.mock.calls[1];
    expect((secondCall[0] as URL).toString()).toBe(
      "https://localhost:58454/datev/api/order-management/v1/invoices/10",
    );
    expect(secondCall[1]).toEqual({
      method: "GET",
      headers: {
        Authorization: "Bearer token",
        "x-client-instance-id": "inst",
        Accept: "application/json;charset=utf-8",
      },
    });

    expect(list).toEqual([{ invoice_number: 123 }]);
    expect(detail).toEqual({ invoiceid: 10, invoice_number: 123 });
  });

  test("GET employee, fee, cost center helper endpoints", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "application/json" } as any,
        json: async () => [{ employee_id: "e1" }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "application/json" } as any,
        json: async () => [{ fee_plan_number: 30 }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "application/json" } as any,
        json: async () => [{ costcenter_id: "c-1" }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "application/json" } as any,
        json: async () => [{ charge_rate: 120 }],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "application/json" } as any,
        json: async () => [{ expenseposting_id: "ep1" }],
      } as Response);

    const capacities = await fetchEmployeeCapacities({
      host: "https://localhost:58454",
      token: "token",
      clientInstanceId: "inst",
      top: 5,
    });

    const feePlans = await fetchFeePlans({
      host: "https://localhost:58454",
      token: "token",
      clientInstanceId: "inst",
      filter: "fee_plan_active eq true",
    });

    const costCenters = await fetchOrderManagementCostCenters({
      host: "https://localhost:58454",
      token: "token",
      clientInstanceId: "inst",
      select: "costcenter_id",
    });

    const chargeRates = await fetchChargeRates({
      host: "https://localhost:58454",
      token: "token",
      clientInstanceId: "inst",
      filter: "charge_rate_active eq true",
    });

    const expensePostings = await fetchExpensePostings({
      host: "https://localhost:58454",
      token: "token",
      clientInstanceId: "inst",
      skip: 1,
    });

    expect((mockFetch.mock.calls[0][0] as URL).toString()).toBe(
      "https://localhost:58454/datev/api/order-management/v1/employeecapacities?top=5",
    );
    expect(mockFetch.mock.calls[0][1]).toEqual({
      method: "GET",
      headers: {
        Authorization: "Bearer token",
        "x-client-instance-id": "inst",
        Accept: "application/json;charset=utf-8",
      },
    });
    expect((mockFetch.mock.calls[1][0] as URL).toString()).toBe(
      "https://localhost:58454/datev/api/order-management/v1/feeplans?filter=fee_plan_active+eq+true",
    );
    expect(mockFetch.mock.calls[1][1]).toEqual({
      method: "GET",
      headers: {
        Authorization: "Bearer token",
        "x-client-instance-id": "inst",
        Accept: "application/json;charset=utf-8",
      },
    });
    expect((mockFetch.mock.calls[2][0] as URL).toString()).toBe(
      "https://localhost:58454/datev/api/order-management/v1/costcenters?select=costcenter_id",
    );
    expect(mockFetch.mock.calls[2][1]).toEqual({
      method: "GET",
      headers: {
        Authorization: "Bearer token",
        "x-client-instance-id": "inst",
        Accept: "application/json;charset=utf-8",
      },
    });
    expect((mockFetch.mock.calls[3][0] as URL).toString()).toBe(
      "https://localhost:58454/datev/api/order-management/v1/chargerates?filter=charge_rate_active+eq+true",
    );
    expect(mockFetch.mock.calls[3][1]).toEqual({
      method: "GET",
      headers: {
        Authorization: "Bearer token",
        "x-client-instance-id": "inst",
        Accept: "application/json;charset=utf-8",
      },
    });
    expect((mockFetch.mock.calls[4][0] as URL).toString()).toBe(
      "https://localhost:58454/datev/api/order-management/v1/orders/expensepostings?skip=1",
    );
    expect(mockFetch.mock.calls[4][1]).toEqual({
      method: "GET",
      headers: {
        Authorization: "Bearer token",
        "x-client-instance-id": "inst",
        Accept: "application/json;charset=utf-8",
      },
    });

    expect(capacities).toEqual([{ employee_id: "e1" }]);
    expect(feePlans).toEqual([{ fee_plan_number: 30 }]);
    expect(costCenters).toEqual([{ costcenter_id: "c-1" }]);
    expect(chargeRates).toEqual([{ charge_rate: 120 }]);
    expect(expensePostings).toEqual([{ expenseposting_id: "ep1" }]);
  });
});
