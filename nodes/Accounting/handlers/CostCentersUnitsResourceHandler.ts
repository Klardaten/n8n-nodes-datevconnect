import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { RequestContext } from "../types";
import { NodeOperationError } from "n8n-workflow";
import { BaseResourceHandler } from "./BaseResourceHandler";
import { datevConnectClient } from "../../../src/services/accountingClient";

type CostCentersUnitsOperation = "getAll" | "get";

/**
 * Handler for Cost Centers/Units operations
 * Manages operations related to cost center and cost unit management
 */
export class CostCentersUnitsResourceHandler extends BaseResourceHandler {
  constructor(context: IExecuteFunctions, itemIndex: number) {
    super(context, itemIndex);
  }

  async execute(
    operation: CostCentersUnitsOperation,
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
      const costCenters = await datevConnectClient.accounting.getCostCenters(
        this.context,
        requestContext.clientId!,
        requestContext.fiscalYearId!,
        costSystemId,
        queryParams,
      );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(costCenters);
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
      const costCenterId = this.getRequiredString("costCenterId");
      const queryParams = this.buildQueryParams();
      const costCenter = await datevConnectClient.accounting.getCostCenter(
        this.context,
        requestContext.clientId!,
        requestContext.fiscalYearId!,
        costSystemId,
        costCenterId,
        queryParams,
      );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(costCenter);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }
}
