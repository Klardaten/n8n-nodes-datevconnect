import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import { type JsonValue, fetchBanks } from "../../../src/services/datevConnectClient";
import type { AuthContext, BankOperation } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

/**
 * Handler for all bank-related operations
 */
export class BankResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      let response: JsonValue | undefined;

      switch (operation as BankOperation) {
        case "getAll":
          response = await this.handleGetAll(authContext);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for resource "bank".`,
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

    return await fetchBanks({
      ...authContext,
      select,
      filter,
    });
  }
}