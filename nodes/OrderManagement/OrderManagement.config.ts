/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import type { INodeTypeDescription } from "n8n-workflow";

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
          name: "Order",
          value: "order",
        },
        {
          name: "Order Type",
          value: "orderType",
        },
        {
          name: "Client Group",
          value: "clientGroup",
        },
        {
          name: "Invoice",
          value: "invoice",
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
          name: "Cost Center",
          value: "costCenter",
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
          name: "Get Many",
          value: "getAll",
          description: "Retrieve orders",
          action: "Get many orders",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific order",
          action: "Get an order",
        },
        {
          name: "Update",
          value: "update",
          description: "Completely overwrite an order",
          action: "Update an order",
        },
        {
          name: "Get Monthly Values (Order)",
          value: "getMonthlyValuesForOrder",
          description: "Retrieve monthly values for a specific order",
          action: "Get order monthly values",
        },
        {
          name: "Get Monthly Values (All)",
          value: "getMonthlyValuesAll",
          description: "Retrieve monthly values across orders",
          action: "Get monthly values",
        },
        {
          name: "Get Cost Items (Order)",
          value: "getCostItemsForOrder",
          description: "Retrieve planned cost items for an order",
          action: "Get order cost items",
        },
        {
          name: "Get Cost Items (All)",
          value: "getCostItemsAll",
          description: "Retrieve cost items across orders",
          action: "Get cost items",
        },
        {
          name: "Get State Dates (Order)",
          value: "getStateWork",
          description: "Retrieve state dates for an order",
          action: "Get order state dates",
        },
        {
          name: "Get State Dates (All)",
          value: "getStateWorkAll",
          description: "Retrieve state dates across orders",
          action: "Get order state dates",
        },
        {
          name: "Get Billing States (Order)",
          value: "getSubordersStateBilling",
          description: "Retrieve billing state dates for an order's suborders",
          action: "Get billing states",
        },
        {
          name: "Get Billing States (All)",
          value: "getSubordersStateBillingAll",
          description: "Retrieve billing state dates across suborders",
          action: "Get billing states",
        },
        {
          name: "Get Expense Postings (Order)",
          value: "getExpensePostingsForOrder",
          description: "Retrieve expense postings for an order",
          action: "Get order expense postings",
        },
        {
          name: "Get Expense Postings (All)",
          value: "getExpensePostingsAll",
          description: "Retrieve expense postings across orders",
          action: "Get expense postings",
        },
        {
          name: "Update Suborder",
          value: "updateSuborder",
          description: "Completely overwrite a suborder",
          action: "Update a suborder",
        },
        {
          name: "Create Expense Posting",
          value: "createExpensePosting",
          description: "Create expense postings for a suborder",
          action: "Create expense postings",
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
        {
          name: "Get Cost Rates",
          value: "getCostRates",
          description: "Retrieve employees with cost rates",
          action: "Get employee cost rates",
        },
        {
          name: "Get Charge Rates",
          value: "getChargeRates",
          description: "Retrieve charge rates",
          action: "Get charge rates",
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
          resource: ["order", "orderType", "invoice", "employee", "fee", "costCenter", "selfClient"],
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
          resource: ["order", "orderType", "invoice", "employee", "fee", "costCenter", "selfClient"],
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
          operation: ["getAll", "get", "getMonthlyValuesForOrder", "getMonthlyValuesAll"],
        },
      },
      default: 0,
      description: "Optional cost rate used for valuations",
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
      description: "Expand sub-resources (e.g. suborders)",
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
      description: "Integrate the expense postings directly instead of staging",
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
      description: "Whether to delete failed mass data entries when automatic integration is enabled",
    },
  ],
};
