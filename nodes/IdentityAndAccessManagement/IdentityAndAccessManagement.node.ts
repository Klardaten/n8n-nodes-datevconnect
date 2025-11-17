import {
  NodeApiError,
  NodeOperationError,
  type IExecuteFunctions,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
} from "n8n-workflow";

import { authenticate } from "../../src/services/datevConnectClient";
import { identityAndAccessManagementNodeDescription } from "./IdentityAndAccessManagement.config";
import { ServiceProviderConfigResourceHandler } from "./handlers/ServiceProviderConfigResourceHandler";
import { ResourceTypeResourceHandler } from "./handlers/ResourceTypeResourceHandler";
import { SchemaResourceHandler } from "./handlers/SchemaResourceHandler";
import { UserResourceHandler } from "./handlers/UserResourceHandler";
import { CurrentUserResourceHandler } from "./handlers/CurrentUserResourceHandler";
import { GroupResourceHandler } from "./handlers/GroupResourceHandler";
import type { BaseResourceHandler } from "./handlers/BaseResourceHandler";
import type { IdentityAndAccessManagementCredentials, Resource } from "./types";
import { toErrorObject } from "./utils";

export class IdentityAndAccessManagement implements INodeType {
  description: INodeTypeDescription = {
    ...identityAndAccessManagementNodeDescription,
    icon: identityAndAccessManagementNodeDescription.icon ?? "file:../klardaten.svg",
    usableAsTool: true,
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const credentials = (await this.getCredentials("datevConnectApi")) as
      | IdentityAndAccessManagementCredentials
      | null;

    if (!credentials) {
      throw new NodeOperationError(this.getNode(), "DATEVconnect credentials are missing");
    }

    const { host, email, password, clientInstanceId } = credentials;

    if (!host || !email || !password || !clientInstanceId) {
      throw new NodeOperationError(
        this.getNode(),
        "All DATEVconnect credential fields must be provided",
      );
    }

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

    const authContext = { host, token, clientInstanceId };

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const resource = this.getNodeParameter("resource", itemIndex) as Resource;
      const operation = this.getNodeParameter("operation", itemIndex) as string;

      let handler: BaseResourceHandler;
      switch (resource) {
        case "serviceProviderConfig":
          handler = new ServiceProviderConfigResourceHandler(this, itemIndex);
          break;
        case "resourceType":
          handler = new ResourceTypeResourceHandler(this, itemIndex);
          break;
        case "schema":
          handler = new SchemaResourceHandler(this, itemIndex);
          break;
        case "user":
          handler = new UserResourceHandler(this, itemIndex);
          break;
        case "currentUser":
          handler = new CurrentUserResourceHandler(this, itemIndex);
          break;
        case "group":
          handler = new GroupResourceHandler(this, itemIndex);
          break;
        default:
          throw new NodeOperationError(
            this.getNode(),
            `The resource "${resource}" is not supported.`,
            { itemIndex },
          );
      }

      await handler.execute(operation, authContext, returnData);
    }

    return [returnData];
  }
}
