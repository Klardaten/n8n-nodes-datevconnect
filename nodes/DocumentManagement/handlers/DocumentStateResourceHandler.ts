import { NodeOperationError } from "n8n-workflow";
import { DocumentManagementClient } from "../../../src/services/documentManagementClient";
import type { AuthContext, SendSuccessFunction } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

/**
 * Handler for document state operations
 */
export class DocumentStateResourceHandler extends BaseResourceHandler {
  protected async executeOperation(
    operation: string,
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    this.validateRequestContext(authContext);

    switch (operation) {
      case "getAll":
        await this.getDocumentStates(authContext, sendSuccess);
        break;
      case "get":
        await this.getDocumentState(authContext, sendSuccess);
        break;
      case "create":
        await this.createDocumentState(authContext, sendSuccess);
        break;
      default:
        throw new NodeOperationError(
          this.context.getNode(),
          `The operation "${operation}" is not supported for document states`
        );
    }
  }

  private async getDocumentStates(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const filter = this.getOptionalString("filter");

    const response = await DocumentManagementClient.fetchDocumentStates({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
      filter,
    });

    sendSuccess(response);
  }

  private async getDocumentState(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const stateId = this.getRequiredString("stateId");

    const response = await DocumentManagementClient.fetchDocumentState({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
      stateId,
    });

    sendSuccess(response);
  }

  private async createDocumentState(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const stateData = this.getRequiredJsonData("stateData");

    const response = await DocumentManagementClient.createDocumentState({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
      state: stateData,
    });

    sendSuccess(response);
  }
}