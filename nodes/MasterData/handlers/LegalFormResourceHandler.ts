import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import {
  type JsonValue,
  fetchLegalForms,
} from "../../../src/services/datevConnectClient";
import type { AuthContext, LegalFormOperation } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

/**
 * Handler for all legal form-related operations
 */
export class LegalFormResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      let response: JsonValue | undefined;

      switch (operation as LegalFormOperation) {
        case "getAll":
          response = await this.handleGetAll(authContext);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for resource "legalForm".`,
            { itemIndex: this.itemIndex },
          );
      }

      sendSuccess(response);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGetAll(authContext: AuthContext): Promise<JsonValue> {
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);
    const select = this.getOptionalString("select");
    const nationalRight = this.getOptionalString("nationalRight");

    return await fetchLegalForms({
      ...authContext,
      top,
      skip,
      select,
      nationalRight,
    });
  }
}
