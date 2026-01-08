import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { RequestContext } from "../types";
import { NodeOperationError } from "n8n-workflow";
import { BaseResourceHandler } from "./BaseResourceHandler";
import { datevConnectClient } from "../../../src/services/accountingClient";

type GeneralLedgerAccountsOperation = "getAll" | "get" | "getUtilized";

/**
 * Handler for General Ledger Accounts operations
 * Manages operations related to chart of accounts
 */
export class GeneralLedgerAccountsResourceHandler extends BaseResourceHandler {
  constructor(context: IExecuteFunctions, itemIndex: number) {
    super(context, itemIndex);
  }

  async execute(
    operation: GeneralLedgerAccountsOperation,
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
      case "getUtilized":
        await this.handleGetUtilized(requestContext, returnData);
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
      const accounts =
        await datevConnectClient.accounting.getGeneralLedgerAccounts(
          this.context,
          requestContext.clientId!,
          requestContext.fiscalYearId!,
          queryParams,
        );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(accounts);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGet(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    try {
      const generalLedgerAccountId = this.getRequiredString(
        "generalLedgerAccountId",
      );
      const queryParams = this.buildQueryParams();
      const account =
        await datevConnectClient.accounting.getGeneralLedgerAccount(
          this.context,
          requestContext.clientId!,
          requestContext.fiscalYearId!,
          generalLedgerAccountId,
          queryParams,
        );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(account);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGetUtilized(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    try {
      const queryParams = this.buildQueryParams();
      const accounts =
        await datevConnectClient.accounting.getUtilizedGeneralLedgerAccounts(
          this.context,
          requestContext.clientId!,
          requestContext.fiscalYearId!,
          queryParams,
        );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(accounts);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }
}
