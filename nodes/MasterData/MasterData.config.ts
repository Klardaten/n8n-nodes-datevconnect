import type { INodeTypeDescription } from "n8n-workflow";

/**
 * Configuration for the MasterData node
 */
export const masterDataNodeDescription: INodeTypeDescription = {
  displayName: "Klardaten DATEVconnect: Master Data",
  name: "masterData",
  icon: "file:datevConnect.svg",
  group: ["transform"],
  version: 1,
  description: "Interact with master data resources",
  defaults: {
    name: "Master Data",
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
      options: [
        {
          name: "Client",
          value: "client",
        },
        {
          name: "Tax Authority",
          value: "taxAuthority",
        },
        {
          name: "Relationship",
          value: "relationship",
        },
        {
          name: "Relationship Type",
          value: "relationshipType",
        },
        {
          name: "Legal Form",
          value: "legalForm",
        },
        {
          name: "Corporate Structure",
          value: "corporateStructure",
        },
      ],
      default: "client",
    },
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      displayOptions: {
        show: {
          resource: ["client"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of clients",
          action: "Get many clients",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific client",
          action: "Get a client",
        },
        {
          name: "Create",
          value: "create",
          description: "Create a new client",
          action: "Create a client",
        },
        {
          name: "Update",
          value: "update",
          description: "Update a specific client",
          action: "Update a client",
        },
        {
          name: "Get Responsibilities",
          value: "getResponsibilities",
          description: "Retrieve responsibilities for a client",
          action: "Get client responsibilities",
        },
        {
          name: "Update Responsibilities",
          value: "updateResponsibilities",
          description: "Replace a client's responsibilities",
          action: "Update client responsibilities",
        },
        {
          name: "Get Categories",
          value: "getClientCategories",
          description: "Retrieve client categories",
          action: "Get client categories",
        },
        {
          name: "Update Categories",
          value: "updateClientCategories",
          description: "Replace a client's category assignments",
          action: "Update client categories",
        },
        {
          name: "Get Groups",
          value: "getClientGroups",
          description: "Retrieve client groups",
          action: "Get client groups",
        },
        {
          name: "Update Groups",
          value: "updateClientGroups",
          description: "Replace a client's group assignments",
          action: "Update client groups",
        },
        {
          name: "Get Deletion Log",
          value: "getDeletionLog",
          description: "Retrieve deleted clients",
          action: "Get client deletion log",
        },
        {
          name: "Get Next Free Number",
          value: "getNextFreeNumber",
          description: "Retrieve the next available client number",
          action: "Get next free client number",
        },
      ],
      default: "getAll",
    },
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      displayOptions: {
        show: {
          resource: ["taxAuthority"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of tax authorities",
          action: "Get many tax authorities",
        },
      ],
      default: "getAll",
    },
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      displayOptions: {
        show: {
          resource: ["relationship"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of relationships",
          action: "Get many relationships",
        },
      ],
      default: "getAll",
    },
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      displayOptions: {
        show: {
          resource: ["relationshipType"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of relationship types",
          action: "Get many relationship types",
        },
      ],
      default: "getAll",
    },
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      displayOptions: {
        show: {
          resource: ["legalForm"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of legal forms",
          action: "Get many legal forms",
        },
      ],
      default: "getAll",
    },
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      displayOptions: {
        show: {
          resource: ["corporateStructure"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of corporate structures",
          action: "Get many corporate structures",
        },
        {
          name: "Get Organization",
          value: "get",
          description: "Retrieve a specific organization",
          action: "Get an organization",
        },
        {
          name: "Get Establishment",
          value: "getEstablishment",
          description: "Retrieve a specific establishment",
          action: "Get an establishment",
        },
      ],
      default: "getAll",
    },
    {
      displayName: "Limit",
      name: "top",
      type: "number",
      displayOptions: {
        show: {
          resource: ["client"],
          operation: ["getAll"],
        },
      },
      typeOptions: {
        minValue: 1,
      },
      default: 100,
      description: "Maximum number of records to return",
    },
    {
      displayName: "Skip",
      name: "skip",
      type: "number",
      displayOptions: {
        show: {
          resource: ["client"],
          operation: ["getAll"],
        },
      },
      typeOptions: {
        minValue: 0,
      },
      default: 0,
      description: "Number of records to skip from the start",
    },
    {
      displayName: "Select Fields",
      name: "select",
      type: "string",
      displayOptions: {
        show: {
          resource: ["client", "taxAuthority", "relationship", "relationshipType", "legalForm", "corporateStructure"],
          operation: [
            "getAll",
            "get",
            "getResponsibilities",
            "getClientCategories",
            "getClientGroups",
            "getDeletionLog",
            "getEstablishment",
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
          resource: ["client", "taxAuthority", "relationship", "relationshipType", "corporateStructure"],
          operation: ["getAll", "getDeletionLog"],
        },
      },
      default: "",
      description: "Filter expression as defined by the DATEV API",
    },
    {
      displayName: "Client ID",
      name: "clientId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          resource: ["client"],
          operation: [
            "get",
            "update",
            "getResponsibilities",
            "updateResponsibilities",
            "getClientCategories",
            "updateClientCategories",
            "getClientGroups",
            "updateClientGroups",
          ],
        },
      },
      default: "",
    },
    {
      displayName: "Client Data",
      name: "clientData",
      type: "json",
      displayOptions: {
        show: {
          resource: ["client"],
          operation: ["create", "update"],
        },
      },
      default: "{}",
      description: "Client payload to send to the API",
    },
    {
      displayName: "Max Number",
      name: "maxNumber",
      type: "number",
      displayOptions: {
        show: {
          resource: ["client"],
          operation: ["create"],
        },
      },
      typeOptions: {
        minValue: 1,
      },
      default: 0,
      description: "Optional max-number parameter when letting the API allocate a number",
    },
    {
      displayName: "Responsibilities",
      name: "responsibilitiesData",
      type: "json",
      displayOptions: {
        show: {
          resource: ["client"],
          operation: ["updateResponsibilities"],
        },
      },
      default: "[]",
      description: "Array of responsibilities to set for the client",
    },
    {
      displayName: "Client Categories",
      name: "categoriesData",
      type: "json",
      displayOptions: {
        show: {
          resource: ["client"],
          operation: ["updateClientCategories"],
        },
      },
      default: "[]",
      description: "Array of client categories to set for the client",
    },
    {
      displayName: "Client Groups",
      name: "groupsData",
      type: "json",
      displayOptions: {
        show: {
          resource: ["client"],
          operation: ["updateClientGroups"],
        },
      },
      default: "[]",
      description: "Array of client groups to set for the client",
    },
    {
      displayName: "Start Number",
      name: "start",
      type: "number",
      displayOptions: {
        show: {
          resource: ["client"],
          operation: ["getNextFreeNumber"],
        },
      },
      typeOptions: {
        minValue: 1,
      },
      default: 1,
      description: "Starting number for the search",
    },
    {
      displayName: "Range",
      name: "range",
      type: "number",
      displayOptions: {
        show: {
          resource: ["client"],
          operation: ["getNextFreeNumber"],
        },
      },
      typeOptions: {
        minValue: 0,
      },
      default: 0,
      description: "Optional range for the next free number search",
    },
    {
      displayName: "National Right",
      name: "nationalRight",
      type: "options",
      displayOptions: {
        show: {
          resource: ["legalForm"],
          operation: ["getAll"],
        },
      },
      options: [
        {
          name: "German",
          value: "german",
        },
        {
          name: "Austrian",
          value: "austrian",
        },
      ],
      default: "",
      description: "Filter legal forms by national law (German or Austrian)",
    },
    {
      displayName: "Organization ID",
      name: "organizationId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          resource: ["corporateStructure"],
          operation: ["get", "getEstablishment"],
        },
      },
      default: "",
      description: "The GUID of the organization",
    },
    {
      displayName: "Establishment ID",
      name: "establishmentId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          resource: ["corporateStructure"],
          operation: ["getEstablishment"],
        },
      },
      default: "",
      description: "The GUID of the establishment",
    },
  ],
};