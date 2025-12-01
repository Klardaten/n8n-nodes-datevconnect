import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import { fetchOrderTypes } from "../../../src/services/orderManagementClient";
import type { AuthContext, OrderTypeOperation, SendSuccessFunction } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

export class OrderTypeResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      switch (operation as OrderTypeOperation) {
        case "getAll":
          await this.handleGetAll(authContext, sendSuccess);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for order types.`,
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
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);

    const response = await fetchOrderTypes({
      ...authContext,
      top: top || undefined,
      skip: skip || undefined,
    });

    sendSuccess(response);
  }
}
