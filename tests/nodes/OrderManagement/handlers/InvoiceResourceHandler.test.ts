/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { InvoiceResourceHandler } from "../../../../nodes/OrderManagement/handlers/InvoiceResourceHandler";
import * as client from "../../../../src/services/orderManagementClient";
import type { AuthContext } from "../../../../nodes/OrderManagement/types";

const authContext: AuthContext = {
  host: "https://localhost:58454",
  token: "token",
  clientInstanceId: "inst",
};

describe("InvoiceResourceHandler", () => {
  let handler: InvoiceResourceHandler;
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
    handler = new InvoiceResourceHandler(mockContext, 0);
    spyOn(client, "fetchInvoices").mockResolvedValue([{ invoice_number: 10 }]);
    spyOn(client, "fetchInvoice").mockResolvedValue({ invoiceid: 1 });
  });

  test("getAll forwards list params", async () => {
    mockContext.getNodeParameter.mockImplementation((name: string, _idx: number, defaultValue?: unknown) => {
      if (name === "filter") return "client_id eq abc";
      if (name === "top") return 5;
      if (name === "skip") return 1;
      return defaultValue;
    });

    const returnData: any[] = [];
    await handler.execute("getAll", authContext, returnData);

    expect(client.fetchInvoices).toHaveBeenCalledWith({
      ...authContext,
      select: undefined,
      filter: "client_id eq abc",
      top: 5,
      skip: 1,
    });
    expect(returnData[0].json.invoice_number).toBe(10);
  });

  test("get forwards invoiceId", async () => {
    mockContext.getNodeParameter.mockImplementation((name: string) => {
      if (name === "invoiceId") return 9;
      return undefined;
    });

    const returnData: any[] = [];
    await handler.execute("get", authContext, returnData);

    expect(client.fetchInvoice).toHaveBeenCalledWith({
      ...authContext,
      invoiceId: 9,
    });
    expect(returnData[0].json.invoiceid).toBe(1);
  });
});
