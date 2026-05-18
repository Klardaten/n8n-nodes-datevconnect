import { describe, expect, spyOn, test } from "bun:test";
import type { IExecuteFunctions } from "n8n-workflow";
import { DocumentManagement } from "../../nodes/DocumentManagement/DocumentManagement.node";
import { DocumentResourceHandler } from "../../nodes/DocumentManagement/handlers/DocumentResourceHandler";

type InputItem = { json: Record<string, unknown> };

type ExecuteContextOptions = {
  items?: InputItem[];
  credentials?: Record<string, string> | null;
  parameters?: Record<string, Array<unknown> | unknown>;
};

function createExecuteContext(options: ExecuteContextOptions = {}) {
  const {
    items = [{ json: {} }],
    credentials = {
      host: "https://api.example.com",
      clientInstanceId: "instance-1",
      apiKey: "uk-" + "x".repeat(61),
    },
    parameters = {},
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
      return { name: "DocumentManagement" };
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
      return false;
    },
  };
}

describe("DocumentManagement node", () => {
  test("exposes profileId parameter", () => {
    const node = new DocumentManagement();
    const profileIdParam = node.description.properties?.find(
      (property) => property.name === "profileId",
    );

    expect(profileIdParam).toBeDefined();
    expect(profileIdParam?.type).toBe("string");
  });

  test("passes credential profileId and lets node profileId override it", async () => {
    const node = new DocumentManagement();
    const context = createExecuteContext({
      items: [{ json: {} }, { json: {} }],
      credentials: {
        host: "https://api.example.com",
        clientInstanceId: "instance-1",
        apiKey: "uk-" + "x".repeat(61),
        profileId: "credential-profile",
      },
      parameters: {
        resource: ["document", "document"],
        operation: ["getAll", "getAll"],
        profileId: ["", "node-profile"],
      },
    });

    const documentHandlerSpy = spyOn(
      DocumentResourceHandler.prototype,
      "execute",
    ).mockResolvedValue();

    await node.execute.call(context as unknown as IExecuteFunctions);

    expect(documentHandlerSpy).toHaveBeenNthCalledWith(
      1,
      "getAll",
      expect.objectContaining({ profileId: "credential-profile" }),
      expect.any(Array),
    );
    expect(documentHandlerSpy).toHaveBeenNthCalledWith(
      2,
      "getAll",
      expect.objectContaining({ profileId: "node-profile" }),
      expect.any(Array),
    );

    documentHandlerSpy.mockRestore();
  });
});
