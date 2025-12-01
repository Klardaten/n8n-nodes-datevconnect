import {
  NodeOperationError,
  type IDataObject,
  type IExecuteFunctions,
} from "n8n-workflow";
import type { JsonValue } from "../../src/services/datevConnectClient";
import type { NormalizedData } from "./types";

export function toErrorObject(error: unknown): { message: string } {
  if (error instanceof Error) {
    return { message: error.message };
  }
  if (typeof error === "string") {
    return { message: error };
  }
  if (error && typeof error === "object" && "message" in error) {
    return { message: String((error as { message?: unknown }).message ?? "Unknown error") };
  }
  return { message: "Unknown error" };
}

export function toErrorMessage(error: unknown): string {
  return toErrorObject(error).message;
}

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

export function parseJsonParameter(
  rawValue: unknown,
  parameterLabel: string,
  context: IExecuteFunctions,
  itemIndex: number,
): JsonValue {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
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

export function getRequiredString(
  context: IExecuteFunctions,
  name: string,
  itemIndex: number,
): string {
  const value = getOptionalString(context, name, itemIndex);
  if (!value) {
    throw new NodeOperationError(
      context.getNode(),
      `Parameter "${name}" is required.`,
      { itemIndex },
    );
  }
  return value;
}

export function getRequiredNumber(
  context: IExecuteFunctions,
  name: string,
  itemIndex: number,
): number {
  const value = context.getNodeParameter(name, itemIndex);
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new NodeOperationError(
      context.getNode(),
      `Parameter "${name}" is required and must be a number.`,
      { itemIndex },
    );
  }
  return value;
}

export function getNumberParameter(
  context: IExecuteFunctions,
  name: string,
  itemIndex: number,
  defaultValue: number,
): number {
  return context.getNodeParameter(name, itemIndex, defaultValue) as number;
}
