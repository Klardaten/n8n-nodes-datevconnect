import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { RequestContext } from "../types";
import { NodeOperationError } from "n8n-workflow";
import { BaseResourceHandler } from "./BaseResourceHandler";
import { datevConnectClient } from "../../../src/services/accountingClient";

type AccountingSumsAndBalancesOperation = "getAll" | "get";


/**
 * Handler for Accounting Sums and Balances operations
 * Manages operations related to accounting balance sheet and P&L data
 */
export class AccountingSumsAndBalancesResourceHandler extends BaseResourceHandler {
  constructor(context: IExecuteFunctions, itemIndex: number) {
    super(context, itemIndex);
  }

  async execute(
    operation: AccountingSumsAndBalancesOperation,
    requestContext: RequestContext,
    returnData: INodeExecutionData[]
  ): Promise<void> {
    switch (operation) {
      case "getAll":
        await this.handleGetAll(requestContext, returnData);
        break;
      case "get":
        await this.handleGet(requestContext, returnData);
        break;
      default:
        throw new NodeOperationError(this.context.getNode(), `Unknown operation: ${operation}`, {
          itemIndex: this.itemIndex,
        });
    }
  }

  private async handleGetAll(requestContext: RequestContext, returnData: INodeExecutionData[]): Promise<void> {
    try {
      const queryParams = this.buildQueryParams();
      const sumsAndBalances = await datevConnectClient.accounting.getAccountingSumsAndBalances(
        this.context,
        requestContext.clientId!,
        requestContext.fiscalYearId!,
        queryParams
      );
      
      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(sumsAndBalances);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGet(requestContext: RequestContext, returnData: INodeExecutionData[]): Promise<void> {
    try {
      const accountingSumsAndBalancesId = this.getRequiredString("accountingSumsAndBalancesId");
      const sumsAndBalances = await datevConnectClient.accounting.getAccountingSumsAndBalance(
        this.context,
        requestContext.clientId!,
        requestContext.fiscalYearId!,
        accountingSumsAndBalancesId,
      );
      
      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(sumsAndBalances);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }
}
