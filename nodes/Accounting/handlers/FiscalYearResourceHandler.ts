import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import type { JsonValue } from "../../../src/services/datevConnectClient";
import { datevConnectClient } from "../../../src/services/accountingClient";
import type { RequestContext, FiscalYearOperation } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

export class FiscalYearResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      let response: JsonValue | undefined;

      switch (operation as FiscalYearOperation) {
        case "getAll":
          response = await this.handleGetAll(requestContext);
          break;
        case "get":
          response = await this.handleGet(requestContext);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for resource "fiscalYear".`,
            { itemIndex: this.itemIndex },
          );
      }

      sendSuccess(response);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGetAll(
    requestContext: RequestContext,
  ): Promise<JsonValue> {
    if (!requestContext.clientId) {
      throw new NodeOperationError(
        this.context.getNode(),
        "Client ID is required for this operation",
        {
          itemIndex: this.itemIndex,
        },
      );
    }

    const queryParams = this.buildQueryParams();
    const result = await datevConnectClient.accounting.getFiscalYears(
      this.context,
      requestContext.clientId,
      queryParams,
    );
    return result ?? null;
  }

  private async handleGet(requestContext: RequestContext): Promise<JsonValue> {
    if (!requestContext.clientId || !requestContext.fiscalYearId) {
      throw new NodeOperationError(
        this.context.getNode(),
        "Client ID and Fiscal Year ID are required for this operation",
        {
          itemIndex: this.itemIndex,
        },
      );
    }

    const queryParams = this.buildQueryParams();
    const result = await datevConnectClient.accounting.getFiscalYear(
      this.context,
      requestContext.clientId,
      requestContext.fiscalYearId,
      queryParams,
    );
    return result ?? null;
  }
}
