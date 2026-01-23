import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import {
  type JsonValue,
  fetchCountryCodes,
} from "../../../src/services/datevConnectClient";
import type { AuthContext, CountryCodeOperation } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

/**
 * Handler for all country code-related operations
 */
export class CountryCodeResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      let response: JsonValue | undefined;

      switch (operation as CountryCodeOperation) {
        case "getAll":
          response = await this.handleGetAll(authContext);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for resource "countryCode".`,
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
    const filter = this.getOptionalString("filter");

    return await fetchCountryCodes({
      ...authContext,
      top,
      skip,
      select,
      filter,
    });
  }
}
