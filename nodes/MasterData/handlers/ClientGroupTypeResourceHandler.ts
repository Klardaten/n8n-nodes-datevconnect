import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import {
  type JsonValue,
  fetchClientGroupTypes,
  fetchClientGroupType,
  createClientGroupType,
  updateClientGroupType,
} from "../../../src/services/datevConnectClient";
import type { AuthContext, ClientGroupTypeOperation } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

/**
 * Handler for all client group type-related operations
 */
export class ClientGroupTypeResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      let response: JsonValue | undefined;

      switch (operation as ClientGroupTypeOperation) {
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
            `The operation "${operation}" is not supported for resource "clientGroupType".`,
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

    return await fetchClientGroupTypes({
      ...authContext,
      select,
      filter,
    });
  }

  private async handleGet(authContext: AuthContext): Promise<JsonValue> {
    const clientGroupTypeId = this.getRequiredString("clientGroupTypeId");
    const select = this.getOptionalString("select");

    return await fetchClientGroupType({
      ...authContext,
      clientGroupTypeId,
      select,
    });
  }

  private async handleCreate(authContext: AuthContext): Promise<JsonValue | undefined> {
    const rawClientGroupType = this.context.getNodeParameter("clientGroupTypeData", this.itemIndex);
    const clientGroupTypePayload = this.parseJsonParameter(rawClientGroupType, "Client Group Type Data");

    return await createClientGroupType({
      ...authContext,
      clientGroupType: clientGroupTypePayload,
    });
  }

  private async handleUpdate(authContext: AuthContext): Promise<JsonValue | undefined> {
    const clientGroupTypeId = this.getRequiredString("clientGroupTypeId");
    const rawClientGroupType = this.context.getNodeParameter("clientGroupTypeData", this.itemIndex);
    const clientGroupTypePayload = this.parseJsonParameter(rawClientGroupType, "Client Group Type Data");

    return await updateClientGroupType({
      ...authContext,
      clientGroupTypeId,
      clientGroupType: clientGroupTypePayload,
    });
  }
}