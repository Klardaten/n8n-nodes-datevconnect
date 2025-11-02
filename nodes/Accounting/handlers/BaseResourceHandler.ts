import {
  NodeApiError,
  NodeOperationError,
  type IExecuteFunctions,
  type INodeExecutionData,
  type IDataObject,
  type JsonObject,
} from "n8n-workflow";
import type { JsonValue } from "../../../src/services/datevConnectClient";
import type { RequestContext } from "../types";

/**
 * Abstract base class for accounting resource handlers
 * Provides common functionality for authentication, parameter parsing, and response handling
 */
export abstract class BaseResourceHandler {
  protected context: IExecuteFunctions;
  protected itemIndex: number;

  constructor(context: IExecuteFunctions, itemIndex: number) {
    this.context = context;
    this.itemIndex = itemIndex;
  }

  /**
   * Abstract method to be implemented by specific resource handlers
   */
  abstract execute(
    operation: string,
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void>;

  /**
   * Gets an optional string parameter
   */
  protected getOptionalString(name: string): string | undefined {
    const value = this.context.getNodeParameter(name, this.itemIndex, "") as string;
    return value || undefined;
  }

  /**
   * Gets a required string parameter
   */
  protected getRequiredString(name: string): string {
    const value = this.context.getNodeParameter(name, this.itemIndex) as string;
    if (!value) {
      throw new NodeOperationError(
        this.context.getNode(),
        `Parameter "${name}" is required`,
        { itemIndex: this.itemIndex }
      );
    }
    return value;
  }

  /**
   * Gets a number parameter with default value
   */
  protected getNumberParameter(name: string, defaultValue: number): number {
    const value = this.context.getNodeParameter(name, this.itemIndex, defaultValue) as number;
    return typeof value === 'number' ? value : defaultValue;
  }

  /**
   * Parses a JSON parameter
   */
  protected parseJsonParameter(rawValue: unknown, parameterLabel: string): JsonValue {
    if (typeof rawValue === 'string') {
      try {
        return JSON.parse(rawValue);
      } catch {
        throw new NodeOperationError(
          this.context.getNode(),
          `Invalid JSON in parameter "${parameterLabel}"`,
          { itemIndex: this.itemIndex }
        );
      }
    }
    return rawValue as JsonValue;
  }

  /**
   * Builds query parameters for API calls
   */
  protected buildQueryParams(additionalParams: IDataObject = {}): IDataObject {
    const params: IDataObject = {};

    // Add OData parameters
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);
    const select = this.getOptionalString("select");
    const filter = this.getOptionalString("filter");
    const expand = this.getOptionalString("expand");

    if (top > 0) {
      params.top = top;
    }
    if (skip > 0) {
      params.skip = skip;
    }
    if (select) {
      params.select = select;
    }
    if (filter) {
      params.filter = filter;
    }
    if (expand && expand !== "") {
      params.expand = expand === "all" ? "*" : expand;
    }

    return { ...params, ...additionalParams };
  }

  /**
   * Creates a success response function that formats and adds data to returnData
   */
  protected createSendSuccess(returnData: INodeExecutionData[]): (payload?: JsonValue) => void {
    return (payload?: JsonValue): void => {
      const formattedData = this.normalizeToObjects(payload ?? { success: true });
      const executionData = this.context.helpers.constructExecutionMetaData(
        this.context.helpers.returnJsonArray(formattedData),
        { itemData: { item: this.itemIndex } },
      );
      returnData.push(...executionData);
    };
  }

  /**
   * Normalizes JsonValue to IDataObject array for n8n
   */
  private normalizeToObjects(value: JsonValue): IDataObject[] {
    if (value === null || value === undefined) {
      return [{}];
    }
    if (Array.isArray(value)) {
      return value.map(item => this.normalizeToObjects(item)[0]);
    }
    if (typeof value === 'object') {
      return [value as IDataObject];
    }
    return [{ value }];
  }

  /**
   * Converts error to string message
   */
  private toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error === null || error === undefined) {
      return 'Unknown error';
    }
    return JSON.stringify(error);
  }

  /**
   * Converts error to JsonObject for NodeApiError
   */
  private toErrorObject(error: unknown): JsonObject {
    if (error && typeof error === "object") {
      return error as JsonObject;
    }

    const message = error instanceof Error ? error.message : String(error ?? "Unknown error");
    return { message } satisfies JsonObject;
  }

  /**
   * Handles errors according to continueOnFail setting
   */
  protected handleError(error: unknown, returnData: INodeExecutionData[]): void {
    if (this.context.continueOnFail()) {
      returnData.push({
        json: {
          error: this.toErrorMessage(error),
        },
        pairedItem: { item: this.itemIndex },
      });
      return;
    }

    throw new NodeApiError(this.context.getNode(), this.toErrorObject(error), {
      itemIndex: this.itemIndex,
    });
  }
}