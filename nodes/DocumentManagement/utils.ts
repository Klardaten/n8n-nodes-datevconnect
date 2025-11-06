import type { IDataObject, IExecuteFunctions, ILoadOptionsFunctions } from "n8n-workflow";
import type { JsonValue } from "../../src/services/datevConnectClient";

/**
 * Converts an error to a standardized error object
 */
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

/**
 * Extracts error message from an error object
 */
export function toErrorMessage(error: unknown): string {
  return toErrorObject(error).message;
}

/**
 * Normalizes various data types to an array of objects
 */
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

/**
 * Parses a JSON parameter with proper error handling
 */
export function parseJsonParameter(
  value: JsonValue,
  parameterName: string,
  _context: IExecuteFunctions | ILoadOptionsFunctions,
  _itemIndex: number,
): JsonValue {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new Error(
        `Invalid JSON in parameter '${parameterName}': ${toErrorMessage(error)}`
      );
    }
  }
  return value as JsonValue;
}

/**
 * Gets an optional string parameter
 */
export function getOptionalString(
  context: IExecuteFunctions,
  parameterName: string,
  itemIndex: number,
): string | undefined {
  const value = context.getNodeParameter(parameterName, itemIndex, "") as string;
  return value.trim() || undefined;
}

/**
 * Gets a required string parameter
 */
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

/**
 * Gets a number parameter with default value
 */
export function getNumberParameter(
  context: IExecuteFunctions,
  parameterName: string,
  itemIndex: number,
  defaultValue: number,
): number {
  const value = context.getNodeParameter(parameterName, itemIndex, defaultValue) as number;
  return value;
}

/**
 * Builds query parameters object from optional values
 */
export function buildQueryParams(params: Record<string, unknown>): Record<string, string> {
  const query: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query[key] = String(value);
    }
  }
  
  return query;
}

/**
 * Gets required JSON data from parameter
 */
export function getRequiredJsonData(
  context: IExecuteFunctions,
  parameterName: string,
  itemIndex: number,
): JsonValue {
  const rawValue = context.getNodeParameter(parameterName, itemIndex) as JsonValue;
  if (!rawValue) {
    throw new Error(`Parameter '${parameterName}' is required`);
  }
  return parseJsonParameter(rawValue, parameterName, context, itemIndex);
}