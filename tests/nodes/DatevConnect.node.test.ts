import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type { IExecuteFunctions } from "n8n-workflow";
import type {
  AuthenticateOptions,
  FetchClientsOptions,
  JsonValue,
} from "../../src/services/datevConnectClient";

const { DatevConnect, clientApi } = await import(
  "../../nodes/DatevConnect/DatevConnect.node",
);

const realAuthenticate = clientApi.authenticate;
const realFetchClients = clientApi.fetchClients;

const authenticateMock = mock(async () => ({ token: "token-123" }));
const fetchClientsMock = mock(async () => [] as JsonValue);

type InputItem = { json: Record<string, unknown> };

type ExecuteContextOptions = {
  items?: InputItem[];
  credentials?: Record<string, string> | null;
  parameters?: Record<string, Array<unknown> | unknown>;
  continueOnFail?: boolean;
};

function createExecuteContext(options: ExecuteContextOptions = {}) {
  const {
    items = [{ json: {} }],
    credentials = {
      host: "https://api.example.com",
      email: "user@example.com",
      password: "secret",
      clientInstanceId: "instance-1",
    },
    parameters = {},
    continueOnFail = false,
  } = options;

  const parameterValues = new Map<string, Array<unknown>>();

  for (const [name, value] of Object.entries(parameters)) {
    parameterValues.set(name, Array.isArray(value) ? value : [value]);
  }

  return {
    getInputData() {
      return items;
    },
    async getCredentials() {
      return credentials;
    },
    getNodeParameter(name: string, itemIndex: number, defaultValue?: unknown) {
      const values = parameterValues.get(name);
      if (!values || values[itemIndex] === undefined) {
        return defaultValue;
      }
      return values[itemIndex];
    },
    getNode() {
      return { name: "DatevConnect" };
    },
    helpers: {
      returnJsonArray(data: Array<Record<string, unknown>>) {
        return data.map((entry) => ({ json: entry }));
      },
      constructExecutionMetaData<T>(
        data: Array<{ json: Record<string, unknown> }> & T[],
        { itemData }: { itemData: { item: number } },
      ) {
        return data.map((entry) => ({
          ...entry,
          pairedItem: itemData,
        }));
      },
    },
    continueOnFail() {
      return continueOnFail;
    },
  };
}

describe("DatevConnect node", () => {
  beforeEach(() => {
    authenticateMock.mockClear();
    authenticateMock.mockImplementation(async () => ({ token: "token-123" }));
    fetchClientsMock.mockClear();
    fetchClientsMock.mockImplementation(async () => [] as JsonValue);
    clientApi.authenticate = authenticateMock as typeof clientApi.authenticate;
    clientApi.fetchClients = fetchClientsMock as typeof clientApi.fetchClients;
  });

  afterEach(() => {
    clientApi.authenticate = realAuthenticate;
    clientApi.fetchClients = realFetchClients;
  });

  test("authenticates once and fetches clients for each input item", async () => {
    fetchClientsMock.mockImplementationOnce(async () => [
      { id: 1, name: "First" },
      { id: 2, name: "Second" },
    ]);
    fetchClientsMock.mockImplementationOnce(async () => "fallback value");

    const node = new DatevConnect();
    const context = createExecuteContext({
      items: [{ json: {} }, { json: {} }],
      parameters: {
        resource: ["client", "client"],
        operation: ["getAll", "getAll"],
        top: [50, 25],
        skip: [0, 10],
      },
    });

    const result = await node.execute.call(context as unknown as IExecuteFunctions);

    expect(authenticateMock).toHaveBeenCalledTimes(1);
    const authCall = authenticateMock.mock.calls[0] as unknown as
      | [AuthenticateOptions]
      | undefined;
    expect(authCall).toBeDefined();
    expect(authCall![0]).toMatchObject({
      host: "https://api.example.com",
      email: "user@example.com",
      password: "secret",
      clientInstanceId: "instance-1",
    });

    expect(fetchClientsMock).toHaveBeenCalledTimes(2);
    const firstFetchCall = fetchClientsMock.mock.calls[0] as unknown as
      | [FetchClientsOptions]
      | undefined;
    const secondFetchCall = fetchClientsMock.mock.calls[1] as unknown as
      | [FetchClientsOptions]
      | undefined;
    expect(firstFetchCall).toBeDefined();
    expect(secondFetchCall).toBeDefined();
    expect(firstFetchCall![0]).toMatchObject({
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      top: 50,
      skip: 0,
    });
    expect(secondFetchCall![0]).toMatchObject({
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      top: 25,
      skip: 10,
    });

    expect(result).toEqual([
      [
        { json: { id: 1, name: "First" }, pairedItem: { item: 0 } },
        { json: { id: 2, name: "Second" }, pairedItem: { item: 0 } },
        { json: { value: "fallback value" }, pairedItem: { item: 1 } },
      ],
    ]);
  });

  test("returns error information when continueOnFail is enabled", async () => {
    fetchClientsMock.mockImplementation(async () => {
      throw new Error("Request failed");
    });

    const node = new DatevConnect();
    const context = createExecuteContext({
      items: [{ json: {} }],
      parameters: {
        resource: "client",
        operation: "getAll",
      },
      continueOnFail: true,
    });

    const result = await node.execute.call(context as unknown as IExecuteFunctions);

    expect(result).toEqual([
      [
        {
          json: { error: "Request failed" },
          pairedItem: { item: 0 },
        },
      ],
    ]);
  });
});
