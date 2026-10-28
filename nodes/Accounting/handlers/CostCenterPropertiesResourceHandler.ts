import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { RequestContext } from "../types";
import { NodeOperationError } from "n8n-workflow";
import { BaseResourceHandler } from "./BaseResourceHandler";
import { datevConnectClient } from "../../../src/services/accountingClient";

type CostCenterPropertiesOperation = "getAll" | "get" | "upsert";

/**
 * Handler for Cost Center Properties operations
 * Manages operations related to cost center property management
 */
export class CostCenterPropertiesResourceHandler extends BaseResourceHandler {
  constructor(context: IExecuteFunctions, itemIndex: number) {
    super(context, itemIndex);
  }

  async execute(
    operation: CostCenterPropertiesOperation,
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
      case "upsert":
        await this.handleUpsert(requestContext, returnData);
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
      const costSystemId = this.getRequiredString("costSystemId");
      const queryParams = this.buildQueryParams();
      const costCenterProperties =
        await datevConnectClient.accounting.getCostCenterProperties(
          this.context,
          requestContext.clientId!,
          requestContext.fiscalYearId!,
          costSystemId,
          queryParams,
        );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(costCenterProperties);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGet(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    try {
      const costSystemId = this.getRequiredString("costSystemId");
      const costCenterPropertyId = this.getRequiredString(
        "costCenterPropertyId",
      );
      const queryParams = this.buildQueryParams();
      const costCenterProperty =
        await datevConnectClient.accounting.getCostCenterProperty(
          this.context,
          requestContext.clientId!,
          requestContext.fiscalYearId!,
          costSystemId,
          costCenterPropertyId,
          queryParams,
        );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(costCenterProperty);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleUpsert(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    try {
      const costSystemId = this.getRequiredString("costSystemId");
      const costCenterPropertyId = this.getRequiredString(
        "costCenterPropertyId",
      );
      const data = this.parseJsonParameter(
        this.context.getNodeParameter("costCenterPropertyData", this.itemIndex),
        "costCenterPropertyData",
      );
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new NodeOperationError(
          this.context.getNode(),
          "Cost center property data must be a valid JSON object",
          { itemIndex: this.itemIndex },
        );
      }
      const result =
        await datevConnectClient.accounting.upsertCostCenterProperty(
          this.context,
          requestContext.clientId!,
          requestContext.fiscalYearId!,
          costSystemId,
          costCenterPropertyId,
          data,
        );
      this.createSendSuccess(returnData)(result);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }
}
