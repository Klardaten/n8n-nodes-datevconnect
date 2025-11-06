import { NodeOperationError } from "n8n-workflow";
import { DocumentManagementClient } from "../../../src/services/documentManagementClient";
import type { AuthContext, SendSuccessFunction } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

/**
 * Handler for info operations
 */
export class InfoResourceHandler extends BaseResourceHandler {
  protected async executeOperation(
    operation: string,
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    this.validateRequestContext(authContext);

    switch (operation) {
      case "get":
        await this.getInfo(authContext, sendSuccess);
        break;
      default:
        throw new NodeOperationError(
          this.context.getNode(),
          `The operation "${operation}" is not supported for info`
        );
    }
  }

  private async getInfo(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const response = await DocumentManagementClient.fetchInfo({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
    });

    sendSuccess(response);
  }
}