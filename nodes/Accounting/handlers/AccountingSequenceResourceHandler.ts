import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import type { JsonValue } from "../../../src/services/datevConnectClient";
import { datevConnectClient } from "../../../src/services/accountingClient";
import type { RequestContext, AccountingSequenceOperation } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

/**
 * Handler for all accounting sequence-related operations
 */
export class AccountingSequenceResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      let response: JsonValue | undefined;

      switch (operation as AccountingSequenceOperation) {
        case "create":
          response = await this.handleCreate(requestContext);
          break;
        case "getAll":
          response = await this.handleGetAll(requestContext);
          break;
        case "get":
          response = await this.handleGet(requestContext);
          break;
        case "getAccountingRecords":
          response = await this.handleGetAccountingRecords(requestContext);
          break;
        case "getAccountingRecord":
          response = await this.handleGetAccountingRecord(requestContext);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for resource "accountingSequence".`,
            { itemIndex: this.itemIndex },
          );
      }

      sendSuccess(response);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleCreate(
    requestContext: RequestContext,
  ): Promise<JsonValue> {
    const accountingSequenceData = this.getRequiredString(
      "accountingSequenceData",
    );
    const data = this.parseJsonParameter(
      accountingSequenceData,
      "accountingSequenceData",
    );

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new NodeOperationError(
        this.context.getNode(),
        "Accounting sequence data must be a valid JSON object",
        { itemIndex: this.itemIndex },
      );
    }

    const result = await datevConnectClient.accounting.createAccountingSequence(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      data,
    );

    return result ?? null;
  }

  private async handleGetAll(
    requestContext: RequestContext,
  ): Promise<JsonValue> {
    const result = await datevConnectClient.accounting.getAccountingSequences(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
    );

    return result ?? null;
  }

  private async handleGet(requestContext: RequestContext): Promise<JsonValue> {
    const accountingSequenceId = this.getRequiredString("accountingSequenceId");

    const result = await datevConnectClient.accounting.getAccountingSequence(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      accountingSequenceId,
    );

    return result ?? null;
  }

  private async handleGetAccountingRecords(
    requestContext: RequestContext,
  ): Promise<JsonValue> {
    const accountingSequenceId = this.getRequiredString("accountingSequenceId");
    const queryParams = this.buildQueryParams();

    const result = await datevConnectClient.accounting.getAccountingRecords(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      accountingSequenceId,
      queryParams,
    );

    return result ?? null;
  }

  private async handleGetAccountingRecord(
    requestContext: RequestContext,
  ): Promise<JsonValue> {
    const accountingSequenceId = this.getRequiredString("accountingSequenceId");
    const accountingRecordId = this.getRequiredString("accountingRecordId");
    const queryParams = this.buildQueryParams();

    const result = await datevConnectClient.accounting.getAccountingRecord(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      accountingSequenceId,
      accountingRecordId,
      queryParams,
    );

    return result ?? null;
  }
}
