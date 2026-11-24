import { describe, expect, mock, spyOn, test } from "bun:test";
import { NodeApiError, type IExecuteFunctions } from "n8n-workflow";
import { DocumentManagement } from "../../nodes/DocumentManagement/DocumentManagement.node";
import { DocumentResourceHandler } from "../../nodes/DocumentManagement/handlers/DocumentResourceHandler";
import type { HttpRequestHelper } from "../../src/services/httpHelpers";

type InputItem = { json: Record<string, unknown> };

type ExecuteContextOptions = {
  items?: InputItem[];
  credentials?: Record<string, string> | null;
  parameters?: Record<string, Array<unknown> | unknown>;
  httpRequest?: HttpRequestHelper;
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
    httpRequest,
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
      httpRequest,
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

  const description =
    "description can not be changed if property template is set";
  const datevError = { error_description: description, request_id: "req-123" };

  test.each([
    [
      "the sandbox diagnostic without an error code",
      JSON.stringify(datevError),
      `: ${description} | Request ID: req-123`,
    ],
    [
      "a DATEV error code when supplied",
      JSON.stringify({ ...datevError, error: "validation_fault" }),
      `: ${description} | Error ID: validation_fault | Request ID: req-123`,
    ],
    ["only the status for an empty response", "", ""],
    ["only the status for malformed JSON", '{"incomplete":', ""],
    [
      "only the status for a non-JSON response",
      "<html>Gateway diagnostic</html>",
      "",
      "text/html",
    ],
    [
      "only the status for unrecognized JSON",
      '{"headers":{"Authorization":"Bearer fixture-token"}}',
      "",
    ],
  ])(
    "reports %s when updating a document",
    async (
      _,
      responseBody,
      details,
      contentType = "application/json;charset=utf-8",
    ) => {
      const documentId = "doc-123";
      const documentData = JSON.stringify({
        id: documentId,
        description: "Updated description",
      });
      const httpRequest = mock<HttpRequestHelper>(async () => {
        throw Object.assign(new Error("Request failed with status code 400"), {
          response: {
            status: 400,
            statusText: "Bad Request",
            headers: { "content-type": contentType },
            data: Buffer.from(responseBody),
          },
        });
      });
      const context = createExecuteContext({
        httpRequest,
        parameters: {
          resource: "document",
          operation: "update",
          documentId,
          documentData,
        },
      });
      const node = new DocumentManagement();
      const message = `Failed to update document (400 Bad Request)${details}`;

      const execution = node.execute.call(
        context as unknown as IExecuteFunctions,
      );
      await expect(execution).rejects.toBeInstanceOf(NodeApiError);
      await expect(execution).rejects.toHaveProperty("message", message);

      const continueOnFailContext = { ...context, continueOnFail: () => true };
      await expect(
        node.execute.call(
          continueOnFailContext as unknown as IExecuteFunctions,
        ),
      ).resolves.toEqual([[{ json: { error: message } }]]);

      expect(httpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: `https://api.example.com/datevconnect/dms/v2/documents/${documentId}`,
          method: "PUT",
          body: documentData,
        }),
      );
    },
  );
});
