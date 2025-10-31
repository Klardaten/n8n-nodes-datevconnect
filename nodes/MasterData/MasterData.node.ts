import {
  NodeApiError,
  NodeOperationError,
  type IDataObject,
  type IExecuteFunctions,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
  type JsonObject,
} from "n8n-workflow";

import {
  authenticate,
  createClient,
  fetchClient,
  fetchClientCategories,
  fetchClientDeletionLog,
  fetchClientGroups,
  fetchClientResponsibilities,
  fetchClients,
  fetchNextFreeClientNumber,
  fetchTaxAuthorities,
  updateClient,
  updateClientCategories,
  updateClientGroups,
  updateClientResponsibilities,
  type JsonValue,
} from "../../src/services/datevConnectClient";

export const clientApi = {
  authenticate,
  fetchClients,
  fetchClient,
  createClient,
  updateClient,
  fetchClientResponsibilities,
  updateClientResponsibilities,
  fetchClientCategories,
  updateClientCategories,
  fetchClientGroups,
  updateClientGroups,
  fetchClientDeletionLog,
  fetchNextFreeClientNumber,
  fetchTaxAuthorities,
};

function toErrorObject(error: unknown): JsonObject {
  if (error && typeof error === "object") {
    return error as JsonObject;
  }

  const message = error instanceof Error ? error.message : String(error ?? "Unknown error");
  return { message } satisfies JsonObject;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (error === null || error === undefined) {
    return "Unknown error";
  }

  return typeof error === "string" ? error : JSON.stringify(error);
}

function normaliseToObjects(data: JsonValue): IDataObject[] {
  if (Array.isArray(data)) {
    return data.map((entry) => {
      if (entry && typeof entry === "object") {
        return entry as IDataObject;
      }
      return { value: entry ?? null };
    });
  }

  if (data && typeof data === "object") {
    return [data as IDataObject];
  }

  return [{ value: data ?? null }];
}

interface MasterDataCredentials {
  host: string;
  email: string;
  password: string;
  clientInstanceId: string;
}

