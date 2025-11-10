import {
  NodeApiError,
  NodeOperationError,
  type IExecuteFunctions,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
} from "n8n-workflow";

import { authenticate } from "../../src/services/datevConnectClient";
import { documentManagementNodeDescription } from "./DocumentManagement.config";
import { DocumentResourceHandler } from "./handlers/DocumentResourceHandler";
import { DocumentFileResourceHandler } from "./handlers/DocumentFileResourceHandler";
import { DomainResourceHandler } from "./handlers/DomainResourceHandler";
import { DocumentStateResourceHandler } from "./handlers/DocumentStateResourceHandler";
import { InfoResourceHandler } from "./handlers/InfoResourceHandler";
import { SecureAreaResourceHandler } from "./handlers/SecureAreaResourceHandler";
import { PropertyTemplateResourceHandler } from "./handlers/PropertyTemplateResourceHandler";
import { IndividualPropertyResourceHandler } from "./handlers/IndividualPropertyResourceHandler";
import { IndividualReference1ResourceHandler } from "./handlers/IndividualReference1ResourceHandler";
import { IndividualReference2ResourceHandler } from "./handlers/IndividualReference2ResourceHandler";
import type { BaseResourceHandler } from "./handlers/BaseResourceHandler";
import { toErrorObject } from "./utils";
import type { Resource, DocumentManagementCredentials } from "./types";

export class DocumentManagement implements INodeType {
  description: INodeTypeDescription = {
    ...documentManagementNodeDescription,
    icon: documentManagementNodeDescription.icon ?? "file:../klardaten.svg",
    usableAsTool: true,
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Get and validate credentials
    const credentials = (await this.getCredentials("datevConnectApi")) as
      | DocumentManagementCredentials
      | null;

    if (!credentials) {
      throw new NodeOperationError(this.getNode(), "DATEVconnect credentials are missing");
    }

    const { host, email, password, clientInstanceId } = credentials;

    if (!host || !email || !password || !clientInstanceId) {
      throw new NodeOperationError(
        this.getNode(),
        "All DATEVconnect credential fields must be provided"
      );
    }

    // Authenticate once for all items
    let token: string;
    try {
      const authResponse = await authenticate({
        host,
        email,
        password,
      });
      token = authResponse.access_token;
    } catch (error) {
      throw new NodeApiError(this.getNode(), toErrorObject(error));
    }

    // Create authentication context
    const authContext = { host, token, clientInstanceId };

    // Process each input item
    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const resource = this.getNodeParameter("resource", itemIndex) as Resource;
      const operation = this.getNodeParameter("operation", itemIndex) as string;

      // Create appropriate resource handler
      let handler: BaseResourceHandler;
      switch (resource) {
        case "document":
          handler = new DocumentResourceHandler(this, itemIndex);
          break;
        case "documentFile":
          handler = new DocumentFileResourceHandler(this, itemIndex);
          break;
        case "domain":
          handler = new DomainResourceHandler(this, itemIndex);
          break;
        case "documentState":
          handler = new DocumentStateResourceHandler(this, itemIndex);
          break;
        case "info":
          handler = new InfoResourceHandler(this, itemIndex);
          break;
        case "secureArea":
          handler = new SecureAreaResourceHandler(this, itemIndex);
          break;
        case "propertyTemplate":
          handler = new PropertyTemplateResourceHandler(this, itemIndex);
          break;
        case "individualProperty":
          handler = new IndividualPropertyResourceHandler(this, itemIndex);
          break;
        case "individualReference1":
          handler = new IndividualReference1ResourceHandler(this, itemIndex);
          break;
        case "individualReference2":
          handler = new IndividualReference2ResourceHandler(this, itemIndex);
          break;
        default:
          throw new NodeOperationError(
            this.getNode(),
            `The resource "${resource}" is not supported.`,
            { itemIndex },
          );
      }

      // Execute the operation using the handler
      await handler.execute(operation, authContext, returnData);
    }

    return [returnData];
  }
}
