import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import type { JsonValue } from "../../../src/services/datevConnectClient";
import { datevConnectClient } from "../../../src/services/accountingClient";
import type { RequestContext, StocktakingDataOperation } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

/**
 * Handler for Stocktaking Data operations
 * Manages operations related to inventory/stocktaking data in asset accounting
 */
export class StocktakingDataResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      let response: JsonValue | undefined;

      switch (operation as StocktakingDataOperation) {
        case "getAll":
          response = await this.handleGetAll(requestContext);
          break;
        case "get":
          response = await this.handleGet(requestContext);
          break;
        case "update":
          response = await this.handleUpdate(requestContext);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for resource "stocktakingData".`,
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
    const result = await datevConnectClient.accounting.getStocktakingData(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      queryParams,
    );
    return result ?? null;
  }

  private async handleGet(requestContext: RequestContext): Promise<JsonValue> {
    const assetId = this.getRequiredString("assetId");
    const queryParams = this.buildQueryParams();
    const result =
      await datevConnectClient.accounting.getStocktakingDataByAsset(
        this.context,
        requestContext.clientId!,
        requestContext.fiscalYearId!,
        assetId,
        queryParams,
      );
    return result ?? null;
  }

  private async handleUpdate(
    requestContext: RequestContext,
  ): Promise<JsonValue> {
    const assetId = this.getRequiredString("assetId");
    const stocktakingData = this.getRequiredString("stocktakingData");
    const data = this.parseJsonParameter(stocktakingData, "stocktakingData");

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new NodeOperationError(
        this.context.getNode(),
        "Stocktaking data must be a valid JSON object",
        { itemIndex: this.itemIndex },
      );
    }

    const result = await datevConnectClient.accounting.updateStocktakingData(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      assetId,
      data,
    );
    return result ?? null;
  }
}
