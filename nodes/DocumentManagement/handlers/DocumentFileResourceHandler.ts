import { NodeOperationError, type IBinaryData, type INodeExecutionData, type IDataObject } from "n8n-workflow";
import type { JsonValue } from "../../../src/services/datevConnectClient";
import { DocumentManagementClient } from "../../../src/services/documentManagementClient";
import type { AuthContext, SendSuccessFunction } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";
import { normaliseToObjects, toErrorMessage } from "../utils";

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
  protected executeOperation(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  /**
   * Override execute method to handle binary data for document file operations
   */
  async execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    try {
      this.validateRequestContext(authContext);

      switch (operation) {
        case "get":
          await this.getDocumentFileBinary(authContext, returnData);
          break;
        case "upload":
          {
            // Use the standard base handler for upload operations
            const sendSuccess: SendSuccessFunction = (payload?: JsonValue) => {
              const data = payload ? normaliseToObjects(payload) : [{}];
              data.forEach((item: IDataObject) => {
                returnData.push({
                  json: {
                    success: true,
                    ...item,
                  },
                });
              });
            };
            await this.uploadDocumentFile(authContext, sendSuccess);
            break;
          }
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for document files`
          );
      }
    } catch (error) {
      const continueOnFail = this.context.continueOnFail();
      if (continueOnFail) {
        returnData.push({
          json: {
            error: toErrorMessage(error),
          },
        });
      } else {
        if (error instanceof Error) {
          throw error;
        }
        throw new NodeOperationError(this.context.getNode(), String(error), {
          itemIndex: this.itemIndex,
        });
      }
    }
  }

  /**
   * Get document file and return it as binary data
   */
  private async getDocumentFileBinary(
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const documentFileId = this.getRequiredString("documentFileId");

    const response = await DocumentManagementClient.fetchDocumentFile({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
      fileId: documentFileId,
    });

    // Handle binary response - return as actual binary data
    const binaryData = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Create binary data object for n8n
    const binaryDataObject: IBinaryData = {
      data: Buffer.from(binaryData).toString('base64'),
      mimeType: contentType,
      fileName: documentFileId, // Use the file ID as filename
      fileSize: binaryData.byteLength.toString(),
    };

    // Add execution data with binary content
    returnData.push({
      json: {
        success: true,
        id: documentFileId,
        contentType,
        size: binaryData.byteLength,
      },
      binary: {
        data: binaryDataObject,
      },
    });
  }

  private async uploadDocumentFile(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    // Get binary data from the input data
    const inputData = this.context.getInputData();
    const currentItem = inputData[this.itemIndex];

    if (!currentItem?.binary?.data) {
      throw new NodeOperationError(
        this.context.getNode(),
        "No binary data found. Please provide binary data through the 'data' binary property.",
        { itemIndex: this.itemIndex }
      );
    }

    // Get from binary property
    const binaryDataObj = currentItem.binary.data;
    const bufferData = Buffer.from(binaryDataObj.data, 'base64');

    const response = await DocumentManagementClient.uploadDocumentFile({
      host: authContext.host,
      token: authContext.token,
      clientInstanceId: authContext.clientInstanceId,
      binaryData: bufferData as BodyInit,
    });
    sendSuccess(response);
  }
}
