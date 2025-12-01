import {
  NodeApiError,
  type IExecuteFunctions,
  type INodeExecutionData,
} from "n8n-workflow";
import type { JsonValue } from "../../../src/services/datevConnectClient";
import type { AuthContext, SendSuccessFunction } from "../types";
import {
  getNumberParameter,
  getOptionalString,
  getRequiredNumber,
  getRequiredString,
  normaliseToObjects,
  parseJsonParameter,
  toErrorMessage,
  toErrorObject,
} from "../utils";

export abstract class BaseResourceHandler {
  protected context: IExecuteFunctions;
  protected itemIndex: number;

  constructor(context: IExecuteFunctions, itemIndex: number) {
    this.context = context;
    this.itemIndex = itemIndex;
  }

  abstract execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void>;

  protected createSendSuccess(returnData: INodeExecutionData[]): SendSuccessFunction {
    return (payload?: JsonValue): void => {
      const formattedItems = normaliseToObjects(payload ?? { success: true });
      const executionData = this.context.helpers.constructExecutionMetaData(
        this.context.helpers.returnJsonArray(formattedItems),
        { itemData: { item: this.itemIndex } },
      );
      returnData.push(...executionData);
    };
  }

  protected handleError(error: unknown, returnData: INodeExecutionData[]): void {
    if (this.context.continueOnFail()) {
      returnData.push({
        json: {
          error: toErrorMessage(error),
        },
        pairedItem: { item: this.itemIndex },
      });
      return;
    }

    throw new NodeApiError(this.context.getNode(), toErrorObject(error), {
      itemIndex: this.itemIndex,
    });
  }

  protected getOptionalString(name: string): string | undefined {
    return getOptionalString(this.context, name, this.itemIndex);
  }

  protected getRequiredString(name: string): string {
    return getRequiredString(this.context, name, this.itemIndex);
  }

  protected getRequiredNumber(name: string): number {
    return getRequiredNumber(this.context, name, this.itemIndex);
  }

  protected getNumberParameter(name: string, defaultValue: number): number {
    return getNumberParameter(this.context, name, this.itemIndex, defaultValue);
  }

  protected parseJsonParameter(rawValue: unknown, parameterLabel: string): JsonValue {
    return parseJsonParameter(rawValue, parameterLabel, this.context, this.itemIndex);
  }
}
