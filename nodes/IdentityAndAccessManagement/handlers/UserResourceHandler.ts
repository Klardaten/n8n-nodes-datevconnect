import { NodeOperationError } from "n8n-workflow";
import { IdentityAndAccessManagementClient } from "../../../src/services/identityAndAccessManagementClient";
import type { AuthContext, SendSuccessFunction } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

export class UserResourceHandler extends BaseResourceHandler {
  protected async executeOperation(
    operation: string,
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    this.validateRequestContext(authContext);

    switch (operation) {
      case "getAll": {
        const filter = this.getOptionalString("filter");
        const attributes = this.getOptionalString("attributes");
        const startIndex = this.getNumberParameter("startIndex", 1);
        const count = this.getNumberParameter("count", 100);

        const response = await IdentityAndAccessManagementClient.fetchUsers({
          ...authContext,
          filter,
          attributes,
          startIndex,
          count,
        });
        sendSuccess(response);
        return;
      }
      case "get": {
        const userId = this.getRequiredString("userId");
        const response = await IdentityAndAccessManagementClient.fetchUser({
          ...authContext,
          userId,
        });
        sendSuccess(response);
        return;
      }
      case "create": {
        const userData = this.getRequiredJsonData("userData");
        const response = await IdentityAndAccessManagementClient.createUser({
          ...authContext,
          user: userData,
        });
        sendSuccess(response);
        return;
      }
      case "update": {
        const userId = this.getRequiredString("userId");
        const userData = this.getRequiredJsonData("userData");
        const response = await IdentityAndAccessManagementClient.updateUser({
          ...authContext,
          userId,
          user: userData,
        });
        sendSuccess(response);
        return;
      }
      case "delete": {
        const userId = this.getRequiredString("userId");
        const result = await IdentityAndAccessManagementClient.deleteUser({
          ...authContext,
          userId,
        });
        sendSuccess({
          userId,
          deleted: true,
          ...(result.location ? { location: result.location } : {}),
        });
        return;
      }
      default:
        throw new NodeOperationError(
          this.context.getNode(),
          `The operation "${operation}" is not supported for user.`,
          { itemIndex: this.itemIndex },
        );
    }
  }
}
