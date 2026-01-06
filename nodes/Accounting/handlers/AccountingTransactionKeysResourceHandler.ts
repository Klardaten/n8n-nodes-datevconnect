import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { RequestContext } from "../types";
import { NodeOperationError } from "n8n-workflow";
import { BaseResourceHandler } from "./BaseResourceHandler";
import { datevConnectClient } from "../../../src/services/accountingClient";

type AccountingTransactionKeysOperation = "getAll" | "get";

/**
 * Handler for Accounting Transaction Keys operations
 * Manages operations related to transaction key management
 */
export class AccountingTransactionKeysResourceHandler extends BaseResourceHandler {
  constructor(context: IExecuteFunctions, itemIndex: number) {
    super(context, itemIndex);
  }

  async execute(
    operation: AccountingTransactionKeysOperation,
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    switch (operation) {
      case "getAll":
        await this.handleGetAll(requestContext, returnData);
        break;
      case "get":
        await this.handleGet(requestContext, returnData);
        break;
      default:
        throw new NodeOperationError(
          this.context.getNode(),
          `Unknown operation: ${operation}`,
          {
            itemIndex: this.itemIndex,
          },
        );
    }
  }

  private async handleGetAll(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    try {
      const queryParams = this.buildQueryParams();
      const accountingTransactionKeys =
        await datevConnectClient.accounting.getAccountingTransactionKeys(
          this.context,
          requestContext.clientId!,
          requestContext.fiscalYearId!,
          queryParams,
        );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(accountingTransactionKeys);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGet(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    try {
      const accountingTransactionKeyId = this.getRequiredString(
        "accountingTransactionKeyId",
      );
      const queryParams = this.buildQueryParams();
      const accountingTransactionKey =
        await datevConnectClient.accounting.getAccountingTransactionKey(
          this.context,
          requestContext.clientId!,
          requestContext.fiscalYearId!,
          accountingTransactionKeyId,
          queryParams,
        );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(accountingTransactionKey);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }
}
