/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test, mock } from "bun:test";
import { NodeOperationError, type IExecuteFunctions, type INode, type JsonObject } from "n8n-workflow";
import {
  toErrorObject,
  toErrorMessage,
  normaliseToObjects,
  parseJsonParameter,
  getOptionalString,
  getRequiredString,
  getNumberParameter,
} from "../../../nodes/MasterData/utils";

// Mock IExecuteFunctions for testing
const mockContext = {
  getNode: (): INode => ({ name: "TestNode" } as INode),
  getNodeParameter: mock((name: string, itemIndex: number, defaultValue?: unknown) => {
    const mockData: Record<string, unknown> = {
      "optional-empty": "",
      "optional-whitespace": "  ",
      "optional-value": "test-value",
      "required-value": "required-test",
      "required-empty": "",
      "number-value": 42,
      "number-default": undefined,
    };
    const key = `${name}-${itemIndex === 0 ? "value" : itemIndex === 1 ? "empty" : itemIndex === 2 ? "whitespace" : "default"}`;
    return mockData[key] !== undefined ? mockData[key] : defaultValue;
  }),
} as Pick<IExecuteFunctions, 'getNode' | 'getNodeParameter'>;

describe("Utils", () => {
  describe("toErrorObject", () => {
    test("converts Error instance to JsonObject", () => {
      const error = new Error("Test error message");
      const result = toErrorObject(error);
      expect(result).toEqual(error as unknown as JsonObject);
    });

    test("converts object to JsonObject", () => {
      const error = { code: "ERR001", message: "Custom error" };
      const result = toErrorObject(error);
      expect(result).toEqual(error);
    });

    test("converts string to JsonObject with message property", () => {
      const error = "String error";
      const result = toErrorObject(error);
      expect(result).toEqual({ message: "String error" });
    });

    test("converts null to JsonObject with message", () => {
      const result = toErrorObject(null);
      expect(result).toEqual({ message: "Unknown error" });
    });

    test("converts undefined to JsonObject with message", () => {
      const result = toErrorObject(undefined);
      expect(result).toEqual({ message: "Unknown error" });
    });
  });

  describe("toErrorMessage", () => {
    test("extracts message from Error instance", () => {
      const error = new Error("Test error message");
      const result = toErrorMessage(error);
      expect(result).toBe("Test error message");
    });

    test("returns string error as-is", () => {
      const error = "String error";
      const result = toErrorMessage(error);
      expect(result).toBe("String error");
    });

    test("returns Unknown error for null", () => {
      const result = toErrorMessage(null);
      expect(result).toBe("Unknown error");
    });

    test("returns Unknown error for undefined", () => {
      const result = toErrorMessage(undefined);
      expect(result).toBe("Unknown error");
    });

    test("serializes object to JSON string", () => {
      const error = { code: "ERR001", message: "Custom error" };
      const result = toErrorMessage(error);
      expect(result).toBe('{"code":"ERR001","message":"Custom error"}');
    });
  });

  describe("normaliseToObjects", () => {
    test("normalizes array of objects", () => {
      const data = [{ id: 1, name: "Test" }, { id: 2, name: "Test2" }];
      const result = normaliseToObjects(data);
      expect(result).toEqual([
        { id: 1, name: "Test" },
        { id: 2, name: "Test2" },
      ]);
    });

    test("normalizes array with mixed types", () => {
      const data = [{ id: 1 }, "string", 42, null];
      const result = normaliseToObjects(data);
      expect(result).toEqual([
        { id: 1 },
        { value: "string" },
        { value: 42 },
        { value: null },
      ]);
    });

    test("normalizes single object", () => {
      const data = { id: 1, name: "Test" };
      const result = normaliseToObjects(data);
      expect(result).toEqual([{ id: 1, name: "Test" }]);
    });

    test("normalizes primitive values", () => {
      expect(normaliseToObjects("string")).toEqual([{ value: "string" }]);
      expect(normaliseToObjects(42)).toEqual([{ value: 42 }]);
      expect(normaliseToObjects(true)).toEqual([{ value: true }]);
      expect(normaliseToObjects(null)).toEqual([{ value: null }]);
    });
  });

  describe("parseJsonParameter", () => {
    test("parses valid JSON string", () => {
      const result = parseJsonParameter('{"key":"value"}', "Test Param", mockContext as IExecuteFunctions, 0);
      expect(result).toEqual({ key: "value" });
    });

    test("returns non-string values as-is", () => {
      const obj = { key: "value" };
      const result = parseJsonParameter(obj, "Test Param", mockContext as IExecuteFunctions, 0);
      expect(result).toEqual(obj);
    });

    test("throws NodeOperationError for null/undefined", () => {
      expect(() => {
        parseJsonParameter(null, "Test Param", mockContext as IExecuteFunctions, 0);
      }).toThrow(NodeOperationError);

      expect(() => {
        parseJsonParameter(undefined, "Test Param", mockContext as IExecuteFunctions, 0);
      }).toThrow(NodeOperationError);
    });

    test("throws NodeOperationError for invalid JSON", () => {
      expect(() => {
        parseJsonParameter("invalid json", "Test Param", mockContext as IExecuteFunctions, 0);
      }).toThrow(NodeOperationError);
    });
  });

  describe("getOptionalString", () => {
    test("returns string value", () => {
      const result = getOptionalString(mockContext as IExecuteFunctions, "optional", 0);
      expect(result).toBe("test-value");
    });

    test("returns undefined for empty string", () => {
      const result = getOptionalString(mockContext as IExecuteFunctions, "optional", 1);
      expect(result).toBeUndefined();
    });

    test("returns undefined for whitespace-only string", () => {
      const result = getOptionalString(mockContext as IExecuteFunctions, "optional", 2);
      expect(result).toBeUndefined();
    });

    test("returns undefined for non-string value", () => {
      const result = getOptionalString(mockContext as IExecuteFunctions, "number", 0);
      expect(result).toBeUndefined();
    });
  });

  describe("getRequiredString", () => {
    test("returns string value", () => {
      const result = getRequiredString(mockContext as IExecuteFunctions, "required", 0);
      expect(result).toBe("required-test");
    });

    test("throws NodeOperationError for empty string", () => {
      expect(() => {
        getRequiredString(mockContext as IExecuteFunctions, "required", 1);
      }).toThrow(NodeOperationError);
    });

    test("throws NodeOperationError for non-string value", () => {
      expect(() => {
        getRequiredString(mockContext as IExecuteFunctions, "number", 0);
      }).toThrow(NodeOperationError);
    });
  });

  describe("getNumberParameter", () => {
    test("returns number value", () => {
      const result = getNumberParameter(mockContext as IExecuteFunctions, "number", 0, 0);
      expect(result).toBe(42);
    });

    test("returns default value when parameter is undefined", () => {
      const result = getNumberParameter(mockContext as IExecuteFunctions, "number", 3, 100);
      expect(result).toBe(100);
    });
  });
});