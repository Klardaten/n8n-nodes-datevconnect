/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import type { INodeTypeDescription } from "n8n-workflow";

/**
 * Configuration for the MasterData node
 */
export const masterDataNodeDescription: INodeTypeDescription = {
  displayName: "Klardaten DATEVconnect: Master Data",
  name: "masterData",
  icon: "file:../klardaten.svg",
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
						noDataExpression: true,
      options: [
        {
          name: "Addressee",
          value: "addressee",
        },
        {
          name: "Area of Responsibility",
          value: "areaOfResponsibility",
        },
        {
          name: "Bank",
          value: "bank",
        },
        {
          name: "Client",
          value: "client",
        },
        {
          name: "Client Category Type",
          value: "clientCategoryType",
        },
        {
          name: "Client Group Type",
          value: "clientGroupType",
        },
        {
          name: "Corporate Structure",
          value: "corporateStructure",
        },
        {
          name: "Country Code",
          value: "countryCode",
        },
        {
          name: "Employee",
          value: "employee",
        },
        {
          name: "Legal Form",
          value: "legalForm",
        },
        {
          name: "Relationship",
          value: "relationship",
        },
        {
          name: "Tax Authority",
          value: "taxAuthority",
        },
      ],
      default: "client",
    },
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
						noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["client"],
        },
      },
      options: [
        {
          name: "Create",
          value: "create",
          description: "Create a new client",
          action: "Create a client",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific client",
          action: "Get a client",
        },
        {
          name: "Get Categories",
          value: "getClientCategories",
          description: "Retrieve client categories",
          action: "Get client categories",
        },
        {
          name: "Get Deletion Log",
          value: "getDeletionLog",
          description: "Retrieve deleted clients",
          action: "Get client deletion log",
        },
        {
          name: "Get Groups",
          value: "getClientGroups",
          description: "Retrieve client groups",
          action: "Get client groups",
        },
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of clients",
          action: "Get many clients",
        },
        {
          name: "Get Next Free Number",
          value: "getNextFreeNumber",
          description: "Retrieve the next available client number",
          action: "Get next free client number",
        },
        {
          name: "Get Responsibilities",
          value: "getResponsibilities",
          description: "Retrieve responsibilities for a client",
          action: "Get client responsibilities",
        },
        {
          name: "Update",
          value: "update",
          description: "Update a specific client",
          action: "Update a client",
        },
        {
          name: "Update Categories",
          value: "updateClientCategories",
          description: "Replace a client's category assignments",
          action: "Update client categories",
        },
        {
          name: "Update Groups",
          value: "updateClientGroups",
          description: "Replace a client's group assignments",
          action: "Update client groups",
        },
        {
          name: "Update Responsibilities",
          value: "updateResponsibilities",
          description: "Replace a client's responsibilities",
          action: "Update client responsibilities",
        },
      ],
      default: "getAll",
    },
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
						noDataExpression: true,
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
						noDataExpression: true,
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
        {
          name: "Get Types",
          value: "getTypes",
          description: "Retrieve a list of relationship types",
          action: "Get relationship types",
        },
      ],
      default: "getAll",
    },

    {
      displayName: "Operation",
      name: "operation",
      type: "options",
						noDataExpression: true,
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
						noDataExpression: true,
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
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of employees",
          action: "Get many employees",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific employee",
          action: "Get an employee",
        },
        {
          name: "Create",
          value: "create",
          description: "Create a new employee",
          action: "Create an employee",
        },
        {
          name: "Update",
          value: "update",
          description: "Update a specific employee",
          action: "Update an employee",
        },
      ],
      default: "getAll",
    },
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
						noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["countryCode"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of countries",
          action: "Get many countries",
        },
      ],
      default: "getAll",
    },
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
						noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["clientGroupType"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of client group types",
          action: "Get many client group types",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific client group type",
          action: "Get a client group type",
        },
        {
          name: "Create",
          value: "create",
          description: "Create a new client group type",
          action: "Create a client group type",
        },
        {
          name: "Update",
          value: "update",
          description: "Update a specific client group type",
          action: "Update a client group type",
        },
      ],
      default: "getAll",
    },
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
						noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["clientCategoryType"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of client category types",
          action: "Get many client category types",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific client category type",
          action: "Get a client category type",
        },
        {
          name: "Create",
          value: "create",
          description: "Create a new client category type",
          action: "Create a client category type",
        },
        {
          name: "Update",
          value: "update",
          description: "Update a specific client category type",
          action: "Update a client category type",
        },
      ],
      default: "getAll",
    },
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
						noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["bank"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of banks",
          action: "Get many banks",
        },
      ],
      default: "getAll",
    },
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
						noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["areaOfResponsibility"],
        },
      },
      options: [
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of areas of responsibility",
          action: "Get many areas of responsibility",
        },
      ],
      default: "getAll",
    },
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
						noDataExpression: true,
      displayOptions: {
        show: {
          resource: ["addressee"],
        },
      },
      options: [
        {
          name: "Create",
          value: "create",
          description: "Create a new addressee",
          action: "Create an addressee",
        },
        {
          name: "Get",
          value: "get",
          description: "Retrieve a specific addressee",
          action: "Get an addressee",
        },
        {
          name: "Get Deletion Log",
          value: "getDeletionLog",
          description: "Retrieve a list of deleted addressees",
          action: "Get addressee deletion log",
        },
        {
          name: "Get Many",
          value: "getAll",
          description: "Retrieve a list of addressees",
          action: "Get many addressees",
        },
        {
          name: "Update",
          value: "update",
          description: "Update a specific addressee",
          action: "Update an addressee",
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
          operation: ["getAll", "getDeletionLog"],
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
          operation: ["getAll", "getDeletionLog"],
        },
      },
      typeOptions: {
        minValue: 0,
      },
      default: 0,
      description: "Number of records to skip from the start",
    },
    {
      displayName: "Limit",
      name: "top",
      type: "number",
      displayOptions: {
        show: {
          resource: ["taxAuthority", "relationship", "legalForm", "corporateStructure", "employee", "countryCode", "clientGroupType", "clientCategoryType", "bank", "areaOfResponsibility", "addressee"],
          operation: ["getAll", "getDeletionLog"],
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
          resource: ["taxAuthority", "relationship", "legalForm", "corporateStructure", "employee", "countryCode", "clientGroupType", "clientCategoryType", "bank", "areaOfResponsibility", "addressee"],
          operation: ["getAll", "getDeletionLog"],
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
          resource: ["client", "taxAuthority", "relationship", "legalForm", "corporateStructure", "employee", "countryCode", "clientGroupType", "clientCategoryType", "bank", "areaOfResponsibility", "addressee"],
          operation: [
            "getAll",
            "get",
            "getResponsibilities",
            "getClientCategories",
            "getClientGroups",
            "getDeletionLog",
            "getEstablishment",
            "getTypes",
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
          resource: ["client", "taxAuthority", "relationship", "corporateStructure", "employee", "countryCode", "clientGroupType", "clientCategoryType", "bank", "areaOfResponsibility", "addressee"],
          operation: ["getAll", "getDeletionLog", "getTypes"],
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
      default: 'german',
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
    {
      displayName: "Employee ID",
      name: "employeeId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          resource: ["employee"],
          operation: ["get", "update"],
        },
      },
      default: "",
      description: "The GUID of the employee",
    },
    {
      displayName: "Employee Data",
      name: "employeeData",
      type: "json",
      displayOptions: {
        show: {
          resource: ["employee"],
          operation: ["create", "update"],
        },
      },
      default: "{}",
      description: "Employee payload to send to the API",
    },
    {
      displayName: "Addressee ID",
      name: "addresseeId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          resource: ["addressee"],
          operation: ["get", "update"],
        },
      },
      default: "",
      description: "The GUID of the addressee",
    },
    {
      displayName: "Addressee Data",
      name: "addresseeData",
      type: "json",
      displayOptions: {
        show: {
          resource: ["addressee"],
          operation: ["create", "update"],
        },
      },
      default: "{}",
      description: "Addressee payload to send to the API",
    },
    {
      displayName: "National Right",
      name: "nationalRight",
      type: "options",
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
      displayOptions: {
        show: {
          resource: ["addressee"],
          operation: ["create"],
        },
      },
      default: 'german',
      description: "Parameter defines the national law that will be saved with the addressee",
    },
    {
      displayName: "Expand",
      name: "expand",
      type: "string",
      displayOptions: {
        show: {
          resource: ["addressee"],
          operation: ["get"],
        },
      },
      default: "",
      description: "Parameter to include subordinate objects (e.g., 'detail,addresses' or '*' for all)",
    },
    {
      displayName: "Client Group Type ID",
      name: "clientGroupTypeId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          resource: ["clientGroupType"],
          operation: ["get", "update"],
        },
      },
      default: "",
      description: "The GUID of the client group type",
    },
    {
      displayName: "Client Group Type Data",
      name: "clientGroupTypeData",
      type: "json",
      displayOptions: {
        show: {
          resource: ["clientGroupType"],
          operation: ["create", "update"],
        },
      },
      default: "{}",
      description: "Client group type payload to send to the API",
    },
    {
      displayName: "Client Category Type ID",
      name: "clientCategoryTypeId",
      type: "string",
      required: true,
      displayOptions: {
        show: {
          resource: ["clientCategoryType"],
          operation: ["get", "update"],
        },
      },
      default: "",
      description: "The GUID of the client category type",
    },
    {
      displayName: "Client Category Type Data",
      name: "clientCategoryTypeData",
      type: "json",
      displayOptions: {
        show: {
          resource: ["clientCategoryType"],
          operation: ["create", "update"],
        },
      },
      default: "{}",
      description: "Client category type payload to send to the API",
    },
  ],
};