export class MasterData implements INodeType {
  description: INodeTypeDescription = {
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
            resource: ["client", "taxAuthority"],
            operation: [
              "getAll",
              "get",
              "getResponsibilities",
              "getClientCategories",
              "getClientGroups",
              "getDeletionLog",
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
            resource: ["client", "taxAuthority"],
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
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const credentials = (await this.getCredentials("datevConnectApi")) as
      | MasterDataCredentials
      | null;

    if (!credentials) {
      throw new NodeOperationError(this.getNode(), "DATEVconnect credentials are missing");
    }

    const { host, email, password, clientInstanceId } = credentials;

    if (!host || !email || !password || !clientInstanceId) {
      throw new NodeOperationError(this.getNode(), "All DATEVconnect credential fields must be provided");
    }

    let token: string;

    try {
      const authResponse = await clientApi.authenticate({
        host,
        email,
        password,
      });
      token = authResponse.access_token;
    } catch (error) {
      throw new NodeApiError(this.getNode(), toErrorObject(error));
    }

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const resource = this.getNodeParameter("resource", itemIndex) as string;
      const operation = this.getNodeParameter("operation", itemIndex) as string;

      const getOptionalString = (name: string): string | undefined => {
        const value = this.getNodeParameter(name, itemIndex, "") as string;
        if (typeof value !== "string" || value.trim().length === 0) {
          return undefined;
        }
        return value;
      };

      const parseJsonParameter = (rawValue: unknown, parameterLabel: string): JsonValue => {
        if (rawValue === null || rawValue === undefined) {
          throw new NodeOperationError(
            this.getNode(),
            `Parameter "${parameterLabel}" must be provided.`,
            { itemIndex },
          );
        }

        if (typeof rawValue === "string") {
          try {
            return JSON.parse(rawValue) as JsonValue;
          } catch (error) {
            throw new NodeOperationError(
              this.getNode(),
              `Parameter "${parameterLabel}" contains invalid JSON: ${toErrorMessage(error)}`,
              { itemIndex },
            );
          }
        }

        return rawValue as JsonValue;
      };

      const sendSuccess = (payload?: JsonValue): void => {
        const formattedItems = normaliseToObjects(payload ?? { success: true });
        const executionData = this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(formattedItems),
          { itemData: { item: itemIndex } },
        );
        returnData.push(...executionData);
      };

      try {
        let response: JsonValue | undefined;

        switch (resource) {
          case "client": {
            switch (operation) {
              case "getAll": {
                const top = this.getNodeParameter("top", itemIndex, 100) as number;
                const skip = this.getNodeParameter("skip", itemIndex, 0) as number;
                const select = getOptionalString("select");
                const filter = getOptionalString("filter");

                response = await clientApi.fetchClients({
                  host,
                  token,
                  clientInstanceId,
                  top,
                  skip,
                  select,
                  filter,
                });
                break;
              }
              case "get": {
                const clientId = this.getNodeParameter("clientId", itemIndex) as string;
                const select = getOptionalString("select");

                response = await clientApi.fetchClient({
                  host,
                  token,
                  clientInstanceId,
                  clientId,
                  select,
                });
                break;
              }
              case "create": {
                const rawClient = this.getNodeParameter("clientData", itemIndex) as
                  | JsonValue
                  | string;
                const clientPayload = parseJsonParameter(rawClient, "Client Data");
                const maxNumber = this.getNodeParameter("maxNumber", itemIndex, 0) as number;

                response = await clientApi.createClient({
                  host,
                  token,
                  clientInstanceId,
                  client: clientPayload,
                  maxNumber: typeof maxNumber === "number" && maxNumber > 0 ? maxNumber : undefined,
                });
                break;
              }
              case "update": {
                const clientId = this.getNodeParameter("clientId", itemIndex) as string;
                const rawClient = this.getNodeParameter("clientData", itemIndex) as
                  | JsonValue
                  | string;
                const clientPayload = parseJsonParameter(rawClient, "Client Data");

                response = await clientApi.updateClient({
                  host,
                  token,
                  clientInstanceId,
                  clientId,
                  client: clientPayload,
                });
                break;
              }
              case "getResponsibilities": {
                const clientId = this.getNodeParameter("clientId", itemIndex) as string;
                const select = getOptionalString("select");

                response = await clientApi.fetchClientResponsibilities({
                  host,
                  token,
                  clientInstanceId,
                  clientId,
                  select,
                });
                break;
              }
              case "updateResponsibilities": {
                const clientId = this.getNodeParameter("clientId", itemIndex) as string;
                const rawResponsibilities = this.getNodeParameter(
                  "responsibilitiesData",
                  itemIndex,
                ) as JsonValue | string;
                const responsibilitiesPayload = parseJsonParameter(
                  rawResponsibilities,
                  "Responsibilities",
                );

                response = await clientApi.updateClientResponsibilities({
                  host,
                  token,
                  clientInstanceId,
                  clientId,
                  responsibilities: responsibilitiesPayload,
                });
                break;
              }
              case "getClientCategories": {
                const clientId = this.getNodeParameter("clientId", itemIndex) as string;
                const select = getOptionalString("select");

                response = await clientApi.fetchClientCategories({
                  host,
                  token,
                  clientInstanceId,
                  clientId,
                  select,
                });
                break;
              }
              case "updateClientCategories": {
                const clientId = this.getNodeParameter("clientId", itemIndex) as string;
                const rawCategories = this.getNodeParameter("categoriesData", itemIndex) as
                  | JsonValue
                  | string;
                const categoriesPayload = parseJsonParameter(rawCategories, "Client Categories");

                response = await clientApi.updateClientCategories({
                  host,
                  token,
                  clientInstanceId,
                  clientId,
                  categories: categoriesPayload,
                });
                break;
              }
              case "getClientGroups": {
                const clientId = this.getNodeParameter("clientId", itemIndex) as string;
                const select = getOptionalString("select");

                response = await clientApi.fetchClientGroups({
                  host,
                  token,
                  clientInstanceId,
                  clientId,
                  select,
                });
                break;
              }
              case "updateClientGroups": {
                const clientId = this.getNodeParameter("clientId", itemIndex) as string;
                const rawGroups = this.getNodeParameter("groupsData", itemIndex) as
                  | JsonValue
                  | string;
                const groupsPayload = parseJsonParameter(rawGroups, "Client Groups");

                response = await clientApi.updateClientGroups({
                  host,
                  token,
                  clientInstanceId,
                  clientId,
                  groups: groupsPayload,
                });
                break;
              }
              case "getDeletionLog": {
                const select = getOptionalString("select");
                const filter = getOptionalString("filter");

                response = await clientApi.fetchClientDeletionLog({
                  host,
                  token,
                  clientInstanceId,
                  select,
                  filter,
                });
                break;
              }
              case "getNextFreeNumber": {
                const start = this.getNodeParameter("start", itemIndex, 1) as number;
                const range = this.getNodeParameter("range", itemIndex, 0) as number;

                response = await clientApi.fetchNextFreeClientNumber({
                  host,
                  token,
                  clientInstanceId,
                  start,
                  range: typeof range === "number" && range > 0 ? range : undefined,
                });
                break;
              }
              default:
                throw new NodeOperationError(
                  this.getNode(),
                  `The operation "${operation}" is not supported for resource "${resource}".`,
                  { itemIndex },
                );
            }
            break;
          }
          case "taxAuthority": {
            if (operation !== "getAll") {
              throw new NodeOperationError(
                this.getNode(),
                `The operation "${operation}" is not supported for resource "${resource}".`,
                { itemIndex },
              );
            }

            const select = getOptionalString("select");
            const filter = getOptionalString("filter");

            response = await clientApi.fetchTaxAuthorities({
              host,
              token,
              clientInstanceId,
              select,
              filter,
            });
            break;
          }
          default:
            throw new NodeOperationError(
              this.getNode(),
              `The resource "${resource}" is not supported.`,
              { itemIndex },
            );
        }

        sendSuccess(response);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: toErrorMessage(error),
            },
            pairedItem: { item: itemIndex },
          });
          continue;
        }

        throw new NodeApiError(this.getNode(), toErrorObject(error), { itemIndex });
      }
    }

    return [returnData];
  }
}
