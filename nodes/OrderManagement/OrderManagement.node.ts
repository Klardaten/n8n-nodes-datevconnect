import {
  NodeOperationError,
  type IExecuteFunctions,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
} from "n8n-workflow";

import { getDatevConnectAuthContextForNode } from "../common/datevConnectAuth";
import { orderManagementNodeDescription } from "./OrderManagement.config";
import { ClientGroupResourceHandler } from "./handlers/ClientGroupResourceHandler";
import { CostCenterResourceHandler } from "./handlers/CostCenterResourceHandler";
import { EmployeeResourceHandler } from "./handlers/EmployeeResourceHandler";
import { FeeResourceHandler } from "./handlers/FeeResourceHandler";
import { InvoiceResourceHandler } from "./handlers/InvoiceResourceHandler";
import { OrderResourceHandler } from "./handlers/OrderResourceHandler";
import { OrderTypeResourceHandler } from "./handlers/OrderTypeResourceHandler";
import { SelfClientResourceHandler } from "./handlers/SelfClientResourceHandler";
import type { BaseResourceHandler } from "./handlers/BaseResourceHandler";
import type { AuthContext, Resource } from "./types";

export class OrderManagement implements INodeType {
  description: INodeTypeDescription = {
    ...orderManagementNodeDescription,
    icon: orderManagementNodeDescription.icon ?? "file:../klardaten.svg",
    usableAsTool: true,
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const auth = await getDatevConnectAuthContextForNode(this);

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const paramClientInstanceId = this.getNodeParameter(
        "clientInstanceId",
        itemIndex,
        "",
      ) as string;
      const effectiveClientInstanceId =
        paramClientInstanceId || auth.clientInstanceId;

      const authContext: AuthContext = {
        ...auth,
        clientInstanceId: effectiveClientInstanceId,
      };
      const resource = this.getNodeParameter("resource", itemIndex) as Resource;
      const operation = this.getNodeParameter("operation", itemIndex) as string;

      let handler: BaseResourceHandler;
      switch (resource) {
        case "order":
          handler = new OrderResourceHandler(this, itemIndex);
          break;
        case "orderType":
          handler = new OrderTypeResourceHandler(this, itemIndex);
          break;
        case "clientGroup":
          handler = new ClientGroupResourceHandler(this, itemIndex);
          break;
        case "invoice":
          handler = new InvoiceResourceHandler(this, itemIndex);
          break;
        case "employee":
          handler = new EmployeeResourceHandler(this, itemIndex);
          break;
        case "fee":
          handler = new FeeResourceHandler(this, itemIndex);
          break;
        case "costCenter":
          handler = new CostCenterResourceHandler(this, itemIndex);
          break;
        case "selfClient":
          handler = new SelfClientResourceHandler(this, itemIndex);
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
