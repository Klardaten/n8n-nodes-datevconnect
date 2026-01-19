import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import {
  type JsonValue,
  fetchAddressees,
  fetchAddressee,
  createAddressee,
  updateAddressee,
  fetchAddresseesDeletionLog,
} from "../../../src/services/datevConnectClient";
import type { AuthContext, AddresseeOperation } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

/**
 * Handler for all addressee-related operations
 */
export class AddresseeResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      let response: JsonValue | undefined;

      switch (operation as AddresseeOperation) {
        case "getAll":
          response = await this.handleGetAll(authContext);
          break;
        case "get":
          response = await this.handleGet(authContext);
          break;
        case "create":
          response = await this.handleCreate(authContext);
          break;
        case "update":
          response = await this.handleUpdate(authContext);
          break;
        case "getDeletionLog":
          response = await this.handleGetDeletionLog(authContext);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for resource "addressee".`,
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

    return await fetchAddressees({
      ...authContext,
      top,
      skip,
      select,
      filter,
    });
  }

  private async handleGet(authContext: AuthContext): Promise<JsonValue> {
    const addresseeId = this.getRequiredString("addresseeId");
    const select = this.getOptionalString("select");
    const expand = this.getOptionalString("expand");

    return await fetchAddressee({
      ...authContext,
      addresseeId,
      select,
      expand,
    });
  }

  private async handleCreate(
    authContext: AuthContext,
  ): Promise<JsonValue | undefined> {
    const rawAddressee = this.context.getNodeParameter(
      "addresseeData",
      this.itemIndex,
    );
    const addresseePayload = this.parseJsonParameter(
      rawAddressee,
      "Addressee Data",
    );
    const nationalRight = this.getOptionalString("nationalRight");

    return await createAddressee({
      ...authContext,
      addressee: addresseePayload,
      nationalRight,
    });
  }

  private async handleUpdate(
    authContext: AuthContext,
  ): Promise<JsonValue | undefined> {
    const addresseeId = this.getRequiredString("addresseeId");
    const rawAddressee = this.context.getNodeParameter(
      "addresseeData",
      this.itemIndex,
    );
    const addresseePayload = this.parseJsonParameter(
      rawAddressee,
      "Addressee Data",
    );

    return await updateAddressee({
      ...authContext,
      addresseeId,
      addressee: addresseePayload,
    });
  }

  private async handleGetDeletionLog(
    authContext: AuthContext,
  ): Promise<JsonValue> {
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);
    const select = this.getOptionalString("select");
    const filter = this.getOptionalString("filter");

    return await fetchAddresseesDeletionLog({
      ...authContext,
      top,
      skip,
      select,
      filter,
    });
  }
}
