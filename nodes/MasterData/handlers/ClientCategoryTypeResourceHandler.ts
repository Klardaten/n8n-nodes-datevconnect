import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import {
  type JsonValue,
  fetchClientCategoryTypes,
  fetchClientCategoryType,
  createClientCategoryType,
  updateClientCategoryType,
} from "../../../src/services/datevConnectClient";
import type { AuthContext, ClientCategoryTypeOperation } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

/**
 * Handler for all client category type-related operations
 */
export class ClientCategoryTypeResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      let response: JsonValue | undefined;

      switch (operation as ClientCategoryTypeOperation) {
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
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for resource "clientCategoryType".`,
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

    return await fetchClientCategoryTypes({
      ...authContext,
      select,
      filter,
    });
  }

  private async handleGet(authContext: AuthContext): Promise<JsonValue> {
    const clientCategoryTypeId = this.getRequiredString("clientCategoryTypeId");
    const select = this.getOptionalString("select");

    return await fetchClientCategoryType({
      ...authContext,
      clientCategoryTypeId,
      select,
    });
  }

  private async handleCreate(authContext: AuthContext): Promise<JsonValue | undefined> {
    const rawClientCategoryType = this.context.getNodeParameter("clientCategoryTypeData", this.itemIndex);
    const clientCategoryTypePayload = this.parseJsonParameter(rawClientCategoryType, "Client Category Type Data");

    return await createClientCategoryType({
      ...authContext,
      clientCategoryType: clientCategoryTypePayload,
    });
  }

  private async handleUpdate(authContext: AuthContext): Promise<JsonValue | undefined> {
    const clientCategoryTypeId = this.getRequiredString("clientCategoryTypeId");
    const rawClientCategoryType = this.context.getNodeParameter("clientCategoryTypeData", this.itemIndex);
    const clientCategoryTypePayload = this.parseJsonParameter(rawClientCategoryType, "Client Category Type Data");

    return await updateClientCategoryType({
      ...authContext,
      clientCategoryTypeId,
      clientCategoryType: clientCategoryTypePayload,
    });
  }
}