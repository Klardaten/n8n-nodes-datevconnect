import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import type { JsonValue } from "../../../src/services/datevConnectClient";
import { datevConnectClient } from "../../../src/services/accountingClient";
import type { RequestContext, AccountsReceivableOperation } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

export class AccountsReceivableResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      let response: JsonValue | undefined;

      switch (operation as AccountsReceivableOperation) {
        case "getAll":
          response = await this.handleGetAll(requestContext);
          break;
        case "get":
          response = await this.handleGet(requestContext);
          break;
        case "getCondensed":
          response = await this.handleGetCondensed(requestContext);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for resource "accountsReceivable".`,
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
    const queryParams = this.buildQueryParams();
    const result = await datevConnectClient.accounting.getAccountsReceivable(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      queryParams,
    );
    return result ?? null;
  }

  private async handleGet(requestContext: RequestContext): Promise<JsonValue> {
    const accountsReceivableId = this.getRequiredString("accountsReceivableId");
    const queryParams = this.buildQueryParams();
    const result = await datevConnectClient.accounting.getAccountReceivable(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      accountsReceivableId,
      queryParams,
    );
    return result ?? null;
  }

  private async handleGetCondensed(
    requestContext: RequestContext,
  ): Promise<JsonValue> {
    const queryParams = this.buildQueryParams();
    const result =
      await datevConnectClient.accounting.getAccountsReceivableCondensed(
        this.context,
        requestContext.clientId!,
        requestContext.fiscalYearId!,
        queryParams,
      );
    return result ?? null;
  }
}
