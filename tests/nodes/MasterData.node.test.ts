import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type { IExecuteFunctions } from "n8n-workflow";
import type {
  AuthenticateOptions,
  CreateClientOptions,
  FetchClientCategoriesOptions,
  FetchClientDeletionLogOptions,
  FetchClientGroupsOptions,
  FetchClientOptions,
  FetchClientResponsibilitiesOptions,
  FetchClientsOptions,
  FetchNextFreeClientNumberOptions,
  FetchTaxAuthoritiesOptions,
  JsonValue,
  UpdateClientCategoriesOptions,
  UpdateClientGroupsOptions,
  UpdateClientOptions,
  UpdateClientResponsibilitiesOptions,
} from "../../src/services/datevConnectClient";

const { MasterData, clientApi } = await import(
  "../../nodes/MasterData/MasterData.node",
);

const realAuthenticate = clientApi.authenticate;
const realFetchClients = clientApi.fetchClients;
const realFetchClient = clientApi.fetchClient;
const realCreateClient = clientApi.createClient;
const realUpdateClient = clientApi.updateClient;
const realFetchClientResponsibilities = clientApi.fetchClientResponsibilities;
const realUpdateClientResponsibilities = clientApi.updateClientResponsibilities;
const realFetchClientCategories = clientApi.fetchClientCategories;
const realUpdateClientCategories = clientApi.updateClientCategories;
const realFetchClientGroups = clientApi.fetchClientGroups;
const realUpdateClientGroups = clientApi.updateClientGroups;
const realFetchClientDeletionLog = clientApi.fetchClientDeletionLog;
const realFetchNextFreeClientNumber = clientApi.fetchNextFreeClientNumber;
const realFetchTaxAuthorities = clientApi.fetchTaxAuthorities;

const authenticateMock = mock(async () => ({ access_token: "token-123" }));
const fetchClientsMock = mock(async () => [] as JsonValue);
const fetchClientMock = mock(async () => ({ id: "client" } as JsonValue));
const createClientMock = mock(async () => undefined);
const updateClientMock = mock(async () => undefined);
const fetchClientResponsibilitiesMock = mock(async () => [] as JsonValue);
const updateClientResponsibilitiesMock = mock(async () => undefined);
const fetchClientCategoriesMock = mock(async () => [] as JsonValue);
const updateClientCategoriesMock = mock(async () => undefined);
const fetchClientGroupsMock = mock(async () => [] as JsonValue);
const updateClientGroupsMock = mock(async () => undefined);
const fetchClientDeletionLogMock = mock(async () => [] as JsonValue);
const fetchNextFreeClientNumberMock = mock(async () => ({ next_free_number: 100 } as JsonValue));
const fetchTaxAuthoritiesMock = mock(async () => [] as JsonValue);

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
      return { name: "MasterData" };
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

