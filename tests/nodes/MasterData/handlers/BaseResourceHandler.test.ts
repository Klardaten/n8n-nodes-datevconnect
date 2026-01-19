/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, expect, test, mock } from "bun:test";
import {
  NodeOperationError,
  type IExecuteFunctions,
  type INodeExecutionData,
} from "n8n-workflow";
import { BaseResourceHandler } from "../../../../nodes/MasterData/handlers/BaseResourceHandler";
import type {
  AuthContext,
  MasterDataCredentials,
} from "../../../../nodes/MasterData/types";

// Create a concrete implementation for testing the abstract class
class TestResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    // Test implementation
    const sendSuccess = this.createSendSuccess(returnData);
    sendSuccess({ operation, host: authContext.host });
  }
}

// Mock IExecuteFunctions
const createMockContext = (
  overrides: {
    credentials?: Partial<MasterDataCredentials>;
    parameters?: Record<string, unknown>;
    context?: Partial<IExecuteFunctions>;
  } = {},
) =>
  ({
    getCredentials: mock(async () => ({
      host: "https://api.example.com",
      email: "user@example.com",
      password: "secret",
      clientInstanceId: "instance-1",
      ...overrides.credentials,
    })),
    getNodeParameter: mock(
      (name: string, itemIndex: number, defaultValue?: unknown) => {
        const mockParams: Record<string, unknown> = {
          testParam: "testValue",
          emptyParam: "",
          numberParam: 42,
          ...overrides.parameters,
        };
        return mockParams[name] !== undefined ? mockParams[name] : defaultValue;
      },
    ),
    getNode: mock(() => ({ name: "TestNode" })),
    helpers: {
      returnJsonArray: mock((data: INodeExecutionData[]) =>
        data.map((entry) => ({ json: entry })),
      ),
      constructExecutionMetaData: mock(
        (data: INodeExecutionData[], meta: { itemData: { item: number } }) =>
          data.map((entry) => ({ ...entry, pairedItem: meta.itemData })),
      ),
    },
    continueOnFail: mock(() => false),
    ...overrides.context,
  }) as unknown as IExecuteFunctions;

