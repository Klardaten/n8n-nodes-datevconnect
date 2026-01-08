import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import type { JsonValue } from "../../../src/services/datevConnectClient";
import { datevConnectClient } from "../../../src/services/accountingClient";
import type { RequestContext, VariousAddressOperation } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

/**
 * Handler for Various Addresses operations
 * Manages operations related to address management for various business partners
 */
export class VariousAddressesResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      let response: JsonValue | undefined;

      switch (operation as VariousAddressOperation) {
        case "getAll":
          response = await this.handleGetAll(requestContext);
          break;
        case "get":
          response = await this.handleGet(requestContext);
          break;
        case "create":
          response = await this.handleCreate(requestContext);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for resource "variousAddresses".`,
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
    const result = await datevConnectClient.accounting.getVariousAddresses(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      queryParams,
    );
    return result ?? null;
  }

  private async handleGet(requestContext: RequestContext): Promise<JsonValue> {
    const variousAddressId = this.getRequiredString("variousAddressId");
    const queryParams = this.buildQueryParams();
    const result = await datevConnectClient.accounting.getVariousAddress(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      variousAddressId,
      queryParams,
    );
    return result ?? null;
  }

  private async handleCreate(
    requestContext: RequestContext,
  ): Promise<JsonValue> {
    const variousAddressData = this.getRequiredString("variousAddressData");
    const data = this.parseJsonParameter(
      variousAddressData,
      "variousAddressData",
    );

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new NodeOperationError(
        this.context.getNode(),
        "Various address data must be a valid JSON object",
        { itemIndex: this.itemIndex },
      );
    }

    const result = await datevConnectClient.accounting.createVariousAddress(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      data,
    );
    return result ?? null;
  }
}
