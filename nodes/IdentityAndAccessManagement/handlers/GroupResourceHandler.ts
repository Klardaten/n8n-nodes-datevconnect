import { NodeOperationError } from "n8n-workflow";
import { IdentityAndAccessManagementClient } from "../../../src/services/identityAndAccessManagementClient";
import type { AuthContext, SendSuccessFunction } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

export class GroupResourceHandler extends BaseResourceHandler {
  protected async executeOperation(
    operation: string,
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    this.validateRequestContext(authContext);

    switch (operation) {
      case "getAll": {
        const response =
          await IdentityAndAccessManagementClient.fetchGroups(authContext);
        sendSuccess(response);
        return;
      }
      case "get": {
        const groupId = this.getRequiredString("groupId");
        const response = await IdentityAndAccessManagementClient.fetchGroup({
          ...authContext,
          groupId,
        });
        sendSuccess(response);
        return;
      }
      case "create": {
        const groupData = this.getRequiredJsonData("groupData");
        const response = await IdentityAndAccessManagementClient.createGroup({
          ...authContext,
          group: groupData,
        });
        sendSuccess(response);
        return;
      }
      case "update": {
        const groupId = this.getRequiredString("groupId");
        const groupData = this.getRequiredJsonData("groupData");
        const response = await IdentityAndAccessManagementClient.updateGroup({
          ...authContext,
          groupId,
          group: groupData,
        });
        sendSuccess(response);
        return;
      }
      case "delete": {
        const groupId = this.getRequiredString("groupId");
        const result = await IdentityAndAccessManagementClient.deleteGroup({
          ...authContext,
          groupId,
        });
        sendSuccess({
          groupId,
          deleted: true,
          ...(result.location ? { location: result.location } : {}),
        });
        return;
      }
      default:
        throw new NodeOperationError(
          this.context.getNode(),
          `The operation "${operation}" is not supported for group.`,
          { itemIndex: this.itemIndex },
        );
    }
  }
}
