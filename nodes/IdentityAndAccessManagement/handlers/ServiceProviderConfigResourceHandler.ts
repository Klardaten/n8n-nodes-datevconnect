import { NodeOperationError } from "n8n-workflow";
import { IdentityAndAccessManagementClient } from "../../../src/services/identityAndAccessManagementClient";
import type { AuthContext, SendSuccessFunction } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

export class ServiceProviderConfigResourceHandler extends BaseResourceHandler {
  protected async executeOperation(
    operation: string,
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    this.validateRequestContext(authContext);

    if (operation !== "get") {
      throw new NodeOperationError(
        this.context.getNode(),
        `The operation "${operation}" is not supported for serviceProviderConfig.`,
        { itemIndex: this.itemIndex },
      );
    }

    const response =
      await IdentityAndAccessManagementClient.fetchServiceProviderConfig(
        authContext,
      );
    sendSuccess(response);
  }
}
