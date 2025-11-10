import {
  NodeOperationError,
  type IDataObject,
  type IExecuteFunctions,
  type ILoadOptionsFunctions,
} from "n8n-workflow";
import type { JsonValue } from "../../src/services/datevConnectClient";

export function toErrorObject(error: unknown): { message: string } {
  if (error instanceof Error) {
    return { message: error.message };
  }
  if (typeof error === "string") {
    return { message: error };
  }
  if (error && typeof error === "object" && "message" in error) {
    return { message: String(error.message) };
  }
  return { message: "An unknown error occurred" };
}

export function toErrorMessage(error: unknown): string {
  return toErrorObject(error).message;
}

export function normaliseToObjects(data: JsonValue): IDataObject[] {
  if (data === null || data === undefined) {
    return [];
  }

  if (Array.isArray(data)) {
    return data.map((item) => {
      if (item === null || item === undefined) {
        return {};
      }
      if (typeof item === "object") {
        return item as IDataObject;
      }
      return { value: item };
    });
  }

  if (typeof data === "object") {
    return [data as IDataObject];
  }

  return [{ value: data }];
}

export function parseJsonParameter(
  value: JsonValue,
  parameterName: string,
  context: IExecuteFunctions | ILoadOptionsFunctions,
  itemIndex: number,
): JsonValue {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new NodeOperationError(
        context.getNode(),
        `Invalid JSON in parameter '${parameterName}': ${toErrorMessage(error)}`,
        { itemIndex },
      );
    }
  }
  return value as JsonValue;
}

export function getOptionalString(
  context: IExecuteFunctions,
  parameterName: string,
  itemIndex: number,
): string | undefined {
  const value = context.getNodeParameter(parameterName, itemIndex, "") as string;
  return value.trim() || undefined;
}

export function getRequiredString(
  context: IExecuteFunctions,
  parameterName: string,
  itemIndex: number,
): string {
  const value = getOptionalString(context, parameterName, itemIndex);
  if (!value) {
    throw new Error(`Parameter '${parameterName}' is required`);
  }
  return value;
}

export function getNumberParameter(
  context: IExecuteFunctions,
  parameterName: string,
  itemIndex: number,
  defaultValue: number,
): number {
  const value = context.getNodeParameter(parameterName, itemIndex, defaultValue) as number;
  return value;
}

export function buildQueryParams(params: Record<string, unknown>): Record<string, string> {
  const query: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query[key] = String(value);
    }
  }

  return query;
}

export function getRequiredJsonData(
  context: IExecuteFunctions,
  parameterName: string,
  itemIndex: number,
): JsonValue {
  const rawValue = context.getNodeParameter(parameterName, itemIndex) as JsonValue;
  if (!rawValue) {
    throw new NodeOperationError(
      context.getNode(),
      `Parameter '${parameterName}' is required`,
      { itemIndex },
    );
  }
  return parseJsonParameter(rawValue, parameterName, context, itemIndex);
}
