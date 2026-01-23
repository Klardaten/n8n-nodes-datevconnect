import { describe, expect, spyOn, test, beforeEach, afterEach } from "bun:test";
import type { IExecuteFunctions } from "n8n-workflow";
import { NodeOperationError, NodeApiError } from "n8n-workflow";
import * as datevConnectClientModule from "../../src/services/datevConnectClient";
import { OrderResourceHandler } from "../../nodes/OrderManagement/handlers/OrderResourceHandler";
import { OrderTypeResourceHandler } from "../../nodes/OrderManagement/handlers/OrderTypeResourceHandler";
import { ClientGroupResourceHandler } from "../../nodes/OrderManagement/handlers/ClientGroupResourceHandler";
import { InvoiceResourceHandler } from "../../nodes/OrderManagement/handlers/InvoiceResourceHandler";
import { EmployeeResourceHandler } from "../../nodes/OrderManagement/handlers/EmployeeResourceHandler";
import { FeeResourceHandler } from "../../nodes/OrderManagement/handlers/FeeResourceHandler";
import { CostCenterResourceHandler } from "../../nodes/OrderManagement/handlers/CostCenterResourceHandler";
import { SelfClientResourceHandler } from "../../nodes/OrderManagement/handlers/SelfClientResourceHandler";

const { OrderManagement } =
  await import("../../nodes/OrderManagement/OrderManagement.node");

type InputItem = { json: Record<string, unknown> };

type ExecuteContextOptions = {
  items?: InputItem[];
  credentials?: Record<string, string> | null;
  parameters?: Record<string, Array<unknown> | unknown>;
  continueOnFail?: boolean;
};

function createExecuteContext(options: ExecuteContextOptions = {}) {
  const {
    items = [{ json: {} }],
    credentials = {
      host: "https://api.example.com",
      email: "user@example.com",
      password: "secret",
      clientInstanceId: "instance-1",
    },
    parameters = {},
    continueOnFail = false,
  } = options;

  const parameterValues = new Map<string, Array<unknown>>();

  for (const [name, value] of Object.entries(parameters)) {
    parameterValues.set(name, Array.isArray(value) ? value : [value]);
  }

  return {
    getInputData() {
      return items;
    },
    async getCredentials() {
      return credentials;
    },
    getNodeParameter(name: string, itemIndex: number, defaultValue?: unknown) {
      const values = parameterValues.get(name);
      if (!values || values[itemIndex] === undefined) {
        return defaultValue;
      }
      return values[itemIndex];
    },
    getNode() {
      return { name: "OrderManagement" };
    },
    helpers: {
      returnJsonArray(data: Array<Record<string, unknown>>) {
        return data.map((entry) => ({ json: entry }));
      },
      constructExecutionMetaData<T>(
        data: Array<{ json: Record<string, unknown> }> & T[],
        { itemData }: { itemData: { item: number } },
      ) {
        return data.map((entry) => ({
          ...entry,
          pairedItem: itemData,
        }));
      },
    },
    continueOnFail() {
      return continueOnFail;
    },
  };
}

let authenticateSpy: ReturnType<typeof spyOn>;

describe("OrderManagement node integration", () => {
  beforeEach(() => {
    authenticateSpy = spyOn(
      datevConnectClientModule,
      "authenticate",
    ).mockResolvedValue({
      access_token: "test-token-123",
    });
  });

  afterEach(() => {
    authenticateSpy?.mockRestore();
  });

  describe("credential validation", () => {
    test("requires all credential fields", async () => {
      const node = new OrderManagement();
      const context = createExecuteContext({
        credentials: {
          host: "",
          email: "user@example.com",
          password: "secret",
          clientInstanceId: "instance-1",
        },
      });

      await expect(
        node.execute.call(context as unknown as IExecuteFunctions),
      ).rejects.toThrow(NodeOperationError);
    });

    test("handles missing credentials", async () => {
      const node = new OrderManagement();
      const context = createExecuteContext({
        credentials: null,
      });

      await expect(
        node.execute.call(context as unknown as IExecuteFunctions),
      ).rejects.toThrow("DATEVconnect credentials are missing");
    });
  });

  describe("authentication", () => {
    test("authenticates once for multiple items", async () => {
      const node = new OrderManagement();
      const context = createExecuteContext({
        items: [{ json: {} }, { json: {} }],
        parameters: {
          resource: ["order", "orderType"],
          operation: ["getAll", "getAll"],
        },
      });

      const orderHandlerSpy = spyOn(
        OrderResourceHandler.prototype,
        "execute",
      ).mockResolvedValue();
      const orderTypeHandlerSpy = spyOn(
        OrderTypeResourceHandler.prototype,
        "execute",
      ).mockResolvedValue();

      await node.execute.call(context as unknown as IExecuteFunctions);

      expect(authenticateSpy).toHaveBeenCalledTimes(1);
      expect(orderHandlerSpy).toHaveBeenCalledWith(
        "getAll",
        {
          host: "https://api.example.com",
          token: "test-token-123",
          clientInstanceId: "instance-1",
        },
        expect.any(Array),
      );
      expect(orderTypeHandlerSpy).toHaveBeenCalled();

      orderHandlerSpy.mockRestore();
      orderTypeHandlerSpy.mockRestore();
    });

    test("handles authentication errors", async () => {
      authenticateSpy.mockRejectedValueOnce(new Error("Invalid credentials"));

      const node = new OrderManagement();
      const context = createExecuteContext();

      await expect(
        node.execute.call(context as unknown as IExecuteFunctions),
      ).rejects.toThrow(NodeApiError);
    });
  });

  describe("resource handler orchestration", () => {
    test("creates correct handler for order resource", async () => {
      const orderHandlerSpy = spyOn(
        OrderResourceHandler.prototype,
        "execute",
      ).mockResolvedValue();

      const node = new OrderManagement();
      const context = createExecuteContext({
        parameters: {
          resource: "order",
          operation: "getAll",
        },
      });

      await node.execute.call(context as unknown as IExecuteFunctions);

      expect(orderHandlerSpy).toHaveBeenCalledWith(
        "getAll",
        expect.objectContaining({
          host: "https://api.example.com",
          token: "test-token-123",
          clientInstanceId: "instance-1",
        }),
        expect.any(Array),
      );

      orderHandlerSpy.mockRestore();
    });

    test("creates correct handler for invoice resource", async () => {
      const invoiceHandlerSpy = spyOn(
        InvoiceResourceHandler.prototype,
        "execute",
      ).mockResolvedValue();

      const node = new OrderManagement();
      const context = createExecuteContext({
        parameters: {
          resource: "invoice",
          operation: "get",
        },
      });

      await node.execute.call(context as unknown as IExecuteFunctions);

      expect(invoiceHandlerSpy).toHaveBeenCalledWith(
        "get",
        expect.objectContaining({
          token: "test-token-123",
        }),
        expect.any(Array),
      );

      invoiceHandlerSpy.mockRestore();
    });

    test("throws error for unsupported resource", async () => {
      const node = new OrderManagement();
      const context = createExecuteContext({
        parameters: {
          resource: "unknown",
          operation: "getAll",
        },
      });

      await expect(
        node.execute.call(context as unknown as IExecuteFunctions),
      ).rejects.toThrow(NodeOperationError);
    });
  });
});
