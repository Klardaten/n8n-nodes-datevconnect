import { NodeOperationError } from "n8n-workflow";
import type { JsonValue } from "../../../src/services/datevConnectClient";
import { DocumentManagementClient } from "../../../src/services/documentManagementClient";
import type { AuthContext, SendSuccessFunction } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

/**
 * Handler for document file operations
 * 
 * IMPORTANT: This handler deals with binary file transfers that require special headers:
 * - GET /document-files/{file-id}: Returns application/octet-stream binary data
 * - POST /document-files: Accepts application/octet-stream binary data
 * 
 * The DATEV Document Management API uses octet-stream for all file operations
 * as specified in the document management-2.3.1.yaml specification.
 */
export class DocumentFileResourceHandler extends BaseResourceHandler {
  protected async executeOperation(
    operation: string,
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    this.validateRequestContext(authContext);

    switch (operation) {
      case "get":
        await this.getDocumentFile(authContext, sendSuccess);
        break;
      case "upload":
        await this.uploadDocumentFile(authContext, sendSuccess);
        break;
      default:
        throw new NodeOperationError(
          this.context.getNode(),
          `The operation "${operation}" is not supported for document files`
        );
    }
  }

  private async getDocumentFile(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const documentFileId = this.getRequiredString("documentFileId");

    const response = await DocumentManagementClient.fetchDocumentFile({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
      fileId: documentFileId,
    });

    // Handle binary response
    const binaryData = await response.arrayBuffer();
    const result: JsonValue = {
      id: documentFileId,
      contentType: response.headers.get('content-type') || 'application/octet-stream',
      size: binaryData.byteLength,
      binaryData: Buffer.from(binaryData).toString('base64'), // Convert to base64 for JSON transport
    };

    sendSuccess(result);
  }

  private async uploadDocumentFile(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const binaryData = this.getRequiredString("binaryData");

    // Convert base64 string to binary data if needed
    const bufferData = binaryData.startsWith('data:') 
      ? Buffer.from(binaryData.split(',')[1], 'base64')
      : Buffer.from(binaryData, 'base64');

    const response = await DocumentManagementClient.uploadDocumentFile({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
      binaryData: bufferData,
    });

    sendSuccess(response);
  }
}