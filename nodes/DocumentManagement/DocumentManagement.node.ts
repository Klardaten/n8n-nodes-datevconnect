import {
  NodeApiError,
  NodeOperationError,
  type IExecuteFunctions,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
  type JsonObject,
} from "n8n-workflow";

import {
  getDatevConnectAuthContextForNode,
  getDatevConnectRequestContextForNode,
} from "../common/datevConnectAuth";
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
import type { Resource } from "./types";

export class DocumentManagement implements INodeType {
  description: INodeTypeDescription = {
    ...documentManagementNodeDescription,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    icon: documentManagementNodeDescription.icon ?? "file:../klardaten.svg",
    usableAsTool: true,
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const auth = await getDatevConnectAuthContextForNode(this);

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const authContext = getDatevConnectRequestContextForNode(
          this,
          auth,
          itemIndex,
        );
        const resource = this.getNodeParameter(
          "resource",
          itemIndex,
        ) as Resource;
        const operation = this.getNodeParameter(
          "operation",
          itemIndex,
        ) as string;

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
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred",
            },
            pairedItem: { item: itemIndex },
          });
        } else {
          if (error instanceof NodeApiError) {
            throw new NodeApiError(
              this.getNode(),
              error as unknown as JsonObject,
              { itemIndex },
            );
          }
          if (error instanceof NodeOperationError) {
            throw new NodeOperationError(this.getNode(), error.message, {
              itemIndex,
            });
          }
          throw new NodeApiError(this.getNode(), error as JsonObject, {
            itemIndex,
          });
        }
      }
    }

    return [returnData];
  }
}
