import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import { type JsonValue, fetchAreaOfResponsibilities } from "../../../src/services/datevConnectClient";
import type { AuthContext, AreaOfResponsibilityOperation } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

/**
 * Handler for all area of responsibility-related operations
 */
export class AreaOfResponsibilityResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      let response: JsonValue | undefined;

      switch (operation as AreaOfResponsibilityOperation) {
        case "getAll":
          response = await this.handleGetAll(authContext);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for resource "areaOfResponsibility".`,
            { itemIndex: this.itemIndex },
          );
      }

      sendSuccess(response);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGetAll(authContext: AuthContext): Promise<JsonValue> {
    const select = this.getOptionalString("select");
    const filter = this.getOptionalString("filter");

    return await fetchAreaOfResponsibilities({
      ...authContext,
      select,
      filter,
    });
  }
}