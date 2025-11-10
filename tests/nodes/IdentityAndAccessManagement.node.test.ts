import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import type { IExecuteFunctions } from "n8n-workflow";
import { NodeApiError, NodeOperationError } from "n8n-workflow";
import * as datevConnectClientModule from "../../src/services/datevConnectClient";
import { IdentityAndAccessManagement } from "../../nodes/IdentityAndAccessManagement/IdentityAndAccessManagement.node";
import { ServiceProviderConfigResourceHandler } from "../../nodes/IdentityAndAccessManagement/handlers/ServiceProviderConfigResourceHandler";
import { ResourceTypeResourceHandler } from "../../nodes/IdentityAndAccessManagement/handlers/ResourceTypeResourceHandler";
import { SchemaResourceHandler } from "../../nodes/IdentityAndAccessManagement/handlers/SchemaResourceHandler";
import { UserResourceHandler } from "../../nodes/IdentityAndAccessManagement/handlers/UserResourceHandler";
import { CurrentUserResourceHandler } from "../../nodes/IdentityAndAccessManagement/handlers/CurrentUserResourceHandler";
import { GroupResourceHandler } from "../../nodes/IdentityAndAccessManagement/handlers/GroupResourceHandler";

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
      host: "https://localhost:58452",
      email: "user@example.com",
      password: "secret",
      clientInstanceId: "instance-123",
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
      return { name: "IdentityAndAccessManagement" };
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

describe("IdentityAndAccessManagement node", () => {
  let authenticateSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    authenticateSpy = spyOn(datevConnectClientModule, "authenticate").mockResolvedValue({
      access_token: "token-123",
    });
  });

  afterEach(() => {
    authenticateSpy?.mockRestore();
  });

  test("validates credential fields", async () => {
    const node = new IdentityAndAccessManagement();
    const context = createExecuteContext({
      credentials: {
        host: "https://localhost:58452",
        email: "",
        password: "secret",
        clientInstanceId: "instance-123",
      },
    });

    await expect(
      node.execute.call(context as unknown as IExecuteFunctions),
    ).rejects.toThrow(NodeOperationError);
  });

  test("throws when credentials are missing", async () => {
    const node = new IdentityAndAccessManagement();
    const context = createExecuteContext({ credentials: null });

    await expect(
      node.execute.call(context as unknown as IExecuteFunctions),
    ).rejects.toThrow("DATEVconnect credentials are missing");
  });

  test("bubbles authentication errors as NodeApiError", async () => {
    authenticateSpy.mockRejectedValueOnce(new Error("invalid credentials"));

    const node = new IdentityAndAccessManagement();
    const context = createExecuteContext();

    await expect(
      node.execute.call(context as unknown as IExecuteFunctions),
    ).rejects.toThrow(NodeApiError);
  });

  test("authenticates once and dispatches to resource handlers", async () => {
    const node = new IdentityAndAccessManagement();
    const context = createExecuteContext({
      items: Array.from({ length: 5 }, () => ({ json: {} })),
      parameters: {
        resource: [
          "serviceProviderConfig",
          "resourceType",
          "schema",
          "user",
          "group",
        ],
        operation: ["get", "getAll", "getAll", "getAll", "getAll"],
      },
    });

    const handlerSpies = [
      spyOn(ServiceProviderConfigResourceHandler.prototype, "execute").mockResolvedValue(),
      spyOn(ResourceTypeResourceHandler.prototype, "execute").mockResolvedValue(),
      spyOn(SchemaResourceHandler.prototype, "execute").mockResolvedValue(),
      spyOn(UserResourceHandler.prototype, "execute").mockResolvedValue(),
      spyOn(GroupResourceHandler.prototype, "execute").mockResolvedValue(),
    ];

    await node.execute.call(context as unknown as IExecuteFunctions);

    expect(authenticateSpy).toHaveBeenCalledTimes(1);
    handlerSpies.forEach((handlerSpy) => {
      expect(handlerSpy).toHaveBeenCalledWith(
        expect.any(String),
        {
          host: "https://localhost:58452",
          token: "token-123",
          clientInstanceId: "instance-123",
        },
        expect.any(Array),
      );
    });

    handlerSpies.forEach((handlerSpy) => handlerSpy.mockRestore());
  });

  test("supports currentUser handler dispatch", async () => {
    const node = new IdentityAndAccessManagement();
    const context = createExecuteContext({
      parameters: {
        resource: ["currentUser"],
        operation: ["get"],
      },
    });

    const handlerSpy = spyOn(CurrentUserResourceHandler.prototype, "execute").mockResolvedValue();

    await node.execute.call(context as unknown as IExecuteFunctions);

    expect(handlerSpy).toHaveBeenCalledWith(
      "get",
      expect.objectContaining({
        token: "token-123",
      }),
      expect.any(Array),
    );

    handlerSpy.mockRestore();
  });
});
