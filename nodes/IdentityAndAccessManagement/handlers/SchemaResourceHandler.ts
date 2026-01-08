import { NodeOperationError } from "n8n-workflow";
import { IdentityAndAccessManagementClient } from "../../../src/services/identityAndAccessManagementClient";
import type { AuthContext, SendSuccessFunction } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

export class SchemaResourceHandler extends BaseResourceHandler {
  protected async executeOperation(
    operation: string,
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    this.validateRequestContext(authContext);

    switch (operation) {
      case "getAll": {
        const response =
          await IdentityAndAccessManagementClient.fetchSchemas(authContext);
        sendSuccess(response);
        return;
      }
      case "get": {
        const schemaId = this.getRequiredString("schemaId");
        const response = await IdentityAndAccessManagementClient.fetchSchema({
          ...authContext,
          schemaId,
        });
        sendSuccess(response);
        return;
      }
      default:
        throw new NodeOperationError(
          this.context.getNode(),
          `The operation "${operation}" is not supported for schema.`,
          { itemIndex: this.itemIndex },
        );
    }
  }
}
