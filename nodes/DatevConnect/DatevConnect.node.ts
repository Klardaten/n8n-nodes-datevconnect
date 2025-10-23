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
  fetchClients,
  type JsonValue,
} from "../../src/services/datevConnectClient";

export const clientApi = {
  authenticate,
  fetchClients,
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

interface DatevConnectCredentials {
  host: string;
  email: string;
  password: string;
  clientInstanceId: string;
}

export class DatevConnect implements INodeType {
  description: INodeTypeDescription = {
    displayName: "DATEVconnect",
    name: "datevConnect",
    icon: "file:datevConnect.svg",
    group: ["transform"],
    version: 1,
    description: "Interact with DATEVconnect master data",
    defaults: {
      name: "DATEVconnect",
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
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const credentials = (await this.getCredentials("datevConnectApi")) as
      | DatevConnectCredentials
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

      if (resource !== "client" || operation !== "getAll") {
        throw new NodeOperationError(
          this.getNode(),
          `The operation "${operation}" is not supported for resource "${resource}".`,
          { itemIndex },
        );
      }

      const top = this.getNodeParameter("top", itemIndex, 100) as number;
      const skip = this.getNodeParameter("skip", itemIndex, 0) as number;

      try {
        const response = await clientApi.fetchClients({
          host,
          token,
          clientInstanceId,
          top,
          skip,
        });

        const formattedItems = normaliseToObjects(response);
        const executionData = this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(formattedItems),
          { itemData: { item: itemIndex } },
        );
        returnData.push(...executionData);
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
