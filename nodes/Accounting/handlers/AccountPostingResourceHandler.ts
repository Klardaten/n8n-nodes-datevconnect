import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import type { JsonValue } from "../../../src/services/datevConnectClient";
import { datevConnectClient } from "../../../src/services/accountingClient";
import type { RequestContext, AccountPostingOperation } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

export class AccountPostingResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      let response: JsonValue | undefined;

      switch (operation as AccountPostingOperation) {
        case "getAll":
          response = await this.handleGetAll(requestContext);
          break;
        case "get":
          response = await this.handleGet(requestContext);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for resource "accountPosting".`,
            { itemIndex: this.itemIndex },
          );
      }

      sendSuccess(response);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGetAll(requestContext: RequestContext): Promise<JsonValue> {
    const queryParams = this.buildQueryParams();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { top: _top, skip: _skip, ...filteredParams } = queryParams;
    const result = await datevConnectClient.accounting.getAccountPostings(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      filteredParams
    );
    return result ?? null;
  }

  private async handleGet(requestContext: RequestContext): Promise<JsonValue> {
    const accountPostingId = this.getRequiredString("accountPostingId");
    const queryParams = this.buildQueryParams();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { top: _top, skip: _skip, filter: _filter, ...filteredParams } = queryParams;
    const result = await datevConnectClient.accounting.getAccountPosting(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      accountPostingId,
      filteredParams
    );
    return result ?? null;
  }
}