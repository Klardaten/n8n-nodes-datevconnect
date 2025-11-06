import {
  NodeApiError,
  NodeOperationError,
  type IExecuteFunctions,
  type INodeExecutionData,
} from "n8n-workflow";
import type { JsonValue } from "../../../src/services/datevConnectClient";
import type {
  AuthContext,
  DocumentManagementCredentials,
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
  buildQueryParams,
  getRequiredJsonData,
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
   * Main execution method that handles operation routing and error handling
   */
  async execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    try {
      const sendSuccess: SendSuccessFunction = (payload?: JsonValue) => {
        const data = payload ? normaliseToObjects(payload) : [{}];
        data.forEach((item) => {
          returnData.push({
            json: {
              success: true,
              ...item,
            },
          });
        });
      };

      await this.executeOperation(operation, authContext, sendSuccess);
    } catch (error) {
      const continueOnFail = this.context.continueOnFail();
      if (continueOnFail) {
        returnData.push({
          json: {
            error: toErrorMessage(error),
          },
        });
      } else {
        if (error instanceof NodeApiError || error instanceof NodeOperationError) {
          throw error;
        }
        throw new NodeApiError(this.context.getNode(), toErrorObject(error), {
          itemIndex: this.itemIndex,
        });
      }
    }
  }

  /**
   * Abstract method that subclasses must implement to handle specific operations
   */
  protected abstract executeOperation(
    operation: string,
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void>;

  /**
   * Gets DATEVconnect credentials and validates them
   */
  protected async getCredentials(): Promise<DocumentManagementCredentials> {
    const credentials = (await this.context.getCredentials("datevConnectApi")) as
      | DocumentManagementCredentials
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
    credentials: DocumentManagementCredentials,
    token: string,
  ): AuthContext {
    return {
      host: credentials.host,
      token,
      clientInstanceId: credentials.clientInstanceId,
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
    return parseJsonParameter(rawValue as JsonValue, parameterLabel, this.context, this.itemIndex);
  }

  /**
   * Gets required JSON data from parameter
   */
  protected getRequiredJsonData(name: string): JsonValue {
    return getRequiredJsonData(this.context, name, this.itemIndex);
  }

  /**
   * Builds query parameters from optional values
   */
  protected buildQueryParams(params: Record<string, unknown>): Record<string, string> {
    return buildQueryParams(params);
  }

  /**
   * Validates that request context has required authentication
   */
  protected validateRequestContext(authContext: AuthContext): void {
    if (!authContext.host || !authContext.token || !authContext.clientInstanceId) {
      throw new NodeOperationError(
        this.context.getNode(),
        "Authentication context is incomplete"
      );
    }
  }
}