describe("MasterData node", () => {
  beforeEach(() => {
    authenticateMock.mockClear();
    authenticateMock.mockImplementation(async () => ({ access_token: "token-123" }));
    fetchClientsMock.mockClear();
    fetchClientsMock.mockImplementation(async () => [] as JsonValue);
    fetchClientMock.mockClear();
    fetchClientMock.mockImplementation(async () => ({ id: "client" } as JsonValue));
    createClientMock.mockClear();
    createClientMock.mockImplementation(async () => undefined);
    updateClientMock.mockClear();
    updateClientMock.mockImplementation(async () => undefined);
    fetchClientResponsibilitiesMock.mockClear();
    fetchClientResponsibilitiesMock.mockImplementation(async () => [] as JsonValue);
    updateClientResponsibilitiesMock.mockClear();
    updateClientResponsibilitiesMock.mockImplementation(async () => undefined);
    fetchClientCategoriesMock.mockClear();
    fetchClientCategoriesMock.mockImplementation(async () => [] as JsonValue);
    updateClientCategoriesMock.mockClear();
    updateClientCategoriesMock.mockImplementation(async () => undefined);
    fetchClientGroupsMock.mockClear();
    fetchClientGroupsMock.mockImplementation(async () => [] as JsonValue);
    updateClientGroupsMock.mockClear();
    updateClientGroupsMock.mockImplementation(async () => undefined);
    fetchClientDeletionLogMock.mockClear();
    fetchClientDeletionLogMock.mockImplementation(async () => [] as JsonValue);
    fetchNextFreeClientNumberMock.mockClear();
    fetchNextFreeClientNumberMock.mockImplementation(async () => ({ next_free_number: 100 }));
    fetchTaxAuthoritiesMock.mockClear();
    fetchTaxAuthoritiesMock.mockImplementation(async () => [] as JsonValue);
    clientApi.authenticate = authenticateMock as typeof clientApi.authenticate;
    clientApi.fetchClients = fetchClientsMock as typeof clientApi.fetchClients;
    clientApi.fetchClient = fetchClientMock as typeof clientApi.fetchClient;
    clientApi.createClient = createClientMock as typeof clientApi.createClient;
    clientApi.updateClient = updateClientMock as typeof clientApi.updateClient;
    clientApi.fetchClientResponsibilities =
      fetchClientResponsibilitiesMock as typeof clientApi.fetchClientResponsibilities;
    clientApi.updateClientResponsibilities =
      updateClientResponsibilitiesMock as typeof clientApi.updateClientResponsibilities;
    clientApi.fetchClientCategories =
      fetchClientCategoriesMock as typeof clientApi.fetchClientCategories;
    clientApi.updateClientCategories =
      updateClientCategoriesMock as typeof clientApi.updateClientCategories;
    clientApi.fetchClientGroups = fetchClientGroupsMock as typeof clientApi.fetchClientGroups;
    clientApi.updateClientGroups = updateClientGroupsMock as typeof clientApi.updateClientGroups;
    clientApi.fetchClientDeletionLog =
      fetchClientDeletionLogMock as typeof clientApi.fetchClientDeletionLog;
    clientApi.fetchNextFreeClientNumber =
      fetchNextFreeClientNumberMock as typeof clientApi.fetchNextFreeClientNumber;
    clientApi.fetchTaxAuthorities =
      fetchTaxAuthoritiesMock as typeof clientApi.fetchTaxAuthorities;
  });

  afterEach(() => {
    clientApi.authenticate = realAuthenticate;
    clientApi.fetchClients = realFetchClients;
    clientApi.fetchClient = realFetchClient;
    clientApi.createClient = realCreateClient;
    clientApi.updateClient = realUpdateClient;
    clientApi.fetchClientResponsibilities = realFetchClientResponsibilities;
    clientApi.updateClientResponsibilities = realUpdateClientResponsibilities;
    clientApi.fetchClientCategories = realFetchClientCategories;
    clientApi.updateClientCategories = realUpdateClientCategories;
    clientApi.fetchClientGroups = realFetchClientGroups;
    clientApi.updateClientGroups = realUpdateClientGroups;
    clientApi.fetchClientDeletionLog = realFetchClientDeletionLog;
    clientApi.fetchNextFreeClientNumber = realFetchNextFreeClientNumber;
    clientApi.fetchTaxAuthorities = realFetchTaxAuthorities;
  });

  test("authenticates once and fetches clients for each input item", async () => {
    fetchClientsMock.mockImplementationOnce(async () => [
      { id: 1, name: "First" },
      { id: 2, name: "Second" },
    ]);
    fetchClientsMock.mockImplementationOnce(async () => "fallback value");

    const node = new MasterData();
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
    expect((firstFetchCall![0] as FetchClientsOptions).select).toBeUndefined();
    expect((firstFetchCall![0] as FetchClientsOptions).filter).toBeUndefined();
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

  test("fetches tax authorities with select and filter", async () => {
    fetchTaxAuthoritiesMock.mockImplementationOnce(async () => [
      { id: "9241", name: "Nürnberg-Zentral" },
    ]);

    const node = new MasterData();
    const context = createExecuteContext({
      parameters: {
        resource: "taxAuthority",
        operation: "getAll",
        select: "id,name",
        filter: "city eq 'Nuremberg'",
      },
    });

    const result = await node.execute.call(context as unknown as IExecuteFunctions);

    expect(fetchTaxAuthoritiesMock).toHaveBeenCalledTimes(1);
    const call = fetchTaxAuthoritiesMock.mock.calls[0] as unknown as
      | [FetchTaxAuthoritiesOptions]
      | undefined;
    expect(call).toBeDefined();
    expect(call![0]).toMatchObject({
      host: "https://api.example.com",
      token: "token-123",
      clientInstanceId: "instance-1",
      select: "id,name",
      filter: "city eq 'Nuremberg'",
    });

    expect(result).toEqual([
      [{ json: { id: "9241", name: "Nürnberg-Zentral" }, pairedItem: { item: 0 } }],
    ]);
  });

  test("handles multiple client operations", async () => {
    fetchClientsMock.mockImplementationOnce(async () => [
      { id: "client-a" },
      { id: "client-b" },
    ]);
    fetchClientMock.mockImplementationOnce(async () => ({ id: "client-1" }));
    createClientMock.mockImplementationOnce(async () => undefined);
    updateClientMock.mockImplementationOnce(async () => undefined);
    fetchClientResponsibilitiesMock.mockImplementationOnce(async () => [{ id: "resp-1" }]);
    updateClientResponsibilitiesMock.mockImplementationOnce(async () => undefined);
    fetchClientCategoriesMock.mockImplementationOnce(async () => [{ id: "cat-1" }]);
    updateClientCategoriesMock.mockImplementationOnce(async () => undefined);
    fetchClientGroupsMock.mockImplementationOnce(async () => [{ id: "group-1" }]);
    updateClientGroupsMock.mockImplementationOnce(async () => undefined);
    fetchClientDeletionLogMock.mockImplementationOnce(async () => [{ id: "deleted-1" }]);
    fetchNextFreeClientNumberMock.mockImplementationOnce(async () => ({
      next_free_number: 12345,
    }));

    const operations = [
      "getAll",
      "get",
      "create",
      "update",
      "getResponsibilities",
      "updateResponsibilities",
      "getClientCategories",
      "updateClientCategories",
      "getClientGroups",
      "updateClientGroups",
      "getDeletionLog",
      "getNextFreeNumber",
    ] as const;

    const itemCount = operations.length;
    const node = new MasterData();
    const context = createExecuteContext({
      items: Array.from({ length: itemCount }, () => ({ json: {} })),
      parameters: {
        resource: operations.map(() => "client"),
        operation: [...operations],
        top: [50],
        skip: [10],
        select: [
          "id,name",
          "id",
          undefined,
          undefined,
          "id",
          undefined,
          "id",
          undefined,
          "id",
          undefined,
          "id",
          undefined,
        ],
        filter: ["status eq active", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, "timestamp gt 2020", undefined],
        clientId: [
          undefined,
          "client-1",
          undefined,
          "client-2",
          "client-3",
          "client-3",
          "client-4",
          "client-4",
          "client-5",
          "client-5",
          undefined,
          undefined,
        ],
        clientData: [undefined, undefined, '{"name":"Created"}', { name: "Updated" }, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
        maxNumber: [undefined, undefined, 123],
        responsibilitiesData: [undefined, undefined, undefined, undefined, undefined, '[{"id":1,"area":"AB"}]'],
        categoriesData: [undefined, undefined, undefined, undefined, undefined, undefined, undefined, '[{"id":"cat-1"}]'],
        groupsData: [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, '[{"id":"group-1"}]'],
        start: Array.from({ length: itemCount }, (_, index) => (index === 11 ? 10000 : undefined)),
        range: Array.from({ length: itemCount }, (_, index) => (index === 11 ? 500 : undefined)),
      },
    });

    const result = await node.execute.call(context as unknown as IExecuteFunctions);

    const fetchClientsCall = fetchClientsMock.mock.calls[0] as unknown as
      | [FetchClientsOptions]
      | undefined;
    expect(fetchClientsCall).toBeDefined();
    expect(fetchClientsCall![0]).toMatchObject({
      select: "id,name",
      filter: "status eq active",
      top: 50,
      skip: 10,
    });

    const fetchClientCall = fetchClientMock.mock.calls[0] as unknown as
      | [FetchClientOptions]
      | undefined;
    expect(fetchClientCall).toBeDefined();
    expect(fetchClientCall![0]).toMatchObject({
      clientId: "client-1",
      select: "id",
    });

    const createClientCall = createClientMock.mock.calls[0] as unknown as
      | [CreateClientOptions]
      | undefined;
    expect(createClientCall).toBeDefined();
    expect(createClientCall![0]).toMatchObject({
      maxNumber: 123,
    });
    expect(createClientCall![0].client).toEqual({ name: "Created" });

    const updateClientCall = updateClientMock.mock.calls[0] as unknown as
      | [UpdateClientOptions]
      | undefined;
    expect(updateClientCall).toBeDefined();
    expect(updateClientCall![0]).toMatchObject({
      clientId: "client-2",
    });
    expect(updateClientCall![0].client).toEqual({ name: "Updated" });

    const fetchResponsibilitiesCall = fetchClientResponsibilitiesMock.mock.calls[0] as unknown as
      | [FetchClientResponsibilitiesOptions]
      | undefined;
    expect(fetchResponsibilitiesCall).toBeDefined();
    expect(fetchResponsibilitiesCall![0]).toMatchObject({
      clientId: "client-3",
      select: "id",
    });

    const updateResponsibilitiesCall = updateClientResponsibilitiesMock.mock.calls[0] as unknown as
      | [UpdateClientResponsibilitiesOptions]
      | undefined;
    expect(updateResponsibilitiesCall).toBeDefined();
    expect(updateResponsibilitiesCall![0]).toMatchObject({
      clientId: "client-3",
    });
    expect(updateResponsibilitiesCall![0].responsibilities).toEqual([{ id: 1, area: "AB" }]);

    const fetchCategoriesCall = fetchClientCategoriesMock.mock.calls[0] as unknown as
      | [FetchClientCategoriesOptions]
      | undefined;
    expect(fetchCategoriesCall).toBeDefined();
    expect(fetchCategoriesCall![0]).toMatchObject({
      clientId: "client-4",
      select: "id",
    });

    const updateCategoriesCall = updateClientCategoriesMock.mock.calls[0] as unknown as
      | [UpdateClientCategoriesOptions]
      | undefined;
    expect(updateCategoriesCall).toBeDefined();
    expect(updateCategoriesCall![0]).toMatchObject({
      clientId: "client-4",
    });
    expect(updateCategoriesCall![0].categories).toEqual([{ id: "cat-1" }]);

    const fetchGroupsCall = fetchClientGroupsMock.mock.calls[0] as unknown as
      | [FetchClientGroupsOptions]
      | undefined;
    expect(fetchGroupsCall).toBeDefined();
    expect(fetchGroupsCall![0]).toMatchObject({
      clientId: "client-5",
      select: "id",
    });

    const updateGroupsCall = updateClientGroupsMock.mock.calls[0] as unknown as
      | [UpdateClientGroupsOptions]
      | undefined;
    expect(updateGroupsCall).toBeDefined();
    expect(updateGroupsCall![0]).toMatchObject({
      clientId: "client-5",
    });
    expect(updateGroupsCall![0].groups).toEqual([{ id: "group-1" }]);

    const fetchDeletionLogCall = fetchClientDeletionLogMock.mock.calls[0] as unknown as
      | [FetchClientDeletionLogOptions]
      | undefined;
    expect(fetchDeletionLogCall).toBeDefined();
    expect(fetchDeletionLogCall![0]).toMatchObject({
      select: "id",
      filter: "timestamp gt 2020",
    });

    const nextFreeNumberCall = fetchNextFreeClientNumberMock.mock.calls[0] as unknown as
      | [FetchNextFreeClientNumberOptions]
      | undefined;
    expect(nextFreeNumberCall).toBeDefined();
    expect(nextFreeNumberCall![0]).toMatchObject({
      start: 10000,
      range: 500,
    });

    const [output] = result;
    expect(output).toBeDefined();

    const getJsonForItem = (index: number) =>
      output
        .filter((entry) => entry.pairedItem?.item === index)
        .map((entry) => entry.json);

    expect(getJsonForItem(0)).toEqual([{ id: "client-a" }, { id: "client-b" }]);
    expect(getJsonForItem(1)).toEqual([{ id: "client-1" }]);
    expect(getJsonForItem(2)).toEqual([{ success: true }]);
    expect(getJsonForItem(3)).toEqual([{ success: true }]);
    expect(getJsonForItem(4)).toEqual([{ id: "resp-1" }]);
    expect(getJsonForItem(5)).toEqual([{ success: true }]);
    expect(getJsonForItem(6)).toEqual([{ id: "cat-1" }]);
    expect(getJsonForItem(7)).toEqual([{ success: true }]);
    expect(getJsonForItem(8)).toEqual([{ id: "group-1" }]);
    expect(getJsonForItem(9)).toEqual([{ success: true }]);
    expect(getJsonForItem(10)).toEqual([{ id: "deleted-1" }]);
    expect(getJsonForItem(11)).toEqual([{ next_free_number: 12345 }]);
  });

  test("throws descriptive error when JSON payload parsing fails", async () => {
    const node = new MasterData();
    const context = createExecuteContext({
      items: [{ json: {} }],
      parameters: {
        resource: ["client"],
        operation: ["updateClientGroups"],
        clientId: ["client-1"],
        groupsData: ['[invalid'],
      },
    });

    await expect(
      node.execute.call(context as unknown as IExecuteFunctions),
    ).rejects.toThrowError(/Parameter "Client Groups" contains invalid JSON/);
  });

  test("returns error information when continueOnFail is enabled", async () => {
    fetchClientsMock.mockImplementation(async () => {
      throw new Error("Request failed");
    });

    const node = new MasterData();
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
