import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import {
  type JsonValue,
  fetchClients,
  fetchClient,
  createClient,
  updateClient,
  fetchClientResponsibilities,
  updateClientResponsibilities,
  fetchClientCategories,
  updateClientCategories,
  fetchClientGroups,
  updateClientGroups,
  fetchClientDeletionLog,
  fetchNextFreeClientNumber,
} from "../../../src/services/datevConnectClient";
import type { AuthContext, ClientOperation } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

/**
 * Handler for all client-related operations
 */
export class ClientResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      let response: JsonValue | undefined;

      switch (operation as ClientOperation) {
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
        case "getResponsibilities":
          response = await this.handleGetResponsibilities(authContext);
          break;
        case "updateResponsibilities":
          response = await this.handleUpdateResponsibilities(authContext);
          break;
        case "getClientCategories":
          response = await this.handleGetClientCategories(authContext);
          break;
        case "updateClientCategories":
          response = await this.handleUpdateClientCategories(authContext);
          break;
        case "getClientGroups":
          response = await this.handleGetClientGroups(authContext);
          break;
        case "updateClientGroups":
          response = await this.handleUpdateClientGroups(authContext);
          break;
        case "getDeletionLog":
          response = await this.handleGetDeletionLog(authContext);
          break;
        case "getNextFreeNumber":
          response = await this.handleGetNextFreeNumber(authContext);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for resource "client".`,
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

    return await fetchClients({
      ...authContext,
      top,
      skip,
      select,
      filter,
    });
  }

  private async handleGet(authContext: AuthContext): Promise<JsonValue> {
    const clientId = this.getRequiredString("clientId");
    const select = this.getOptionalString("select");

    return await fetchClient({
      ...authContext,
      clientId,
      select,
    });
  }

  private async handleCreate(
    authContext: AuthContext,
  ): Promise<JsonValue | undefined> {
    const rawClient = this.context.getNodeParameter(
      "clientData",
      this.itemIndex,
    );
    const clientPayload = this.parseJsonParameter(rawClient, "Client Data");
    const maxNumber = this.getNumberParameter("maxNumber", 0);

    return await createClient({
      ...authContext,
      client: clientPayload,
      maxNumber:
        typeof maxNumber === "number" && maxNumber > 0 ? maxNumber : undefined,
    });
  }

  private async handleUpdate(
    authContext: AuthContext,
  ): Promise<JsonValue | undefined> {
    const clientId = this.getRequiredString("clientId");
    const rawClient = this.context.getNodeParameter(
      "clientData",
      this.itemIndex,
    );
    const clientPayload = this.parseJsonParameter(rawClient, "Client Data");

    return await updateClient({
      ...authContext,
      clientId,
      client: clientPayload,
    });
  }

  private async handleGetResponsibilities(
    authContext: AuthContext,
  ): Promise<JsonValue> {
    const clientId = this.getRequiredString("clientId");
    const select = this.getOptionalString("select");

    return await fetchClientResponsibilities({
      ...authContext,
      clientId,
      select,
    });
  }

  private async handleUpdateResponsibilities(
    authContext: AuthContext,
  ): Promise<JsonValue | undefined> {
    const clientId = this.getRequiredString("clientId");
    const rawResponsibilities = this.context.getNodeParameter(
      "responsibilitiesData",
      this.itemIndex,
    );
    const responsibilitiesPayload = this.parseJsonParameter(
      rawResponsibilities,
      "Responsibilities",
    );

    return await updateClientResponsibilities({
      ...authContext,
      clientId,
      responsibilities: responsibilitiesPayload,
    });
  }

  private async handleGetClientCategories(
    authContext: AuthContext,
  ): Promise<JsonValue> {
    const clientId = this.getRequiredString("clientId");
    const select = this.getOptionalString("select");

    return await fetchClientCategories({
      ...authContext,
      clientId,
      select,
    });
  }

  private async handleUpdateClientCategories(
    authContext: AuthContext,
  ): Promise<JsonValue | undefined> {
    const clientId = this.getRequiredString("clientId");
    const rawCategories = this.context.getNodeParameter(
      "categoriesData",
      this.itemIndex,
    );
    const categoriesPayload = this.parseJsonParameter(
      rawCategories,
      "Client Categories",
    );

    return await updateClientCategories({
      ...authContext,
      clientId,
      categories: categoriesPayload,
    });
  }

  private async handleGetClientGroups(
    authContext: AuthContext,
  ): Promise<JsonValue> {
    const clientId = this.getRequiredString("clientId");
    const select = this.getOptionalString("select");

    return await fetchClientGroups({
      ...authContext,
      clientId,
      select,
    });
  }

  private async handleUpdateClientGroups(
    authContext: AuthContext,
  ): Promise<JsonValue | undefined> {
    const clientId = this.getRequiredString("clientId");
    const rawGroups = this.context.getNodeParameter(
      "groupsData",
      this.itemIndex,
    );
    const groupsPayload = this.parseJsonParameter(rawGroups, "Client Groups");

    return await updateClientGroups({
      ...authContext,
      clientId,
      groups: groupsPayload,
    });
  }

  private async handleGetDeletionLog(
    authContext: AuthContext,
  ): Promise<JsonValue> {
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);
    const select = this.getOptionalString("select");
    const filter = this.getOptionalString("filter");

    return await fetchClientDeletionLog({
      ...authContext,
      top,
      skip,
      select,
      filter,
    });
  }

  private async handleGetNextFreeNumber(
    authContext: AuthContext,
  ): Promise<JsonValue> {
    const start = this.getNumberParameter("start", 1);
    const range = this.getNumberParameter("range", 0);

    return await fetchNextFreeClientNumber({
      ...authContext,
      start,
      range: typeof range === "number" && range > 0 ? range : undefined,
    });
  }
}