describe("BaseResourceHandler", () => {
  describe("constructor", () => {
    test("initializes with context and itemIndex", () => {
      const context = createMockContext();
      const handler = new TestResourceHandler(context as any, 5);

      expect(handler["context"]).toBe(context);
      expect(handler["itemIndex"]).toBe(5);
    });
  });

  describe("getCredentials", () => {
    test("returns valid credentials", async () => {
      const context = createMockContext();
      const handler = new TestResourceHandler(context as any, 0);

      const credentials = await handler["getCredentials"]();

      expect(credentials).toEqual({
        host: "https://api.example.com",
        email: "user@example.com",
        password: "secret",
        clientInstanceId: "instance-1",
      });
    });

    test("throws NodeOperationError when credentials are missing", async () => {
      const context = createMockContext();
      // Override the mock to return null
      context.getCredentials = mock().mockResolvedValue(null);
      const handler = new TestResourceHandler(context as any, 0);

      await expect(handler["getCredentials"]()).rejects.toThrow(
        NodeOperationError,
      );
      await expect(handler["getCredentials"]()).rejects.toThrow(
        "DATEVconnect credentials are missing",
      );
    });

    test("throws NodeOperationError when credential fields are missing", async () => {
      const context = createMockContext({
        credentials: {
          host: "",
          email: "user@example.com",
          password: "secret",
          clientInstanceId: "instance-1",
        },
      });
      const handler = new TestResourceHandler(context as any, 0);

      await expect(handler["getCredentials"]()).rejects.toThrow(
        NodeOperationError,
      );
      await expect(handler["getCredentials"]()).rejects.toThrow(
        "All DATEVconnect credential fields must be provided",
      );
    });
  });

  describe("createAuthContext", () => {
    test("creates auth context from credentials and token", () => {
      const context = createMockContext();
      const handler = new TestResourceHandler(context as any, 0);

      const credentials: MasterDataCredentials = {
        host: "https://api.example.com",
        email: "user@example.com",
        password: "secret",
        clientInstanceId: "instance-1",
      };

      const authContext = handler["createAuthContext"](
        credentials,
        "test-token",
      );

      expect(authContext).toEqual({
        host: "https://api.example.com",
        token: "test-token",
        clientInstanceId: "instance-1",
      });
    });
  });

  describe("parameter helpers", () => {
    test("getOptionalString returns value or undefined", () => {
      const context = createMockContext({
        parameters: { testParam: "value", emptyParam: "" },
      });
      const handler = new TestResourceHandler(context as any, 0);

      expect(handler["getOptionalString"]("testParam")).toBe("value");
      expect(handler["getOptionalString"]("emptyParam")).toBeUndefined();
      expect(handler["getOptionalString"]("nonexistent")).toBeUndefined();
    });

    test("getRequiredString returns value or throws", () => {
      const context = createMockContext({
        parameters: { testParam: "value", emptyParam: "" },
      });
      const handler = new TestResourceHandler(context as any, 0);

      expect(handler["getRequiredString"]("testParam")).toBe("value");
      expect(() => handler["getRequiredString"]("emptyParam")).toThrow(
        NodeOperationError,
      );
      expect(() => handler["getRequiredString"]("nonexistent")).toThrow(
        NodeOperationError,
      );
    });

    test("getNumberParameter returns number or default", () => {
      const context = createMockContext({
        parameters: { numberParam: 42 },
      });
      const handler = new TestResourceHandler(context as any, 0);

      expect(handler["getNumberParameter"]("numberParam", 10)).toBe(42);
      expect(handler["getNumberParameter"]("nonexistent", 10)).toBe(10);
    });

    test("parseJsonParameter parses JSON or returns value", () => {
      const context = createMockContext();
      const handler = new TestResourceHandler(context as any, 0);

      expect(handler["parseJsonParameter"]('{"key":"value"}', "Test")).toEqual({
        key: "value",
      });
      expect(handler["parseJsonParameter"]({ key: "value" }, "Test")).toEqual({
        key: "value",
      });
      expect(() =>
        handler["parseJsonParameter"]("invalid json", "Test"),
      ).toThrow(NodeOperationError);
      expect(() => handler["parseJsonParameter"](null, "Test")).toThrow(
        NodeOperationError,
      );
    });
  });

  describe("createSendSuccess", () => {
    test("creates function that formats and adds data to returnData", () => {
      const context = createMockContext();
      const handler = new TestResourceHandler(context as any, 0);
      const returnData: any[] = [];

      const sendSuccess = handler["createSendSuccess"](returnData);
      sendSuccess({ test: "data" });

      expect(returnData).toHaveLength(1);
      expect(returnData[0]).toEqual({
        json: { test: "data" },
        pairedItem: { item: 0 },
      });
    });

    test("handles undefined payload with default success", () => {
      const context = createMockContext();
      const handler = new TestResourceHandler(context as any, 0);
      const returnData: any[] = [];

      const sendSuccess = handler["createSendSuccess"](returnData);
      sendSuccess();

      expect(returnData[0].json).toEqual({ success: true });
    });
  });

  describe("handleError", () => {
    test("adds error to returnData when continueOnFail is true", () => {
      const context = createMockContext({
        context: { continueOnFail: mock(() => true) },
      });
      const handler = new TestResourceHandler(context as any, 0);
      const returnData: any[] = [];

      handler["handleError"](new Error("Test error"), returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0]).toEqual({
        json: { error: "Test error" },
        pairedItem: { item: 0 },
      });
    });

    test("throws NodeApiError when continueOnFail is false", () => {
      const context = createMockContext();
      const handler = new TestResourceHandler(context as any, 0);
      const returnData: any[] = [];

      expect(() => {
        handler["handleError"](new Error("Test error"), returnData);
      }).toThrow();
    });
  });

  describe("execute method integration", () => {
    test("execute method can be called and uses helper methods", async () => {
      const context = createMockContext();
      const handler = new TestResourceHandler(context as any, 0);
      const returnData: any[] = [];
      const authContext: AuthContext = {
        host: "https://api.example.com",
        token: "test-token",
        clientInstanceId: "instance-1",
      };

      await handler.execute("testOp", authContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        operation: "testOp",
        host: "https://api.example.com",
      });
    });
  });
});
