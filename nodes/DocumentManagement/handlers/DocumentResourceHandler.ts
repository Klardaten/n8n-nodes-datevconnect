import { NodeOperationError } from "n8n-workflow";
import { DocumentManagementClient } from "../../../src/services/documentManagementClient";
import type { AuthContext, SendSuccessFunction } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

/**
 * Handler for document operations
 */
export class DocumentResourceHandler extends BaseResourceHandler {
  protected async executeOperation(
    operation: string,
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    this.validateRequestContext(authContext);

    switch (operation) {
      case "getAll":
        await this.getDocuments(authContext, sendSuccess);
        break;
      case "get":
        await this.getDocument(authContext, sendSuccess);
        break;
      case "create":
        await this.createDocument(authContext, sendSuccess);
        break;
      case "update":
        await this.updateDocument(authContext, sendSuccess);
        break;
      case "delete":
        await this.deleteDocument(authContext, sendSuccess);
        break;
      case "deletePermanently":
        await this.deleteDocumentPermanently(authContext, sendSuccess);
        break;
      case "getStructureItems":
        await this.getStructureItems(authContext, sendSuccess);
        break;
      case "addStructureItem":
        await this.addStructureItem(authContext, sendSuccess);
        break;
      case "getStructureItem":
        await this.getStructureItem(authContext, sendSuccess);
        break;
      case "updateStructureItem":
        await this.updateStructureItem(authContext, sendSuccess);
        break;
      case "createDispatcherInformation":
        await this.createDispatcherInformation(authContext, sendSuccess);
        break;
      default:
        throw new NodeOperationError(
          this.context.getNode(),
          `The operation "${operation}" is not supported for documents`
        );
    }
  }

  private async getDocuments(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const filter = this.getOptionalString("filter");
    const top = this.getNumberParameter("top", 0);
    const skip = this.getNumberParameter("skip", 0);

    const response = await DocumentManagementClient.fetchDocuments({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
      filter,
      top: top || undefined,
      skip: skip || undefined,
    });

    sendSuccess(response);
  }

  private async getDocument(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const documentId = this.getRequiredString("documentId");

    const response = await DocumentManagementClient.fetchDocument({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
      documentId,
    });

    sendSuccess(response);
  }

  private async createDocument(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const documentData = this.getRequiredJsonData("documentData");

    const response = await DocumentManagementClient.createDocument({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
      document: documentData,
    });

    sendSuccess(response);
  }

  private async updateDocument(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const documentId = this.getRequiredString("documentId");
    const documentData = this.getRequiredJsonData("documentData");

    const response = await DocumentManagementClient.updateDocument({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
      documentId,
      document: documentData,
    });

    sendSuccess(response);
  }

  private async deleteDocument(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const documentId = this.getRequiredString("documentId");

    await DocumentManagementClient.deleteDocument({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
      documentId,
    });

    sendSuccess({ success: true, documentId, deleted: true });
  }

  private async deleteDocumentPermanently(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const documentId = this.getRequiredString("documentId");

    await DocumentManagementClient.deleteDocumentPermanently({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
      documentId,
    });

    sendSuccess({ success: true, documentId, permanentlyDeleted: true });
  }

  private async getStructureItems(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const documentId = this.getRequiredString("documentId");
    const top = this.getNumberParameter("top", 0);
    const skip = this.getNumberParameter("skip", 0);

    const response = await DocumentManagementClient.fetchStructureItems({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
      documentId,
      top: top || undefined,
      skip: skip || undefined,
    });

    sendSuccess(response);
  }

  private async addStructureItem(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const documentId = this.getRequiredString("documentId");
    const structureItemData = this.getRequiredJsonData("structureItemData");
    const insertPosition = this.getOptionalString("insertPosition") || "last";

    const response = await DocumentManagementClient.addStructureItem({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
      documentId,
      structureItem: structureItemData,
      insertPosition,
    });

    sendSuccess(response);
  }

  private async getStructureItem(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const documentId = this.getRequiredString("documentId");
    const structureItemId = this.getRequiredString("structureItemId");

    const response = await DocumentManagementClient.fetchStructureItem({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
      documentId,
      structureItemId,
    });

    sendSuccess(response);
  }

  private async updateStructureItem(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const documentId = this.getRequiredString("documentId");
    const structureItemId = this.getRequiredString("structureItemId");
    const structureItemData = this.getRequiredJsonData("structureItemData");

    const response = await DocumentManagementClient.updateStructureItem({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
      documentId,
      structureItemId,
      structureItem: structureItemData,
    });

    sendSuccess(response);
  }

  private async createDispatcherInformation(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const documentId = this.getRequiredString("documentId");
    const dispatcherData = this.getRequiredJsonData("dispatcherData");

    const response = await DocumentManagementClient.createDispatcherInformation({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
      documentId,
      dispatcherInformation: dispatcherData,
    });

    sendSuccess(response);
  }
}