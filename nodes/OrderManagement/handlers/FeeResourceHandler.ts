import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import {
  fetchFeePlans,
  fetchFees,
} from "../../../src/services/orderManagementClient";
import type { AuthContext, FeeOperation, SendSuccessFunction } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

export class FeeResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      switch (operation as FeeOperation) {
        case "getFees":
          await this.handleGetFees(authContext, sendSuccess);
          break;
        case "getFeePlans":
          await this.handleGetFeePlans(authContext, sendSuccess);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for fees.`,
            { itemIndex: this.itemIndex },
          );
      }
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGetFees(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const select = this.getOptionalString("select");
    const filter = this.getOptionalString("filter");
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);

    const response = await fetchFees({
      ...authContext,
      select,
      filter,
      top: top || undefined,
      skip: skip || undefined,
    });

    sendSuccess(response);
  }

  private async handleGetFeePlans(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const select = this.getOptionalString("select");
    const filter = this.getOptionalString("filter");
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);

    const response = await fetchFeePlans({
      ...authContext,
      select,
      filter,
      top: top || undefined,
      skip: skip || undefined,
    });

    sendSuccess(response);
  }
}
