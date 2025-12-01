import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import { fetchClientGroup } from "../../../src/services/orderManagementClient";
import type { AuthContext, ClientGroupOperation, SendSuccessFunction } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

export class ClientGroupResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      switch (operation as ClientGroupOperation) {
        case "get":
          await this.handleGet(authContext, sendSuccess);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for client groups.`,
            { itemIndex: this.itemIndex },
          );
      }
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGet(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const clientId = this.getRequiredString("clientId");

    const response = await fetchClientGroup({
      ...authContext,
      clientId,
    });

    sendSuccess(response);
  }
}
