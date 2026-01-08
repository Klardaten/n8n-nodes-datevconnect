import {
  NodeApiError,
  NodeOperationError,
  type IExecuteFunctions,
  type INodeExecutionData,
} from "n8n-workflow";
import type { JsonValue } from "../../../src/services/datevConnectClient";
import type {
  AuthContext,
  IdentityAndAccessManagementCredentials,
  SendSuccessFunction,
} from "../types";
import {
  buildQueryParams,
  getNumberParameter,
  getOptionalString,
  getRequiredJsonData,
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
            pairedItem: { item: this.itemIndex },
          });
        });
      };

      await this.executeOperation(operation, authContext, sendSuccess);
    } catch (error) {
      if (this.context.continueOnFail()) {
        returnData.push({
          json: {
            error: toErrorMessage(error),
          },
          pairedItem: { item: this.itemIndex },
        });
        return;
      }

      if (
        error instanceof NodeApiError ||
        error instanceof NodeOperationError
      ) {
        throw error;
      }

      throw new NodeApiError(this.context.getNode(), toErrorObject(error), {
        itemIndex: this.itemIndex,
      });
    }
  }

  protected abstract executeOperation(
    operation: string,
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void>;

  protected async getCredentials(): Promise<IdentityAndAccessManagementCredentials> {
    const credentials = (await this.context.getCredentials(
      "datevConnectApi",
    )) as IdentityAndAccessManagementCredentials | null;

    if (!credentials) {
      throw new NodeOperationError(
        this.context.getNode(),
        "DATEVconnect credentials are missing",
      );
    }

    const { host, email, password, clientInstanceId } = credentials;

    if (!host || !email || !password || !clientInstanceId) {
      throw new NodeOperationError(
        this.context.getNode(),
        "All DATEVconnect credential fields must be provided",
      );
    }

    return credentials;
  }

  protected createAuthContext(
    credentials: IdentityAndAccessManagementCredentials,
    token: string,
  ): AuthContext {
    return {
      host: credentials.host,
      token,
      clientInstanceId: credentials.clientInstanceId,
    };
  }

  protected getOptionalString(name: string): string | undefined {
    return getOptionalString(this.context, name, this.itemIndex);
  }

  protected getRequiredString(name: string): string {
    return getRequiredString(this.context, name, this.itemIndex);
  }

  protected getNumberParameter(name: string, defaultValue: number): number {
    return getNumberParameter(this.context, name, this.itemIndex, defaultValue);
  }

  protected parseJsonParameter(
    rawValue: unknown,
    parameterLabel: string,
  ): JsonValue {
    return parseJsonParameter(
      rawValue as JsonValue,
      parameterLabel,
      this.context,
      this.itemIndex,
    );
  }

  protected getRequiredJsonData(name: string): JsonValue {
    return getRequiredJsonData(this.context, name, this.itemIndex);
  }

  protected buildQueryParams(
    params: Record<string, unknown>,
  ): Record<string, string> {
    return buildQueryParams(params);
  }

  protected validateRequestContext(authContext: AuthContext): void {
    if (
      !authContext.host ||
      !authContext.token ||
      !authContext.clientInstanceId
    ) {
      throw new NodeOperationError(
        this.context.getNode(),
        "Authentication context is incomplete",
      );
    }
  }
}
