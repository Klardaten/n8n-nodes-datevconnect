import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import { fetchOrderManagementCostCenters } from "../../../src/services/orderManagementClient";
import type { AuthContext, CostCenterOperation, SendSuccessFunction } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

export class CostCenterResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      switch (operation as CostCenterOperation) {
        case "getAll":
          await this.handleGetAll(authContext, sendSuccess);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for cost centers.`,
            { itemIndex: this.itemIndex },
          );
      }
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGetAll(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const select = this.getOptionalString("select");
    const filter = this.getOptionalString("filter");
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);

    const response = await fetchOrderManagementCostCenters({
      ...authContext,
      select,
      filter,
      top: top || undefined,
      skip: skip || undefined,
    });

    sendSuccess(response);
  }
}
