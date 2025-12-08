import {
  NodeApiError,
  NodeOperationError,
  type IExecuteFunctions,
  type INodeExecutionData,
} from "n8n-workflow";
import type { JsonValue } from "../../../src/services/datevConnectClient";
import type {
  AuthContext,
  MasterDataCredentials,
  SendSuccessFunction,
} from "../types";
import {
  normaliseToObjects,
  parseJsonParameter,
  getOptionalString,
  getRequiredString,
  getNumberParameter,
  toErrorMessage,
  toErrorObject,
} from "../utils";

/**
 * Abstract base class for resource handlers
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
   * Gets DATEVconnect credentials and validates them
   */
  protected async getCredentials(): Promise<MasterDataCredentials> {
    const credentials = (await this.context.getCredentials("datevConnectApi")) as
      | MasterDataCredentials
      | null;

    if (!credentials) {
      throw new NodeOperationError(this.context.getNode(), "DATEVconnect credentials are missing");
    }

    const { host, email, password, clientInstanceId } = credentials;

    if (!host || !email || !password || !clientInstanceId) {
      throw new NodeOperationError(
        this.context.getNode(),
        "All DATEVconnect credential fields must be provided"
      );
    }

    return credentials;
  }

  /**
   * Creates an authentication context with token
   */
  protected createAuthContext(
    credentials: MasterDataCredentials,
    token: string,
  ): AuthContext {
    return {
      host: credentials.host,
      token,
      clientInstanceId: credentials.clientInstanceId,
      helpers: this.context.helpers,
    };
  }

  /**
   * Gets an optional string parameter
   */
  protected getOptionalString(name: string): string | undefined {
    return getOptionalString(this.context, name, this.itemIndex);
  }

  /**
   * Gets a required string parameter
   */
  protected getRequiredString(name: string): string {
    return getRequiredString(this.context, name, this.itemIndex);
  }

  /**
   * Gets a number parameter with default value
   */
  protected getNumberParameter(name: string, defaultValue: number): number {
    return getNumberParameter(this.context, name, this.itemIndex, defaultValue);
  }

  /**
   * Parses a JSON parameter
   */
  protected parseJsonParameter(rawValue: unknown, parameterLabel: string): JsonValue {
    return parseJsonParameter(rawValue, parameterLabel, this.context, this.itemIndex);
  }

  /**
   * Creates a success response function that formats and adds data to returnData
   */
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

  /**
   * Handles errors according to continueOnFail setting
   */
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

  /**
   * Abstract method to be implemented by specific resource handlers
   */
  abstract execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void>;
}