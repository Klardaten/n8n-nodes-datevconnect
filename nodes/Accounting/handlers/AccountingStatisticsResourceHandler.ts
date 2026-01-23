import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { RequestContext } from "../types";
import { NodeOperationError } from "n8n-workflow";
import { BaseResourceHandler } from "./BaseResourceHandler";
import { datevConnectClient } from "../../../src/services/accountingClient";

type AccountingStatisticsOperation = "getAll";

/**
 * Handler for Accounting Statistics operations
 * Manages operations related to accounting statistics data
 */
export class AccountingStatisticsResourceHandler extends BaseResourceHandler {
  constructor(context: IExecuteFunctions, itemIndex: number) {
    super(context, itemIndex);
  }

  async execute(
    operation: AccountingStatisticsOperation,
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    switch (operation) {
      case "getAll":
        await this.handleGetAll(requestContext, returnData);
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
      const accountingStatistics =
        await datevConnectClient.accounting.getAccountingStatistics(
          this.context,
          requestContext.clientId!,
          requestContext.fiscalYearId!,
          queryParams,
        );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(accountingStatistics);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }
}
