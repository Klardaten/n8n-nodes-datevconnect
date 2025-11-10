/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import type { INodeTypeDescription } from "n8n-workflow";

/**
 * Configuration for the DocumentManagement node
 */
export const documentManagementNodeDescription: INodeTypeDescription = {
  displayName: "Klardaten DATEVconnect: Document Management",
  name: "documentManagement",
  icon: "file:../klardaten.svg",
  group: ["transform"],
  version: 1,
  description: "Interact with document management resources / DMS",
  defaults: {
    name: "Document Management",
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
          name: "Document",
          value: "document",
        },
        {
          name: "Document File",
          value: "documentFile",
        },
        {
          name: "Document State",
          value: "documentState",
        },
        {
          name: "Domain",
          value: "domain",
        },
        {
          name: "Individual Property",
          value: "individualProperty",
        },
        {
          name: "Individual Reference 1",
          value: "individualReference1",
        },
        {
          name: "Individual Reference 2",
          value: "individualReference2",
        },
        {
          name: "Info",
          value: "info",
        },
        {
          name: "Property Template",
          value: "propertyTemplate",
        },
        {
          name: "Secure Area",
          value: "secureArea",
        },
      ],
      default: "document",
    },

    // Document Operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["document"],
        },
      },
      options: [
        {
          name: "Add Structure Item",
          value: "addStructureItem",
          description: "Add a structure item to a document",
          action: "Add structure item",
        },
        {
          name: "Create",
          value: "create",
          description: "Create a new document",
          action: "Create a document",
        },
        {
          name: "Create Dispatcher Information",
          value: "createDispatcherInformation",
          description: "Create dispatcher information for a document",
          action: "Create dispatcher information",
        },
        {
          name: "Delete",
          value: "delete",
          description: "Delete a document",
          action: "Delete a document",
        },
        {
          name: "Delete Permanently",
          value: "deletePermanently",
          description: "Permanently delete a document",
          action: "Delete a document permanently",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific document",
          action: "Get a document",
        },
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of documents",
          action: "Get many documents",
        },
        {
          name: "Get Structure Item",
          value: "getStructureItem",
          description: "Get a specific structure item",
          action: "Get structure item",
        },
        {
          name: "Get Structure Items",
          value: "getStructureItems",
          description: "Get structure items of a document",
          action: "Get structure items",
        },
        {
          name: "Update",
          value: "update",
          description: "Update a document",
          action: "Update a document",
        },
        {
          name: "Update Structure Item",
          value: "updateStructureItem",
          description: "Update a structure item",
          action: "Update structure item",
        },
      ],
      default: "getAll",
    },

    // Document File Operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["documentFile"],
        },
      },
      options: [
        {
          name: "Get",
          value: "get",
          description: "Get a document file",
          action: "Get a document file",
        },
        {
          name: "Upload",
          value: "upload",
          description: "Upload a document file",
          action: "Upload a document file",
        },
      ],
      default: "get",
    },

    // Domain Operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["domain"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: 'Get many domains',
          action: "Get many domains",
        },
      ],
      default: "getAll",
    },

    // Document State Operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["documentState"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: 'Get many document states',
          action: "Get many document states",
        },
        {
          name: "Get",
          value: "get",
          description: "Get a specific document state",
          action: "Get a document state",
        },
        {
          name: "Create",
          value: "create",
          description: "Create a new document state",
          action: "Create a document state",
        },
      ],
      default: "getAll",
    },

    // Secure Area Operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["secureArea"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: 'Retrieve many secure areas',
          action: "Get many secure areas",
        },
      ],
      default: "getAll",
    },

    // Property Template Operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["propertyTemplate"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: 'Retrieve many property templates',
          action: "Get many property templates",
        },
      ],
      default: "getAll",
    },

    // Individual Property Operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["individualProperty"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: 'Retrieve many individual properties',
          action: "Get many individual properties",
        },
      ],
      default: "getAll",
    },

    // Individual Reference 1 Operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["individualReference1"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: 'Retrieve many individual references 1',
          action: "Get many individual references 1",
        },
        {
          name: "Create",
          value: "create",
          description: "Create a new individual reference 1",
          action: "Create individual reference 1",
        },
      ],
      default: "getAll",
    },

    // Individual Reference 2 Operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["individualReference2"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: 'Retrieve many individual references 2',
          action: "Get many individual references 2",
        },
        {
          name: "Create",
          value: "create",
          description: "Create a new individual reference 2",
          action: "Create individual reference 2",
        },
      ],
      default: "getAll",
    },

    // Info Operations
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["info"],
        },
      },
      options: [
        {
          name: "Get",
          value: "get",
          description: "Get system information",
          action: "Get system info",
        },
      ],
      default: "get",
    },

    // Common Parameters
    {
      displayName: "Document ID",
      name: "documentId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          resource: ["document"],
          operation: [
            "get",
            "update",
            "delete",
            "deletePermanently",
            "getStructureItems",
            "addStructureItem",
            "getStructureItem",
            "updateStructureItem",
            "createDispatcherInformation",
          ],
        },
      },
      default: "",
      description: "The unique ID of the document",
    },

    {
      displayName: "Document File ID",
      name: "documentFileId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          resource: ["documentFile"],
          operation: ["get"],
        },
      },
      default: "",
      description: "The unique ID of the document file",
    },

    {
      displayName: "State ID",
      name: "stateId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          resource: ["documentState"],
          operation: ["get"],
        },
      },
      default: "",
      description: "The unique ID of the document state",
    },

    {
      displayName: "Structure Item ID",
      name: "structureItemId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          resource: ["document"],
          operation: ["getStructureItem", "updateStructureItem"],
        },
      },
      default: "",
      description: "The unique ID of the structure item",
    },

    // JSON Data Parameters
    {
      displayName: "Document Data",
      name: "documentData",
      type: "json",
      required: true,
      displayOptions: {
        show: {
          resource: ["document"],
          operation: ["create", "update"],
        },
      },
      default: "{}",
      description: "The document data as JSON",
    },

    {
      displayName: "Binary Data",
      name: "binaryData",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          resource: ["documentFile"],
          operation: ["upload"],
        },
      },
      default: "",
      description: "The binary file data to upload (application/octet-stream format)",
      placeholder: "Binary file content",
    },

    {
      displayName: "Structure Item Data",
      name: "structureItemData",
      type: "json",
      required: true,
      displayOptions: {
        show: {
          resource: ["document"],
          operation: ["addStructureItem", "updateStructureItem"],
        },
      },
      default: "{}",
      description: "The structure item data as JSON",
    },

    {
      displayName: "State Data",
      name: "stateData",
      type: "json",
      required: true,
      displayOptions: {
        show: {
          resource: ["documentState"],
          operation: ["create"],
        },
      },
      default: "{}",
      description: "The state data as JSON",
    },

    {
      displayName: "Dispatcher Data",
      name: "dispatcherData",
      type: "json",
      required: true,
      displayOptions: {
        show: {
          resource: ["document"],
          operation: ["createDispatcherInformation"],
        },
      },
      default: "{}",
      description: "The dispatcher information data as JSON",
    },

    {
      displayName: "Individual Reference Data",
      name: "individualReferenceData",
      type: "json",
      required: true,
      displayOptions: {
        show: {
          resource: ["individualReference1", "individualReference2"],
          operation: ["create"],
        },
      },
      default: "{}",
      description: "The individual reference data as JSON",
    },

    // Optional Parameters
    {
      displayName: "Filter",
      name: "filter",
      type: "string",
      displayOptions: {
        show: {
          resource: ["document", "domain", "documentState", "propertyTemplate"],
          operation: ["getAll"],
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
          resource: ["document", "individualReference1", "individualReference2"],
          operation: ["getAll", "getStructureItems"],
        },
      },
      default: 0,
      description: "Maximum number of results to return (0 = no limit)",
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
          resource: ["document", "individualReference1", "individualReference2"],
          operation: ["getAll", "getStructureItems"],
        },
      },
      default: 0,
      description: "Number of results to skip",
    },

    {
      displayName: "Insert Position",
      name: "insertPosition",
      type: "options",
      options: [
        {
          name: "First",
          value: "first",
        },
        {
          name: "Last",
          value: "last",
        },
      ],
      displayOptions: {
        show: {
          resource: ["document"],
          operation: ["addStructureItem"],
        },
      },
      default: "last",
      description: "Position where to insert the structure item",
    },
  ],
};
