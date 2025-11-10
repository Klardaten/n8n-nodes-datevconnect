import {
  NodeApiError,
  NodeOperationError,
  type IExecuteFunctions,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
} from "n8n-workflow";

import { authenticate } from "../../src/services/datevConnectClient";
import { masterDataNodeDescription } from "./MasterData.config";
import { ClientResourceHandler } from "./handlers/ClientResourceHandler";
import { TaxAuthorityResourceHandler } from "./handlers/TaxAuthorityResourceHandler";
import { RelationshipResourceHandler } from "./handlers/RelationshipResourceHandler";
import { LegalFormResourceHandler } from "./handlers/LegalFormResourceHandler";
import { CorporateStructureResourceHandler } from "./handlers/CorporateStructureResourceHandler";
import { EmployeeResourceHandler } from "./handlers/EmployeeResourceHandler";
import { CountryCodeResourceHandler } from "./handlers/CountryCodeResourceHandler";
import { ClientGroupTypeResourceHandler } from "./handlers/ClientGroupTypeResourceHandler";
import { ClientCategoryTypeResourceHandler } from "./handlers/ClientCategoryTypeResourceHandler";
import { BankResourceHandler } from "./handlers/BankResourceHandler";
import { AreaOfResponsibilityResourceHandler } from "./handlers/AreaOfResponsibilityResourceHandler";
import { AddresseeResourceHandler } from "./handlers/AddresseeResourceHandler";
import type { BaseResourceHandler } from "./handlers/BaseResourceHandler";
import { toErrorObject } from "./utils";
import type { Resource, MasterDataCredentials } from "./types";

export class MasterData implements INodeType {
  description: INodeTypeDescription = {
    ...masterDataNodeDescription,
    icon: masterDataNodeDescription.icon ?? "file:../klardaten.svg",
    usableAsTool: true,
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Get and validate credentials
    const credentials = (await this.getCredentials("datevConnectApi")) as
      | MasterDataCredentials
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
        case "client":
          handler = new ClientResourceHandler(this, itemIndex);
          break;
        case "taxAuthority":
          handler = new TaxAuthorityResourceHandler(this, itemIndex);
          break;
        case "relationship":
          handler = new RelationshipResourceHandler(this, itemIndex);
          break;
        case "legalForm":
          handler = new LegalFormResourceHandler(this, itemIndex);
          break;
        case "corporateStructure":
          handler = new CorporateStructureResourceHandler(this, itemIndex);
          break;
        case "employee":
          handler = new EmployeeResourceHandler(this, itemIndex);
          break;
        case "countryCode":
          handler = new CountryCodeResourceHandler(this, itemIndex);
          break;
        case "clientGroupType":
          handler = new ClientGroupTypeResourceHandler(this, itemIndex);
          break;
        case "clientCategoryType":
          handler = new ClientCategoryTypeResourceHandler(this, itemIndex);
          break;
        case "bank":
          handler = new BankResourceHandler(this, itemIndex);
          break;
        case "areaOfResponsibility":
          handler = new AreaOfResponsibilityResourceHandler(this, itemIndex);
          break;
        case "addressee":
          handler = new AddresseeResourceHandler(this, itemIndex);
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
