import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import { fetchSelfClients } from "../../../src/services/orderManagementClient";
import type {
  AuthContext,
  SendSuccessFunction,
  SelfClientOperation,
} from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

export class SelfClientResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      switch (operation as SelfClientOperation) {
        case "getAll":
          await this.handleGetAll(authContext, sendSuccess);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for self clients.`,
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
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);

    const response = await fetchSelfClients({
      ...authContext,
      select,
      top: top || undefined,
      skip: skip || undefined,
    });

    sendSuccess(response);
  }
}
