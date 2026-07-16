import { describe, expect, test } from "bun:test";
import {
  NodeApiError,
  type IExecuteFunctions,
  type INode,
  type INodeType,
} from "n8n-workflow";
import { Accounting } from "../../nodes/Accounting/Accounting.node";
import { DocumentManagement } from "../../nodes/DocumentManagement/DocumentManagement.node";
import { IdentityAndAccessManagement } from "../../nodes/IdentityAndAccessManagement/IdentityAndAccessManagement.node";
import { MasterData } from "../../nodes/MasterData/MasterData.node";
import { OrderManagement } from "../../nodes/OrderManagement/OrderManagement.node";

const nodes: Array<{ name: string; create: () => INodeType }> = [
  { name: "Accounting", create: () => new Accounting() },
  { name: "DocumentManagement", create: () => new DocumentManagement() },
  {
    name: "IdentityAndAccessManagement",
    create: () => new IdentityAndAccessManagement(),
  },
  { name: "MasterData", create: () => new MasterData() },
  { name: "OrderManagement", create: () => new OrderManagement() },
];

function createExecuteContext(nodeName: string, apiError: NodeApiError) {
  const executionNode: INode = {
    id: "test-node-id",
    name: nodeName,
    type: "test-node",
    typeVersion: 1,
    position: [0, 0],
    parameters: {},
  };

  return {
    getInputData() {
      return [{ json: {} }];
    },
    async getCredentials() {
      return {
        host: "https://api.example.com",
        clientInstanceId: "instance-1",
        apiKey: `uk-${"x".repeat(61)}`,
      };
    },
    getNodeParameter() {
      throw apiError;
    },
    getNode() {
      return executionNode;
    },
    helpers: {
      async httpRequest() {
        throw new Error("httpRequest should not be called");
      },
    },
    continueOnFail() {
      return false;
    },
  };
}

describe("top-level node API error handling", () => {
  for (const { name, create } of nodes) {
    test(`${name} preserves API error response context`, async () => {
      const executionNode: INode = {
        id: "test-node-id",
        name,
        type: "test-node",
        typeVersion: 1,
        position: [0, 0],
        parameters: {},
      };
      const apiError = new NodeApiError(executionNode, {
        message: "DATEV request failed",
        statusCode: 429,
        response: {
          data: {
            detail: "Rate limit exceeded",
          },
        },
      });
      const context = createExecuteContext(name, apiError);

      const execution = create().execute?.call(
        context as unknown as IExecuteFunctions,
      );

      expect(execution).toBeDefined();
      await expect(execution!).rejects.toBe(apiError);
      expect(apiError.httpCode).toBe("429");
      expect(apiError.context.data).toEqual({
        detail: "Rate limit exceeded",
      });
    });
  }
});
