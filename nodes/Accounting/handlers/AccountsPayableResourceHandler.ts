import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { RequestContext } from "../types";
import { NodeOperationError } from "n8n-workflow";
import { BaseResourceHandler } from "./BaseResourceHandler";
import { datevConnectClient } from "../../../src/services/accountingClient";

type AccountsPayableOperation = "getAll" | "get" | "getCondensed";

/**
 * Handler for Accounts Payable operations
 * Manages operations related to accounts payable (open items on the payable side)
 */
export class AccountsPayableResourceHandler extends BaseResourceHandler {
  constructor(context: IExecuteFunctions, itemIndex: number) {
    super(context, itemIndex);
  }

  async execute(
    operation: AccountsPayableOperation,
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
      case "getCondensed":
        await this.handleGetCondensed(requestContext, returnData);
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
      const accountsPayable =
        await datevConnectClient.accounting.getAccountsPayable(
          this.context,
          requestContext.clientId!,
          requestContext.fiscalYearId!,
          queryParams,
        );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(accountsPayable);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGet(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    try {
      const accountsPayableId = this.getRequiredString("accountsPayableId");
      const queryParams = this.buildQueryParams();
      const accountPayable =
        await datevConnectClient.accounting.getAccountPayable(
          this.context,
          requestContext.clientId!,
          requestContext.fiscalYearId!,
          accountsPayableId,
          queryParams,
        );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(accountPayable);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGetCondensed(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    try {
      const queryParams = this.buildQueryParams();
      const condensedAccountsPayable =
        await datevConnectClient.accounting.getAccountsPayableCondensed(
          this.context,
          requestContext.clientId!,
          requestContext.fiscalYearId!,
          queryParams,
        );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(condensedAccountsPayable);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }
}
