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
import { datevConnectExecutionProperties } from "../common/datevConnectProperties";
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
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    icon: orderManagementNodeDescription.icon ?? "file:../klardaten.svg",
    usableAsTool: true,
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const auth = await getDatevConnectAuthContextForNode(this);

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const authContext: AuthContext = getDatevConnectRequestContextForNode(
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

export const orderManagementNodeDescription: INodeTypeDescription = {
  displayName: "Klardaten DATEVconnect: Order Management",
  name: "orderManagement",
  icon: "file:../klardaten.svg",
  group: ["transform"],
  version: 1,
  description: "Interact with order management resources",
  defaults: {
    name: "Order Management",
  },
  inputs: ["main"],
  outputs: ["main"],
  credentials: [
    {
      name: "datevConnectApi",
      required: true,
    },
  ],
  properties: [
    {
      displayName: "Resource",
      name: "resource",
      type: "options",
      noDataExpression: true,
      options: [
        {
          name: "Client Group",
          value: "clientGroup",
        },
        {
          name: "Cost Center",
          value: "costCenter",
        },
        {
          name: "Employee",
          value: "employee",
        },
        {
          name: "Fee",
          value: "fee",
        },
        {
          name: "Invoice",
          value: "invoice",
        },
        {
          name: "Order",
          value: "order",
        },
        {
          name: "Order Type",
          value: "orderType",
        },
        {
          name: "Self Client",
          value: "selfClient",
        },
      ],
      default: "order",
    },

    // Order operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["order"],
        },
      },
      options: [
        {
          name: "Create Expense Posting",
          value: "createExpensePosting",
          description: "Create expense postings for a suborder",
          action: "Create expense postings",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific order",
          action: "Get an order",
        },
        {
          name: "Get Billing States (All)",
          value: "getSubordersStateBillingAll",
          description: "Retrieve billing state dates across suborders",
          action: "Get billing states",
        },
        {
          name: "Get Billing States (Order)",
          value: "getSubordersStateBilling",
          description: "Retrieve billing state dates for an order's suborders",
          action: "Get billing states",
        },
        {
          name: "Get Cost Items (All)",
          value: "getCostItemsAll",
          description: "Retrieve cost items across orders",
          action: "Get cost items",
        },
        {
          name: "Get Cost Items (Order)",
          value: "getCostItemsForOrder",
          description: "Retrieve planned cost items for an order",
          action: "Get order cost items",
        },
        {
          name: "Get Expense Postings (All)",
          value: "getExpensePostingsAll",
          description: "Retrieve expense postings across orders",
          action: "Get expense postings",
        },
        {
          name: "Get Expense Postings (Order)",
          value: "getExpensePostingsForOrder",
          description: "Retrieve expense postings for an order",
          action: "Get order expense postings",
        },
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve orders",
          action: "Get many orders",
        },
        {
          name: "Get Monthly Values (All)",
          value: "getMonthlyValuesAll",
          description: "Retrieve monthly values across orders",
          action: "Get monthly values",
        },
        {
          name: "Get Monthly Values (Order)",
          value: "getMonthlyValuesForOrder",
          description: "Retrieve monthly values for a specific order",
          action: "Get order monthly values",
        },
        {
          name: "Get State Dates (All)",
          value: "getStateWorkAll",
          description: "Retrieve state dates across orders",
          action: "Get order state dates",
        },
        {
          name: "Get State Dates (Order)",
          value: "getStateWork",
          description: "Retrieve state dates for an order",
          action: "Get order state dates",
        },
        {
          name: "Update",
          value: "update",
          description: "Completely overwrite an order",
          action: "Update an order",
        },
        {
          name: "Update Suborder",
          value: "updateSuborder",
          description: "Completely overwrite a suborder",
          action: "Update a suborder",
        },
      ],
      default: "getAll",
    },

    // Order type operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["orderType"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve order types",
          action: "Get many order types",
        },
      ],
      default: "getAll",
    },

    // Client group operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["clientGroup"],
        },
      },
      options: [
        {
          name: "Get",
          value: "get",
          description: "Retrieve the group of a client",
          action: "Get a client group",
        },
      ],
      default: "get",
    },

    // Invoice operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["invoice"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve invoices",
          action: "Get many invoices",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific invoice",
          action: "Get an invoice",
        },
      ],
      default: "getAll",
    },

    // Employee operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["employee"],
        },
      },
      options: [
        {
          name: "Get Capacities",
          value: "getCapacities",
          description: "Retrieve employee capacities",
          action: "Get employee capacities",
        },
        {
          name: "Get Charge Rates",
          value: "getChargeRates",
          description: "Retrieve charge rates",
          action: "Get charge rates",
        },
        {
          name: "Get Cost Rates",
          value: "getCostRates",
          description: "Retrieve employees with cost rates",
          action: "Get employee cost rates",
        },
        {
          name: "Get Employees With Group",
          value: "getWithGroup",
          description: "Retrieve employees including their group",
          action: "Get employees with group",
        },
        {
          name: "Get Qualifications",
          value: "getQualifications",
          description: "Retrieve employees with qualifications",
          action: "Get employee qualifications",
        },
      ],
      default: "getCapacities",
    },

    // Fee operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["fee"],
        },
      },
      options: [
        {
          name: "Get Fees",
          value: "getFees",
          description: "Retrieve fees",
          action: "Get fees",
        },
        {
          name: "Get Fee Plans",
          value: "getFeePlans",
          description: "Retrieve fee plans",
          action: "Get fee plans",
        },
      ],
      default: "getFees",
    },

    // Cost center operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["costCenter"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve cost centers",
          action: "Get many cost centers",
        },
      ],
      default: "getAll",
    },

    // Self client operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["selfClient"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve self clients",
          action: "Get many self clients",
        },
      ],
      default: "getAll",
    },

    // Common optional parameters
    {
      displayName: "Select Fields",
      name: "select",
      type: "string",
      displayOptions: {
        show: {
          resource: [
            "order",
            "invoice",
            "employee",
            "fee",
            "costCenter",
            "selfClient",
          ],
          operation: [
            "getAll",
            "get",
            "getMonthlyValuesForOrder",
            "getMonthlyValuesAll",
            "getCostItemsForOrder",
            "getCostItemsAll",
            "getStateWork",
            "getStateWorkAll",
            "getSubordersStateBilling",
            "getSubordersStateBillingAll",
            "getExpensePostingsForOrder",
            "getExpensePostingsAll",
            "getCapacities",
            "getWithGroup",
            "getQualifications",
            "getCostRates",
            "getChargeRates",
            "getFees",
            "getFeePlans",
          ],
        },
      },
      default: "",
      description: "Comma-separated list of fields to include in the response",
    },
    {
      displayName: "Filter",
      name: "filter",
      type: "string",
      displayOptions: {
        show: {
          resource: ["order", "invoice", "employee", "fee", "costCenter"],
          operation: [
            "getAll",
            "getMonthlyValuesAll",
            "getCostItemsAll",
            "getStateWorkAll",
            "getSubordersStateBillingAll",
            "getExpensePostingsAll",
            "getFees",
            "getFeePlans",
            "getCapacities",
            "getWithGroup",
            "getQualifications",
            "getCostRates",
            "getChargeRates",
          ],
        },
      },
      default: "",
      description: "Filter expression to limit results",
    },
    {
      displayName: "Top",
      name: "top",
      type: "number",
      typeOptions: {
        minValue: 0,
      },
      displayOptions: {
        show: {
          resource: [
            "order",
            "orderType",
            "invoice",
            "employee",
            "fee",
            "costCenter",
            "selfClient",
          ],
          operation: [
            "getAll",
            "getMonthlyValuesAll",
            "getCostItemsAll",
            "getStateWorkAll",
            "getSubordersStateBillingAll",
            "getExpensePostingsAll",
            "getFees",
            "getFeePlans",
            "getCapacities",
            "getWithGroup",
            "getQualifications",
            "getCostRates",
            "getChargeRates",
          ],
        },
      },
      default: 100,
      description: "Maximum number of records to return",
    },
    {
      displayName: "Skip",
      name: "skip",
      type: "number",
      typeOptions: {
        minValue: 0,
      },
      displayOptions: {
        show: {
          resource: [
            "order",
            "orderType",
            "invoice",
            "employee",
            "fee",
            "costCenter",
            "selfClient",
          ],
          operation: [
            "getAll",
            "getMonthlyValuesAll",
            "getCostItemsAll",
            "getStateWorkAll",
            "getSubordersStateBillingAll",
            "getExpensePostingsAll",
            "getFees",
            "getFeePlans",
            "getCapacities",
            "getWithGroup",
            "getQualifications",
            "getCostRates",
            "getChargeRates",
          ],
        },
      },
      default: 0,
      description: "Number of records to skip",
    },
    {
      displayName: "Cost Rate",
      name: "costRate",
      type: "number",
      typeOptions: {
        minValue: 1,
        maxValue: 9,
      },
      displayOptions: {
        show: {
          resource: ["order"],
          operation: [
            "getAll",
            "get",
            "getMonthlyValuesForOrder",
            "getMonthlyValuesAll",
          ],
        },
      },
      default: null,
      description:
        'Optional cost rate (1-9) used for valuations. For "Get" and "Get All" you must also set Expand to "suborders".',
    },
    {
      displayName: "Expand",
      name: "expand",
      type: "string",
      displayOptions: {
        show: {
          resource: ["order"],
          operation: ["getAll", "get"],
        },
      },
      default: "",
      description:
        "Expand sub-resources (e.g. suborders). Required when using Cost Rate.",
    },

    // Required identifiers
    {
      displayName: "Order ID",
      name: "orderId",
      type: "number",
      required: true,
      displayOptions: {
        show: {
          resource: ["order"],
          operation: [
            "get",
            "update",
            "getMonthlyValuesForOrder",
            "getCostItemsForOrder",
            "getStateWork",
            "getSubordersStateBilling",
            "getExpensePostingsForOrder",
            "updateSuborder",
            "createExpensePosting",
          ],
        },
      },
      default: 0,
      description: "Numeric identifier of the order",
    },
    {
      displayName: "Suborder ID",
      name: "suborderId",
      type: "number",
      required: true,
      displayOptions: {
        show: {
          resource: ["order"],
          operation: ["updateSuborder", "createExpensePosting"],
        },
      },
      default: 0,
      description: "Numeric identifier of the suborder",
    },
    {
      displayName: "Invoice ID",
      name: "invoiceId",
      type: "number",
      required: true,
      displayOptions: {
        show: {
          resource: ["invoice"],
          operation: ["get"],
        },
      },
      default: 0,
      description: "Numeric identifier of the invoice",
    },
    {
      displayName: "Client ID",
      name: "clientId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          resource: ["clientGroup"],
          operation: ["get"],
        },
      },
      default: "",
      description: "Client GUID used to look up the group",
    },

    // Payloads
    {
      displayName: "Order Data",
      name: "orderData",
      type: "json",
      displayOptions: {
        show: {
          resource: ["order"],
          operation: ["update"],
        },
      },
      default: "{}",
      description: "Order payload to send to the API",
    },
    {
      displayName: "Suborder Data",
      name: "suborderData",
      type: "json",
      displayOptions: {
        show: {
          resource: ["order"],
          operation: ["updateSuborder"],
        },
      },
      default: "{}",
      description: "Suborder payload to send to the API",
    },
    {
      displayName: "Expense Posting Data",
      name: "expensePostingData",
      type: "json",
      displayOptions: {
        show: {
          resource: ["order"],
          operation: ["createExpensePosting"],
        },
      },
      default: "{}",
      description: "Expense posting payload to create",
    },
    {
      displayName: "Automatic Integration",
      name: "automaticIntegration",
      type: "boolean",
      displayOptions: {
        show: {
          resource: ["order"],
          operation: ["createExpensePosting"],
        },
      },
      default: false,
      description:
        "Whether to integrate the expense postings directly instead of staging",
    },
    {
      displayName: "Delete Massdata on Failure",
      name: "deleteMassdataOnFailure",
      type: "boolean",
      displayOptions: {
        show: {
          resource: ["order"],
          operation: ["createExpensePosting"],
        },
      },
      default: false,
      description:
        "Whether to delete failed mass data entries when automatic integration is enabled",
    },
    ...datevConnectExecutionProperties,
  ],
};
