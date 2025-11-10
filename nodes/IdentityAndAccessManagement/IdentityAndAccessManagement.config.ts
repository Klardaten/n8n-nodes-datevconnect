/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import type { INodeTypeDescription } from "n8n-workflow";

export const identityAndAccessManagementNodeDescription: INodeTypeDescription = {
  displayName: "Klardaten DATEVconnect: Identity & Access",
  name: "identityAndAccessManagement",
  icon: "file:../klardaten.svg",
  group: ["transform"],
  version: 1,
  description: "Work with DATEV Identity and Access Management (SCIM) endpoints",
  defaults: {
    name: "Identity & Access Management",
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
          name: "Current User",
          value: "currentUser",
        },
        {
          name: "Group",
          value: "group",
        },
        {
          name: "Resource Type",
          value: "resourceType",
        },
        {
          name: "Schema",
          value: "schema",
        },
        {
          name: "Service Provider Config",
          value: "serviceProviderConfig",
        },
        {
          name: "User",
          value: "user",
        },
      ],
      default: "user",
    },

    // Service Provider Config operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["serviceProviderConfig"],
        },
      },
      options: [
        {
          name: "Get",
          value: "get",
          action: "Get service provider config",
          description: "Retrieve the SCIM service provider configuration",
        },
      ],
      default: "get",
    },

    // Resource Type operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["resourceType"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          action: "Get many resource types",
          description: "Retrieve the available SCIM resource types",
        },
      ],
      default: "getAll",
    },

    // Schema operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["schema"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          action: "Get many schemas",
          description: "List the supported SCIM schemas",
        },
        {
          name: "Get",
          value: "get",
          action: "Get schema",
          description: "Retrieve a single SCIM schema by ID",
        },
      ],
      default: "getAll",
    },

    // User operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["user"],
        },
      },
      options: [
        {
          name: "Create",
          value: "create",
          action: "Create a user",
          description: "Create a new DATEV IAM user",
        },
        {
          name: "Delete",
          value: "delete",
          action: "Delete a user",
          description: "Delete a DATEV IAM user",
        },
        {
          name: "Get",
          value: "get",
          action: "Get a user",
          description: "Retrieve a single DATEV IAM user",
        },
        {
          name: "Get Many",
          value: "getAll",
          action: "Get many users",
          description: "List DATEV IAM users",
        },
        {
          name: "Update",
          value: "update",
          action: "Update a user",
          description: "Update an existing DATEV IAM user",
        },
      ],
      default: "getAll",
    },

    // Current user operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["currentUser"],
        },
      },
      options: [
        {
          name: "Get",
          value: "get",
          action: "Get current user",
          description: "Fetch the currently authenticated DATEV IAM user",
        },
      ],
      default: "get",
    },

    // Group operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["group"],
        },
      },
      options: [
        {
          name: "Create",
          value: "create",
          action: "Create a group",
          description: "Create a new DATEV IAM group",
        },
        {
          name: "Delete",
          value: "delete",
          action: "Delete a group",
          description: "Delete a DATEV IAM group",
        },
        {
          name: "Get",
          value: "get",
          action: "Get a group",
          description: "Retrieve a single DATEV IAM group",
        },
        {
          name: "Get Many",
          value: "getAll",
          action: "Get many groups",
          description: "List DATEV IAM groups",
        },
        {
          name: "Update",
          value: "update",
          action: "Update a group",
          description: "Update an existing DATEV IAM group",
        },
      ],
      default: "getAll",
    },

    // Schema parameters
    {
      displayName: "Schema ID",
      name: "schemaId",
      type: "string",
      required: true,
      default: "",
      description: "Full SCIM schema ID (e.g. urn:ietf:params:scim:schemas:core:2.0:User)",
      displayOptions: {
        show: {
          resource: ["schema"],
          operation: ["get"],
        },
      },
    },

    // User parameters
    {
      displayName: "User ID",
      name: "userId",
      type: "string",
      required: true,
      default: "",
      description: "ID of the DATEV IAM user",
      displayOptions: {
        show: {
          resource: ["user"],
          operation: ["get", "update", "delete"],
        },
      },
    },
    {
      displayName: "Filter",
      name: "filter",
      type: "string",
      default: "",
      description: "Optional SCIM filter expression",
      displayOptions: {
        show: {
          resource: ["user"],
          operation: ["getAll"],
        },
      },
    },
    {
      displayName: "Attributes",
      name: "attributes",
      type: "string",
      default: "",
      description: "Optional comma-separated list of SCIM attributes to return",
      displayOptions: {
        show: {
          resource: ["user"],
          operation: ["getAll"],
        },
      },
    },
    {
      displayName: "Start Index",
      name: "startIndex",
      type: "number",
      typeOptions: {
        minValue: 1,
      },
      default: 1,
      description: "1-based index of the first result to return",
      displayOptions: {
        show: {
          resource: ["user"],
          operation: ["getAll"],
        },
      },
    },
    {
      displayName: "Count",
      name: "count",
      type: "number",
      typeOptions: {
        minValue: 1,
      },
      default: 100,
      description: "Maximum number of results to return",
      displayOptions: {
        show: {
          resource: ["user"],
          operation: ["getAll"],
        },
      },
    },
    {
      displayName: "User Data",
      name: "userData",
      type: "json",
      required: true,
      default: "{}",
      description: "Full SCIM user payload",
      displayOptions: {
        show: {
          resource: ["user"],
          operation: ["create", "update"],
        },
      },
    },

    // Group parameters
    {
      displayName: "Group ID",
      name: "groupId",
      type: "string",
      required: true,
      default: "",
      description: "ID of the DATEV IAM group",
      displayOptions: {
        show: {
          resource: ["group"],
          operation: ["get", "update", "delete"],
        },
      },
    },
    {
      displayName: "Group Data",
      name: "groupData",
      type: "json",
      required: true,
      default: "{}",
      description: "Full SCIM group payload",
      displayOptions: {
        show: {
          resource: ["group"],
          operation: ["create", "update"],
        },
      },
    },
  ],
};
