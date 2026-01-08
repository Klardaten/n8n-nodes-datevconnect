import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import type { JsonValue } from "../../../src/services/datevConnectClient";
import { datevConnectClient } from "../../../src/services/accountingClient";
import type { RequestContext, TermsOfPaymentOperation } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

/**
 * Handler for Terms of Payment operations
 * Manages operations related to payment terms configurations and settings
 */
export class TermsOfPaymentResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      let response: JsonValue | undefined;

      switch (operation as TermsOfPaymentOperation) {
        case "getAll":
          response = await this.handleGetAll(requestContext);
          break;
        case "get":
          response = await this.handleGet(requestContext);
          break;
        case "create":
          response = await this.handleCreate(requestContext);
          break;
        case "update":
          response = await this.handleUpdate(requestContext);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for resource "termsOfPayment".`,
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
    const result = await datevConnectClient.accounting.getTermsOfPayment(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      queryParams,
    );
    return result ?? null;
  }

  private async handleGet(requestContext: RequestContext): Promise<JsonValue> {
    const termOfPaymentId = this.getRequiredString("termOfPaymentId");
    const queryParams = this.buildQueryParams();
    const result = await datevConnectClient.accounting.getTermOfPayment(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      termOfPaymentId,
      queryParams,
    );
    return result ?? null;
  }

  private async handleCreate(
    requestContext: RequestContext,
  ): Promise<JsonValue> {
    const termOfPaymentData = this.getRequiredString("termOfPaymentData");
    const data = this.parseJsonParameter(
      termOfPaymentData,
      "termOfPaymentData",
    );

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new NodeOperationError(
        this.context.getNode(),
        "Term of payment data must be a valid JSON object",
        { itemIndex: this.itemIndex },
      );
    }

    const result = await datevConnectClient.accounting.createTermOfPayment(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      data,
    );
    return result ?? null;
  }

  private async handleUpdate(
    requestContext: RequestContext,
  ): Promise<JsonValue> {
    const termOfPaymentId = this.getRequiredString("termOfPaymentId");
    const termOfPaymentData = this.getRequiredString("termOfPaymentData");
    const data = this.parseJsonParameter(
      termOfPaymentData,
      "termOfPaymentData",
    );

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new NodeOperationError(
        this.context.getNode(),
        "Term of payment data must be a valid JSON object",
        { itemIndex: this.itemIndex },
      );
    }

    const result = await datevConnectClient.accounting.updateTermOfPayment(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      termOfPaymentId,
      data,
    );
    return result ?? null;
  }
}
