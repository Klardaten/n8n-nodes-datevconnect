import {
  NodeOperationError,
  type IDataObject,
  type IExecuteFunctions,
  type JsonObject,
} from "n8n-workflow";
import type { JsonValue } from "../../src/services/datevConnectClient";
import type { NormalizedData } from "./types";

/**
 * Converts an unknown error to a JsonObject for n8n error handling
 */
export function toErrorObject(error: unknown): JsonObject {
  if (error && typeof error === "object") {
    return error as JsonObject;
  }

  const message =
    error instanceof Error ? error.message : String(error ?? "Unknown error");
  return { message } satisfies JsonObject;
}

/**
 * Extracts a readable error message from an unknown error
 */
export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (error === null || error === undefined) {
    return "Unknown error";
  }

  return typeof error === "string" ? error : JSON.stringify(error);
}

/**
 * Normalizes various data types to an array of IDataObject for n8n
 */
export function normaliseToObjects(data: JsonValue): NormalizedData {
  if (Array.isArray(data)) {
    return data.map((entry) => {
      if (entry && typeof entry === "object") {
        return entry as IDataObject;
      }
      return { value: entry ?? null };
    });
  }

  if (data && typeof data === "object") {
    return [data as IDataObject];
  }

  return [{ value: data ?? null }];
}

/**
 * Safely parses a JSON parameter from node input
 */
export function parseJsonParameter(
  rawValue: unknown,
  parameterLabel: string,
  context: IExecuteFunctions,
  itemIndex: number,
): JsonValue {
  if (rawValue === null || rawValue === undefined) {
    throw new NodeOperationError(
      context.getNode(),
      `Parameter "${parameterLabel}" must be provided.`,
      { itemIndex },
    );
  }

  if (typeof rawValue === "string") {
    try {
      return JSON.parse(rawValue) as JsonValue;
    } catch (error) {
      throw new NodeOperationError(
        context.getNode(),
        `Parameter "${parameterLabel}" contains invalid JSON: ${toErrorMessage(error)}`,
        { itemIndex },
      );
    }
  }

  return rawValue as JsonValue;
}

/**
 * Gets an optional string parameter, returning undefined if empty
 */
export function getOptionalString(
  context: IExecuteFunctions,
  name: string,
  itemIndex: number,
): string | undefined {
  const value = context.getNodeParameter(name, itemIndex, "") as string;
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }
  return value;
}

/**
 * Gets a required string parameter
 */
export function getRequiredString(
  context: IExecuteFunctions,
  name: string,
  itemIndex: number,
): string {
  const value = context.getNodeParameter(name, itemIndex) as string;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new NodeOperationError(
      context.getNode(),
      `Parameter "${name}" is required.`,
      { itemIndex },
    );
  }
  return value;
}

/**
 * Gets a number parameter with optional default
 */
export function getNumberParameter(
  context: IExecuteFunctions,
  name: string,
  itemIndex: number,
  defaultValue: number,
): number {
  return context.getNodeParameter(name, itemIndex, defaultValue) as number;
}
