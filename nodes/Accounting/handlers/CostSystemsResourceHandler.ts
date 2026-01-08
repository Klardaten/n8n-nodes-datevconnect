import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { RequestContext } from "../types";
import { NodeOperationError } from "n8n-workflow";
import { BaseResourceHandler } from "./BaseResourceHandler";
import { datevConnectClient } from "../../../src/services/accountingClient";

type CostSystemsOperation = "getAll" | "get";

/**
 * Handler for Cost Systems operations
 * Manages operations related to cost accounting system configurations
 */
export class CostSystemsResourceHandler extends BaseResourceHandler {
  constructor(context: IExecuteFunctions, itemIndex: number) {
    super(context, itemIndex);
  }

  async execute(
    operation: CostSystemsOperation,
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
      this.validateRequiredParameters(requestContext);

      const queryParams = this.buildQueryParams();
      const costSystems = await datevConnectClient.accounting.getCostSystems(
        this.context,
        requestContext.clientId!,
        requestContext.fiscalYearId!,
        queryParams,
      );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(costSystems);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGet(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    try {
      this.validateRequiredParameters(requestContext);

      const costSystemId = this.getRequiredString("costSystemId");
      const queryParams = this.buildQueryParams();
      const costSystem = await datevConnectClient.accounting.getCostSystem(
        this.context,
        requestContext.clientId!,
        requestContext.fiscalYearId!,
        costSystemId,
        queryParams,
      );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(costSystem);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private validateRequiredParameters(requestContext: RequestContext): void {
    if (!requestContext.clientId || !requestContext.fiscalYearId) {
      throw new NodeOperationError(
        this.context.getNode(),
        "Client ID and Fiscal Year ID are required for this operation",
        {
          itemIndex: this.itemIndex,
        },
      );
    }
  }
}
