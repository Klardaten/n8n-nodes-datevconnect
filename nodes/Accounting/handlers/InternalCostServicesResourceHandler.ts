import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { RequestContext } from "../types";
import { NodeOperationError } from "n8n-workflow";
import { BaseResourceHandler } from "./BaseResourceHandler";
import { datevConnectClient } from "../../../src/services/accountingClient";

type InternalCostServicesOperation = "create";

/**
 * Handler for Internal Cost Services operations
 * Manages operations related to internal cost service allocation records
 */
export class InternalCostServicesResourceHandler extends BaseResourceHandler {
  constructor(context: IExecuteFunctions, itemIndex: number) {
    super(context, itemIndex);
  }

  async execute(
    operation: InternalCostServicesOperation,
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    switch (operation) {
      case "create":
        await this.handleCreate(requestContext, returnData);
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

  private async handleCreate(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    try {
      const costSystemId = this.getRequiredString("costSystemId");
      const internalCostServiceDataRaw = this.context.getNodeParameter(
        "internalCostServiceData",
        this.itemIndex,
      );
      const internalCostServiceData = this.parseJsonParameter(
        internalCostServiceDataRaw,
        "internalCostServiceData",
      );

      const result =
        await datevConnectClient.accounting.createInternalCostService(
          this.context,
          requestContext.clientId!,
          requestContext.fiscalYearId!,
          costSystemId,
          internalCostServiceData,
        );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(result);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }
}
