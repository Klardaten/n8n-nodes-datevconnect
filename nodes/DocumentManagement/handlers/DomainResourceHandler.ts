import { NodeOperationError } from "n8n-workflow";
import { DocumentManagementClient } from "../../../src/services/documentManagementClient";
import type { AuthContext, SendSuccessFunction } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

/**
 * Handler for domain operations
 */
export class DomainResourceHandler extends BaseResourceHandler {
  protected async executeOperation(
    operation: string,
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    this.validateRequestContext(authContext);

    switch (operation) {
      case "getAll":
        await this.getDomains(authContext, sendSuccess);
        break;
      default:
        throw new NodeOperationError(
          this.context.getNode(),
          `The operation "${operation}" is not supported for domains`
        );
    }
  }

  private async getDomains(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const filter = this.getOptionalString("filter");

    const response = await DocumentManagementClient.fetchDomains({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
      filter,
    });

    sendSuccess(response);
  }
}