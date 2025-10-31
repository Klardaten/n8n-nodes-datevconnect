import { describe, expect, spyOn, test, beforeEach, afterEach } from "bun:test";
import type { IExecuteFunctions } from "n8n-workflow";
import { NodeOperationError, NodeApiError } from "n8n-workflow";
import * as datevConnectClientModule from "../../src/services/datevConnectClient";
import { ClientResourceHandler } from "../../nodes/MasterData/handlers/ClientResourceHandler";
import { TaxAuthorityResourceHandler } from "../../nodes/MasterData/handlers/TaxAuthorityResourceHandler";
import { RelationshipResourceHandler } from "../../nodes/MasterData/handlers/RelationshipResourceHandler";
import { EmployeeResourceHandler } from "../../nodes/MasterData/handlers/EmployeeResourceHandler";
import { CountryCodeResourceHandler } from "../../nodes/MasterData/handlers/CountryCodeResourceHandler";
import { ClientGroupTypeResourceHandler } from "../../nodes/MasterData/handlers/ClientGroupTypeResourceHandler";

const { MasterData } = await import("../../nodes/MasterData/MasterData.node");

// Test spies
let authenticateSpy: ReturnType<typeof spyOn>;

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
      return { name: "MasterData" };
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

describe("MasterData node integration", () => {
  beforeEach(() => {
    authenticateSpy = spyOn(datevConnectClientModule, "authenticate").mockResolvedValue({
      access_token: "test-token-123",
    });
  });

  afterEach(() => {
    authenticateSpy?.mockRestore();
  });

  describe("credential validation", () => {
    test("requires all credential fields", async () => {
      const node = new MasterData();
      const context = createExecuteContext({
        credentials: {
          host: "https://api.example.com",
          email: "", // Missing email
          password: "secret",
          clientInstanceId: "instance-1",
        },
      });

      await expect(
        node.execute.call(context as unknown as IExecuteFunctions)
      ).rejects.toThrow(NodeOperationError);
    });

    test("handles missing credentials", async () => {
      const node = new MasterData();
      const context = createExecuteContext({
        credentials: null,
      });

      await expect(
        node.execute.call(context as unknown as IExecuteFunctions)
      ).rejects.toThrow("DATEVconnect credentials are missing");
    });
  });

  describe("authentication", () => {
    test("authenticates once for multiple items", async () => {
      const node = new MasterData();
      const context = createExecuteContext({
        items: [{ json: {} }, { json: {} }, { json: {} }],
        parameters: {
          resource: ["client", "taxAuthority", "relationship"],
          operation: ["getAll", "getAll", "getAll"],
        },
      });

      // Mock all the handler operations
      const clientHandlerSpy = spyOn(ClientResourceHandler.prototype, "execute").mockResolvedValue();
      const taxAuthorityHandlerSpy = spyOn(TaxAuthorityResourceHandler.prototype, "execute").mockResolvedValue();
      const relationshipHandlerSpy = spyOn(RelationshipResourceHandler.prototype, "execute").mockResolvedValue();

      await node.execute.call(context as unknown as IExecuteFunctions);

      expect(authenticateSpy).toHaveBeenCalledTimes(1);
      expect(authenticateSpy).toHaveBeenCalledWith({
        host: "https://api.example.com",
        email: "user@example.com",
        password: "secret",
      });

      // Verify handlers were called with auth context
      expect(clientHandlerSpy).toHaveBeenCalledWith(
        "getAll",
        {
          host: "https://api.example.com",
          token: "test-token-123",
          clientInstanceId: "instance-1",
        },
        expect.any(Array)
      );

      clientHandlerSpy.mockRestore();
      taxAuthorityHandlerSpy.mockRestore();
      relationshipHandlerSpy.mockRestore();
    });

    test("handles authentication errors", async () => {
      authenticateSpy.mockRejectedValueOnce(new Error("Invalid credentials"));

      const node = new MasterData();
      const context = createExecuteContext();

      await expect(
        node.execute.call(context as unknown as IExecuteFunctions)
      ).rejects.toThrow(NodeApiError);
    });
  });

  describe("resource handler orchestration", () => {
    test("creates correct handler for client resource", async () => {
      const clientHandlerSpy = spyOn(ClientResourceHandler.prototype, "execute").mockResolvedValue();

      const node = new MasterData();
      const context = createExecuteContext({
        parameters: {
          resource: "client",
          operation: "getAll",
        },
      });

      await node.execute.call(context as unknown as IExecuteFunctions);

      expect(clientHandlerSpy).toHaveBeenCalledWith(
        "getAll",
        expect.objectContaining({
          host: "https://api.example.com",
          token: "test-token-123",
          clientInstanceId: "instance-1",
        }),
        expect.any(Array)
      );

      clientHandlerSpy.mockRestore();
    });

    test("creates correct handler for taxAuthority resource", async () => {
      const taxAuthorityHandlerSpy = spyOn(TaxAuthorityResourceHandler.prototype, "execute").mockResolvedValue();

      const node = new MasterData();
      const context = createExecuteContext({
        parameters: {
          resource: "taxAuthority",
          operation: "getAll",
        },
      });

      await node.execute.call(context as unknown as IExecuteFunctions);

      expect(taxAuthorityHandlerSpy).toHaveBeenCalledWith(
        "getAll",
        expect.objectContaining({
          host: "https://api.example.com",
          token: "test-token-123",
          clientInstanceId: "instance-1",
        }),
        expect.any(Array)
      );

      taxAuthorityHandlerSpy.mockRestore();
    });

    test("creates correct handler for relationship resource", async () => {
      const relationshipHandlerSpy = spyOn(RelationshipResourceHandler.prototype, "execute").mockResolvedValue();

      const node = new MasterData();
      const context = createExecuteContext({
        parameters: {
          resource: "relationship",
          operation: "getAll",
        },
      });

      await node.execute.call(context as unknown as IExecuteFunctions);

      expect(relationshipHandlerSpy).toHaveBeenCalledWith(
        "getAll",
        expect.objectContaining({
          host: "https://api.example.com",
          token: "test-token-123",
          clientInstanceId: "instance-1",
        }),
        expect.any(Array)
      );

      relationshipHandlerSpy.mockRestore();
    });

    test("creates correct handler for employee resource", async () => {
      const employeeHandlerSpy = spyOn(EmployeeResourceHandler.prototype, "execute").mockResolvedValue();

      const node = new MasterData();
      const context = createExecuteContext({
        parameters: {
          resource: "employee",
          operation: "getAll",
        },
      });

      await node.execute.call(context as unknown as IExecuteFunctions);

      expect(employeeHandlerSpy).toHaveBeenCalledWith(
        "getAll",
        expect.objectContaining({
          host: "https://api.example.com",
          token: "test-token-123",
          clientInstanceId: "instance-1",
        }),
        expect.any(Array)
      );

      employeeHandlerSpy.mockRestore();
    });

    test("creates correct handler for countryCode resource", async () => {
      const countryCodeHandlerSpy = spyOn(CountryCodeResourceHandler.prototype, "execute").mockResolvedValue();

      const node = new MasterData();
      const context = createExecuteContext({
        parameters: {
          resource: "countryCode",
          operation: "getAll",
        },
      });

      await node.execute.call(context as unknown as IExecuteFunctions);

      expect(countryCodeHandlerSpy).toHaveBeenCalledWith(
        "getAll",
        expect.objectContaining({
          host: "https://api.example.com",
          token: "test-token-123",
          clientInstanceId: "instance-1",
        }),
        expect.any(Array)
      );

      countryCodeHandlerSpy.mockRestore();
    });

    test("creates correct handler for clientGroupType resource", async () => {
      const clientGroupTypeHandlerSpy = spyOn(ClientGroupTypeResourceHandler.prototype, "execute").mockResolvedValue();

      const node = new MasterData();
      const context = createExecuteContext({
        parameters: {
          resource: "clientGroupType",
          operation: "getAll",
        },
      });

      await node.execute.call(context as unknown as IExecuteFunctions);

      expect(clientGroupTypeHandlerSpy).toHaveBeenCalledWith(
        "getAll",
        expect.objectContaining({
          host: "https://api.example.com",
          token: "test-token-123",
          clientInstanceId: "instance-1",
        }),
        expect.any(Array)
      );

      clientGroupTypeHandlerSpy.mockRestore();
    });

    test("throws error for unsupported resource", async () => {
      const node = new MasterData();
      const context = createExecuteContext({
        parameters: {
          resource: "invalidResource",
          operation: "getAll",
        },
      });

      await expect(
        node.execute.call(context as unknown as IExecuteFunctions)
      ).rejects.toThrow('The resource "invalidResource" is not supported.');
    });
  });

  describe("multi-item processing", () => {
    test("processes each input item with its own parameters", async () => {
      const clientHandlerSpy = spyOn(ClientResourceHandler.prototype, "execute").mockResolvedValue();
      const taxAuthorityHandlerSpy = spyOn(TaxAuthorityResourceHandler.prototype, "execute").mockResolvedValue();

      const node = new MasterData();
      const context = createExecuteContext({
        items: [{ json: { itemIndex: 0 } }, { json: { itemIndex: 1 } }],
        parameters: {
          resource: ["client", "taxAuthority"],
          operation: ["getAll", "getAll"],
        },
      });

      await node.execute.call(context as unknown as IExecuteFunctions);

      expect(clientHandlerSpy).toHaveBeenCalledTimes(1);
      expect(taxAuthorityHandlerSpy).toHaveBeenCalledTimes(1);

      clientHandlerSpy.mockRestore();
      taxAuthorityHandlerSpy.mockRestore();
    });

    test("returns combined results from all handlers", async () => {
      // Mock handlers to add data to returnData array
      const clientHandlerSpy = spyOn(ClientResourceHandler.prototype, "execute").mockImplementation(
        async function(operation, authContext, returnData) {
          returnData.push({ json: { resource: "client", operation } });
        }
      );
      const taxAuthorityHandlerSpy = spyOn(TaxAuthorityResourceHandler.prototype, "execute").mockImplementation(
        async function(operation, authContext, returnData) {
          returnData.push({ json: { resource: "taxAuthority", operation } });
        }
      );

      const node = new MasterData();
      const context = createExecuteContext({
        items: [{ json: {} }, { json: {} }],
        parameters: {
          resource: ["client", "taxAuthority"],
          operation: ["getAll", "getAll"],
        },
      });

      const result = await node.execute.call(context as unknown as IExecuteFunctions);

      expect(result).toHaveLength(1); // Returns array of arrays
      expect(result[0]).toHaveLength(2); // Two results
      expect(result[0][0].json).toEqual({ resource: "client", operation: "getAll" });
      expect(result[0][1].json).toEqual({ resource: "taxAuthority", operation: "getAll" });

      clientHandlerSpy.mockRestore();
      taxAuthorityHandlerSpy.mockRestore();
    });
  });
});
