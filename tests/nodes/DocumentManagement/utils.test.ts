import { describe, expect, mock, test } from "bun:test";
import {
  type IExecuteFunctions,
  type INode,
  NodeOperationError,
} from "n8n-workflow";
import {
  getOptionalString,
  getRequiredString,
} from "../../../nodes/DocumentManagement/utils";

function createContext(value: unknown): IExecuteFunctions {
  return {
    getNode: (): INode => ({ name: "Document Management" }) as INode,
    getNodeParameter: mock(() => value),
  } as unknown as IExecuteFunctions;
}

describe("Document Management string parameters", () => {
  test("trims required string parameters", () => {
    const context = createContext("  document-123  ");

    expect(getRequiredString(context, "documentId", 0)).toBe("document-123");
  });

  test("converts required numeric parameters to strings", () => {
    const context = createContext(44167);

    expect(getRequiredString(context, "documentFileId", 0)).toBe("44167");
  });

  test("rejects empty required parameters with a node operation error", () => {
    const context = createContext("   ");

    expect(() => getRequiredString(context, "documentFileId", 0)).toThrow(
      NodeOperationError,
    );
  });

  test("rejects object values for required parameters", () => {
    const context = createContext({ document_file_id: 44167 });

    expect(() => getRequiredString(context, "documentFileId", 0)).toThrow(
      "Parameter 'documentFileId' is required and must be a string or number",
    );
  });

  test("ignores non-string optional parameters", () => {
    const context = createContext({ filter: "number eq 3271" });

    expect(getOptionalString(context, "filter", 0)).toBeUndefined();
  });
});
