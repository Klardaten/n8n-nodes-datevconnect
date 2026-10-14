/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, mock, spyOn, test } from "bun:test";
import type { IExecuteFunctions } from "n8n-workflow";
import { Accounting } from "../../nodes/Accounting/Accounting.node";
import { ClientResourceHandler } from "../../nodes/Accounting/handlers";

type InputItem = { json: Record<string, unknown> };

type ExecuteContextOptions = {
  items?: InputItem[];
  credentials?: Record<string, string> | null;
  parameters?: Record<string, Array<unknown> | unknown>;
};

function createExecuteContext(options: ExecuteContextOptions = {}) {
  const {
    items = [{ json: {} }],
    credentials = {
      host: "https://api.example.com",
      clientInstanceId: "instance-1",
      apiKey: "uk-" + "x".repeat(61),
    },
    parameters = {},
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
      return { name: "Accounting" };
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
      return false;
    },
  };
}

describe("Accounting node", () => {
  test("node description is properly configured", () => {
    const accountingNode = new Accounting();

    expect(accountingNode.description.displayName).toBe(
      "Klardaten DATEVconnect: Accounting",
    );
    expect(accountingNode.description.name).toBe("accounting");
    expect(accountingNode.description.group).toEqual(["transform"]);
    expect(accountingNode.description.version).toBe(1);

    // Check that all expected resources are available
    const resourceProperty = accountingNode.description.properties?.find(
      (p) => p.name === "resource",
    );
    expect(resourceProperty).toBeDefined();
    expect(resourceProperty?.type).toBe("options");

    const resourceOptions = (resourceProperty as any)?.options;
    expect(resourceOptions).toHaveLength(20);

    const resourceValues = resourceOptions?.map((opt: any) => opt.value);
    expect(resourceValues).toContain("client");
    expect(resourceValues).toContain("fiscalYear");
    expect(resourceValues).toContain("accountsReceivable");
    expect(resourceValues).toContain("accountsPayable");
    expect(resourceValues).toContain("accountPosting");
    expect(resourceValues).toContain("accountingSequence");
    expect(resourceValues).toContain("postingProposals");
    expect(resourceValues).toContain("accountingSumsAndBalances");
    expect(resourceValues).toContain("businessPartners");
    expect(resourceValues).toContain("generalLedgerAccounts");
    expect(resourceValues).toContain("termsOfPayment");
    expect(resourceValues).toContain("stocktakingData");
    expect(resourceValues).toContain("costSystems");
    expect(resourceValues).toContain("costCentersUnits");
    expect(resourceValues).toContain("costCenterProperties");
    expect(resourceValues).toContain("internalCostServices");
    expect(resourceValues).toContain("costSequences");
    expect(resourceValues).toContain("accountingStatistics");
    expect(resourceValues).toContain("accountingTransactionKeys");
    expect(resourceValues).toContain("variousAddresses");
  });

  test("has correct credentials configuration", () => {
    const accountingNode = new Accounting();

    expect(accountingNode.description.credentials).toHaveLength(1);
    expect(accountingNode.description.credentials?.[0].name).toBe(
      "datevConnectApi",
    );
    expect(accountingNode.description.credentials?.[0].required).toBe(true);
  });

  test("has proper structure like MasterData node", () => {
    const accountingNode = new Accounting();

    expect(accountingNode.description.requestDefaults).toBeUndefined();
    expect(accountingNode.description.description).toBe(
      "Interact with DATEV Accounting API",
    );
    expect(accountingNode.description.defaults.name).toBe("Accounting");
  });

  test("resource operations are properly configured", () => {
    const accountingNode = new Accounting();
    const properties = accountingNode.description.properties || [];

    // Check client operations
    const clientOperations = properties.find(
      (p) =>
        p.name === "operation" &&
        (p as any).displayOptions?.show?.resource?.includes("client"),
    );
    expect(clientOperations).toBeDefined();

    // Check fiscal year operations
    const fiscalYearOperations = properties.find(
      (p) =>
        p.name === "operation" &&
        (p as any).displayOptions?.show?.resource?.includes("fiscalYear"),
    );
    expect(fiscalYearOperations).toBeDefined();

    // Check accounts receivable operations
    const accountsReceivableOperations = properties.find(
      (p) =>
        p.name === "operation" &&
        (p as any).displayOptions?.show?.resource?.includes(
          "accountsReceivable",
        ),
    );
    expect(accountsReceivableOperations).toBeDefined();

    // Verify accounts receivable has getCondensed operation
    const arOptions = (accountsReceivableOperations as any)?.options;
    const arOperationValues = arOptions?.map((opt: any) => opt.value);
    expect(arOperationValues).toContain("getCondensed");
  });

  test("query parameters are available for list operations", () => {
    const accountingNode = new Accounting();
    const properties = accountingNode.description.properties || [];

    // Check that limit (top) parameter exists
    const topParam = properties.find((p) => p.name === "top");
    expect(topParam).toBeDefined();
    expect(topParam?.type).toBe("number");
    expect(topParam?.default).toBe(100);
    expect(topParam?.displayOptions?.show?.operation).toContain("getAll");
    expect(topParam?.displayOptions?.show?.operation).not.toContain(
      "getCondensed",
    );

    // Check that skip parameter exists
    const skipParam = properties.find((p) => p.name === "skip");
    expect(skipParam).toBeDefined();
    expect(skipParam?.type).toBe("number");
    expect(skipParam?.default).toBe(0);
    expect(skipParam?.displayOptions?.show?.operation).toContain("getAll");
    expect(skipParam?.displayOptions?.show?.operation).not.toContain(
      "getCondensed",
    );

    // Check that select parameter exists
    const selectParam = properties.find((p) => p.name === "select");
    expect(selectParam).toBeDefined();
    expect(selectParam?.type).toBe("string");

    // Check that filter parameter exists
    const filterParam = properties.find((p) => p.name === "filter");
    expect(filterParam).toBeDefined();
    expect(filterParam?.type).toBe("string");

    const profileIdParam = properties.find((p) => p.name === "profileId");
    expect(profileIdParam).toBeDefined();
    expect(profileIdParam?.type).toBe("string");
  });

  test("passes credential profileId and lets node profileId override it", async () => {
    const accountingNode = new Accounting();
    const context = createExecuteContext({
      items: [{ json: {} }, { json: {} }],
      credentials: {
        host: "https://api.example.com",
        clientInstanceId: "instance-1",
        apiKey: "uk-" + "x".repeat(61),
        profileId: "credential-profile",
      },
      parameters: {
        resource: ["client", "client"],
        operation: ["getAll", "getAll"],
        profileId: ["", "node-profile"],
      },
    });

    const clientHandlerSpy = spyOn(
      ClientResourceHandler.prototype,
      "execute",
    ).mockResolvedValue();

    await accountingNode.execute.call(context as unknown as IExecuteFunctions);

    expect(clientHandlerSpy).toHaveBeenNthCalledWith(
      1,
      "getAll",
      expect.objectContaining({ profileId: "credential-profile" }),
      expect.any(Array),
    );
    expect(clientHandlerSpy).toHaveBeenNthCalledWith(
      2,
      "getAll",
      expect.objectContaining({ profileId: "node-profile" }),
      expect.any(Array),
    );

    clientHandlerSpy.mockRestore();
  });

  test("ID parameters are properly configured", () => {
    const accountingNode = new Accounting();
    const properties = accountingNode.description.properties || [];

    // Client ID parameter
    const clientIdParams = properties.filter((p) => p.name === "clientId");
    expect(clientIdParams.length).toBeGreaterThan(0);

    // Fiscal Year ID parameter
    const fiscalYearIdParams = properties.filter(
      (p) => p.name === "fiscalYearId",
    );
    expect(fiscalYearIdParams.length).toBeGreaterThan(0);

    // Accounts Receivable ID parameter
    const accountsReceivableIdParam = properties.find(
      (p) => p.name === "accountsReceivableId",
    );
    expect(accountsReceivableIdParam).toBeDefined();

    // Account Posting ID parameter
    const accountPostingIdParam = properties.find(
      (p) => p.name === "accountPostingId",
    );
    expect(accountPostingIdParam).toBeDefined();

    // Accounting Sequence ID parameter
    const accountingSequenceIdParam = properties.find(
      (p) => p.name === "accountingSequenceId",
    );
    expect(accountingSequenceIdParam).toBeDefined();
  });

  describe("cost centers/units", () => {
    function createCostCenterContext(parameters: Record<string, unknown> = {}) {
      const context = createExecuteContext({
        parameters: {
          resource: "costCentersUnits",
          operation: "upsert",
          clientId: "client-123",
          fiscalYearId: "2025",
          costSystemId: "1",
          costCenterUnitId: "1000",
          costCenterUnitData: JSON.stringify({
            id: "1000",
            short_name: "Admin",
          }),
          ...parameters,
        },
      });
      const httpRequest = mock(async (_options: unknown) => ({
        statusCode: 204,
        headers: {},
        body: undefined as unknown,
      }));
      return {
        ...context,
        helpers: { ...context.helpers, httpRequest },
      };
    }

    test("exposes Create or Update with required ID and payload fields", () => {
      const properties = new Accounting().description.properties;
      const operation = properties.find(
        (p) =>
          p.name === "operation" &&
          p.displayOptions?.show?.resource?.includes("costCentersUnits"),
      );
      expect(operation?.options).toContainEqual(
        expect.objectContaining({
          name: "Create or Update",
          value: "upsert",
        }),
      );
      const id = properties.find((p) => p.name === "costCenterUnitId");
      expect(id?.required).toBe(true);
      expect(id?.displayOptions?.show?.operation).toEqual(["get", "upsert"]);
      const data = properties.find((p) => p.name === "costCenterUnitData");
      expect(data?.required).toBe(true);
      expect(data?.type).toBe("json");
      expect(data?.displayOptions?.show).toEqual({
        resource: ["costCentersUnits"],
        operation: ["upsert"],
      });
    });

    test.each(["string", "object"])(
      "sends a %s payload with PUT and handles an empty 204 response",
      async (format) => {
        const payload = { id: "1000", short_name: "Admin", cost_rates: [] };
        const context = createCostCenterContext({
          costCenterUnitData:
            format === "string" ? JSON.stringify(payload) : payload,
          profileId: "cost-profile",
        });

        const result = await new Accounting().execute.call(
          context as unknown as IExecuteFunctions,
        );

        expect(context.helpers.httpRequest).toHaveBeenCalledTimes(1);
        expect(context.helpers.httpRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: "PUT",
            url: "https://api.example.com/datevconnect/accounting/v1/clients/client-123/fiscal-years/2025/cost-systems/1/cost-centers/1000",
            body: JSON.stringify(payload),
            headers: expect.objectContaining({
              "x-profile-id": "cost-profile",
            }),
          }),
        );
        expect(result).toEqual([
          [{ json: { success: true }, pairedItem: { item: 0 } }],
        ]);
      },
    );

    test("returns notifications from a successful 200 response", async () => {
      const context = createCostCenterContext();
      const notifications = { messages: [{ message: "Name was truncated" }] };
      context.helpers.httpRequest.mockResolvedValueOnce({
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: notifications,
      });

      const result = await new Accounting().execute.call(
        context as unknown as IExecuteFunctions,
      );

      expect(result[0][0].json).toEqual(notifications);
    });

    test.each([
      ["{", "Invalid JSON"],
      ["[]", "must be a valid JSON object"],
      ["null", "must be a valid JSON object"],
      ["42", "must be a valid JSON object"],
      ["{}", "id must match"],
      [JSON.stringify({ id: "2000" }), "id must match"],
    ])(
      "rejects invalid payload %s before making a request",
      async (payload, message) => {
        const context = createCostCenterContext({
          costCenterUnitData: payload,
        });

        await expect(
          new Accounting().execute.call(
            context as unknown as IExecuteFunctions,
          ),
        ).rejects.toThrow(message);
        expect(context.helpers.httpRequest).not.toHaveBeenCalled();
      },
    );

    test.each(["costSystemId", "costCenterUnitId"])(
      "requires %s before making a request",
      async (parameter) => {
        const context = createCostCenterContext({ [parameter]: "" });

        await expect(
          new Accounting().execute.call(
            context as unknown as IExecuteFunctions,
          ),
        ).rejects.toThrow(`Parameter "${parameter}" is required`);
        expect(context.helpers.httpRequest).not.toHaveBeenCalled();
      },
    );

    test("returns invalid payload errors when continueOnFail is enabled", async () => {
      const context = createCostCenterContext({ costCenterUnitData: "[]" });
      context.continueOnFail = () => true;

      const result = await new Accounting().execute.call(
        context as unknown as IExecuteFunctions,
      );

      expect(result[0][0]).toMatchObject({
        json: { error: expect.stringContaining("must be a valid JSON object") },
        pairedItem: { item: 0 },
      });
      expect(context.helpers.httpRequest).not.toHaveBeenCalled();
    });

    test("retrieves a cost center using the ID exposed by the node", async () => {
      const context = createCostCenterContext({ operation: "get" });
      context.helpers.httpRequest.mockResolvedValueOnce({
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: { id: "1000", short_name: "Admin" },
      });

      const result = await new Accounting().execute.call(
        context as unknown as IExecuteFunctions,
      );

      expect(context.helpers.httpRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          url: "https://api.example.com/datevconnect/accounting/v1/clients/client-123/fiscal-years/2025/cost-systems/1/cost-centers/1000",
        }),
      );
      expect(result[0][0].json.id).toBe("1000");
    });
  });
});
