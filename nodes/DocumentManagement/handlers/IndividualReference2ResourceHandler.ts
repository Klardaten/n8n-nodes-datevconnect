import { NodeOperationError } from "n8n-workflow";
import { DocumentManagementClient } from "../../../src/services/documentManagementClient";
import type { AuthContext, SendSuccessFunction } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

/**
 * Handler for individual references 2 operations
 */
export class IndividualReference2ResourceHandler extends BaseResourceHandler {
  protected async executeOperation(
    operation: string,
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    this.validateRequestContext(authContext);

    switch (operation) {
      case "getAll":
        await this.getIndividualReferences2(authContext, sendSuccess);
        break;
      case "create":
        await this.createIndividualReference2(authContext, sendSuccess);
        break;
      default:
        throw new NodeOperationError(
          this.context.getNode(),
          `Unsupported operation: ${operation}`,
          {
            itemIndex: this.itemIndex,
          },
        );
    }
  }

  private async getIndividualReferences2(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const top = this.getNumberParameter("top", 0);
    const skip = this.getNumberParameter("skip", 0);

    const response = await DocumentManagementClient.fetchIndividualReferences2({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
      top: top || undefined,
      skip: skip || undefined,
    });

    sendSuccess(response);
  }

  private async createIndividualReference2(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const individualReferenceData = this.getRequiredJsonData(
      "individualReferenceData",
    );

    const response = await DocumentManagementClient.createIndividualReference2({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
      individualReference: individualReferenceData,
    });

    sendSuccess(response);
  }
}
