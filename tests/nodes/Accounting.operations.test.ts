import { describe, expect, mock, test } from "bun:test";
import type { IExecuteFunctions } from "n8n-workflow";
import { Accounting } from "../../nodes/Accounting/Accounting.node";

function createContext(parameters: Record<string, unknown>[]) {
  const httpRequest = mock(async (_options: unknown) => ({
    statusCode: 204,
    headers: {},
    body: undefined as unknown,
  }));
  return {
    getInputData: () => parameters.map(() => ({ json: {} })),
    getCredentials: async () => ({
      host: "https://api.example.com",
      clientInstanceId: "instance-1",
      apiKey: `uk-${"x".repeat(61)}`,
    }),
    getNodeParameter: (name: string, itemIndex: number, fallback?: unknown) =>
      ({
        clientId: "client-123",
        fiscalYearId: "2025",
        costSystemId: "1",
        ...parameters[itemIndex],
      })[name] ?? fallback,
    getNode: () => ({ name: "Accounting" }),
    continueOnFail: () => false,
    helpers: {
      httpRequest,
      returnJsonArray: (data: unknown[]) => data.map((json) => ({ json })),
      constructExecutionMetaData: (
        data: unknown[],
        { itemData }: { itemData: unknown },
      ) =>
        data.map((entry) => ({ ...(entry as object), pairedItem: itemData })),
    },
  };
}

const writes = [
  {
    resource: "businessPartners",
    operation: "upsertDebitors",
    field: "debitorsData",
    payload: [{ id: "100000000", addressee_id: "address-1" }],
    path: "debitors",
    method: "PUT",
    contentType: "application/merge-patch+json",
  },
  {
    resource: "businessPartners",
    operation: "upsertCreditors",
    field: "creditorsData",
    payload: [{ id: "700000000", addressee_id: "address-2" }],
    path: "creditors",
    method: "PUT",
    contentType: "application/merge-patch+json",
  },
  {
    resource: "costCenterProperties",
    operation: "upsert",
    field: "costCenterPropertyData",
    payload: { id: "2", description: "Region", characteristics: [] },
    parameters: { costCenterPropertyId: "2" },
    path: "cost-systems/1/cost-center-properties/2",
    method: "PUT",
  },
  {
    resource: "costSequences",
    operation: "createCostAccountingRecord",
    field: "costAccountingRecordData",
    payload: {
      account_number: 44000000,
      date: "2025-01-01T00:00:00+01:00",
      amount: 100,
    },
    parameters: { costSequenceId: "10" },
    path: "cost-systems/1/cost-sequences/10/cost-accounting-records",
    method: "POST",
  },
  {
    resource: "costSequences",
    operation: "create",
    field: "costSequenceData",
    payload: { id: "10", month: 1 },
    parameters: { costSequenceId: "10" },
    path: "cost-systems/1/cost-sequences/10",
    method: "PUT",
  },
  {
    resource: "stocktakingData",
    operation: "update",
    field: "stocktakingData",
    payload: { asset_number: 1, inventory_number: "100", quantity: 5 },
    parameters: { stocktakingDataId: "asset-1" },
    path: "assets/asset-1/stocktaking/",
    method: "PUT",
  },
  {
    resource: "stocktakingData",
    operation: "create",
    field: "stocktakingData",
    payload: { asset_number: 1, inventory_number: "100", quantity: 5 },
    parameters: { stocktakingDataId: "asset-1" },
    path: "assets/asset-1/stocktaking/",
    method: "PUT",
  },
  {
    resource: "termsOfPayment",
    operation: "create",
    field: "termsOfPaymentData",
    payload: { description: "Net 30" },
    path: "terms-of-payment",
    method: "POST",
  },
  {
    resource: "termsOfPayment",
    operation: "update",
    field: "termsOfPaymentData",
    payload: { id: "1", description: "Net 30" },
    parameters: { termsOfPaymentId: "1" },
    path: "terms-of-payment/1",
    method: "PUT",
  },
  ...[
    ["batchIncoming", "incoming-invoices"],
    ["batchOutgoing", "outgoing-invoices"],
    ["batchCashRegister", "cash-register"],
  ].map(([operation, suffix]) => ({
    resource: "postingProposals",
    operation,
    field: "postingProposalData",
    payload: [{ amount: 100, document_field1: "INV-1" }],
    path: `posting-proposals-${suffix}/batch`,
    method: "POST",
  })),
];

const reads = [
  {
    resource: "termsOfPayment",
    operation: "get",
    parameters: { termsOfPaymentId: "1" },
    path: "terms-of-payment/1",
  },
  {
    resource: "stocktakingData",
    operation: "get",
    parameters: { stocktakingDataId: "asset-1" },
    path: "assets/asset-1/stocktaking/",
  },
  ...[
    ["getRuleIncoming", "incoming-invoices"],
    ["getRuleOutgoing", "outgoing-invoices"],
    ["getRuleCashRegister", "cash-register"],
  ].map(([operation, suffix]) => ({
    resource: "postingProposals",
    operation,
    parameters: { postingProposalRuleId: "rule-1" },
    path: `posting-proposal-rules-${suffix}/rule-1`,
  })),
];

describe("Accounting operation coverage", () => {
  for (const entry of writes) {
    test.each(["string", "object"])(
      `${entry.resource}.${entry.operation} sends a %s payload to the spec endpoint`,
      async (format) => {
        const context = createContext([
          {
            resource: entry.resource,
            operation: entry.operation,
            ...entry.parameters,
            [entry.field]:
              format === "string"
                ? JSON.stringify(entry.payload)
                : entry.payload,
          },
        ]);
        const result = await new Accounting().execute.call(
          context as unknown as IExecuteFunctions,
        );

        expect(context.helpers.httpRequest).toHaveBeenCalledTimes(1);
        expect(context.helpers.httpRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            url: `https://api.example.com/datevconnect/accounting/v1/clients/client-123/fiscal-years/2025/${entry.path}`,
            method: entry.method,
            body: JSON.stringify(entry.payload),
            headers: expect.objectContaining({
              "content-type": entry.contentType ?? "application/json",
              accept: "application/json",
            }),
          }),
        );
        expect(result).toEqual([
          [{ json: { success: true }, pairedItem: { item: 0 } }],
        ]);
      },
    );
  }

  test.each(reads)(
    "$resource.$operation reads the configured ID field",
    async (entry) => {
      const parameters = {
        resource: entry.resource,
        operation: entry.operation,
        ...entry.parameters,
      };
      const readContext = createContext([parameters]);
      readContext.helpers.httpRequest.mockResolvedValueOnce({
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: { id: "record-1" },
      });
      const result = await new Accounting().execute.call(
        readContext as unknown as IExecuteFunctions,
      );

      expect(readContext.helpers.httpRequest).toHaveBeenCalledWith(
        expect.objectContaining({ method: "GET" }),
      );
      const request = readContext.helpers.httpRequest.mock.calls[0][0] as {
        url: string;
      };
      expect(new URL(request.url).pathname).toBe(
        `/datevconnect/accounting/v1/clients/client-123/fiscal-years/2025/${entry.path}`,
      );
      expect(result[0][0].json).toEqual({ id: "record-1" });
    },
  );

  test.each([
    { operation: "getDebitor", idField: "debitorId", id: "100000000" },
    { operation: "getCreditor", idField: "creditorId", id: "700000000" },
  ])("$operation requests all subordinate data", async (entry) => {
    const context = createContext([
      {
        resource: "businessPartners",
        operation: entry.operation,
        [entry.idField]: entry.id,
        expand: "all",
      },
    ]);
    const partner = {
      id: entry.id,
      not_specified_person: { name: "Test partner" },
    };
    context.helpers.httpRequest.mockResolvedValueOnce({
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: partner,
    });

    const result = await new Accounting().execute.call(
      context as unknown as IExecuteFunctions,
    );

    const request = context.helpers.httpRequest.mock.calls[0][0] as {
      url: string;
    };
    expect(new URL(request.url).searchParams.get("expand")).toBe("all");
    expect(result[0][0].json).toEqual(partner);
  });

  test.each(
    writes.filter(
      (entry) =>
        entry.operation !== "create" || entry.resource !== "stocktakingData",
    ),
  )("$resource.$operation exposes its required payload field", (entry) => {
    const properties = new Accounting().description.properties;
    const operation = properties.find(
      (p) =>
        p.name === "operation" &&
        p.displayOptions?.show?.resource?.includes(entry.resource),
    );
    expect(operation?.options).toContainEqual(
      expect.objectContaining({ value: entry.operation }),
    );
    const field = properties.find((p) => p.name === entry.field);
    expect(field?.displayOptions?.show?.resource).toContain(entry.resource);
    expect(field?.displayOptions?.show?.operation).toContain(entry.operation);
    expect(field?.required).toBe(true);
  });

  for (const [operation, field] of [
    ["upsertDebitors", "debitorsData"],
    ["upsertCreditors", "creditorsData"],
  ]) {
    test.each([
      "{}",
      "null",
      "[null]",
      '[{"short_name":"Missing ID"}]',
      JSON.stringify(
        Array.from({ length: 501 }, (_, index) => ({ id: String(index) })),
      ),
    ])(
      `${operation} rejects invalid or oversized bulk data`,
      async (payload) => {
        const context = createContext([
          { resource: "businessPartners", operation, [field]: payload },
        ]);
        await expect(
          new Accounting().execute.call(
            context as unknown as IExecuteFunctions,
          ),
        ).rejects.toThrow("at most 500 objects with an ID");
        expect(context.helpers.httpRequest).not.toHaveBeenCalled();
      },
    );
  }

  test("bulk upserts preserve batch notifications and pair results with each input", async () => {
    const context = createContext([
      {
        resource: "businessPartners",
        operation: "upsertDebitors",
        debitorsData: [{ id: "100000000" }],
      },
      {
        resource: "businessPartners",
        operation: "upsertCreditors",
        creditorsData: [{ id: "700000000" }],
      },
    ]);
    const notifications = { messages: [{ message: "Imported with notes" }] };
    context.helpers.httpRequest.mockResolvedValue({
      statusCode: 201,
      headers: { "content-type": "application/json" },
      body: notifications,
    });

    const result = await new Accounting().execute.call(
      context as unknown as IExecuteFunctions,
    );

    expect(result).toEqual([
      [
        { json: notifications, pairedItem: { item: 0 } },
        { json: notifications, pairedItem: { item: 1 } },
      ],
    ]);
  });

  test.each([false, true])(
    "bulk upsert respects continueOnFail=%s for a 409 response",
    async (continueOnFail) => {
      const context = createContext([
        {
          resource: "businessPartners",
          operation: "upsertDebitors",
          debitorsData: [{ id: "100000000" }],
        },
      ]);
      context.continueOnFail = () => continueOnFail;
      context.helpers.httpRequest.mockResolvedValueOnce({
        statusCode: 409,
        headers: { "content-type": "application/json" },
        body: { message: "Batch rejected" },
      });
      const execution = new Accounting().execute.call(
        context as unknown as IExecuteFunctions,
      );

      if (continueOnFail) {
        expect(await execution).toEqual([
          [
            {
              json: { error: expect.stringContaining("Batch rejected") },
              pairedItem: { item: 0 },
            },
          ],
        ]);
      } else {
        await expect(execution).rejects.toThrow("Batch rejected");
      }
    },
  );

  test("accepts the 500-record bulk limit without splitting the request", async () => {
    const payload = Array.from({ length: 500 }, (_, index) => ({
      id: String(100000000 + index),
    }));
    const context = createContext([
      {
        resource: "businessPartners",
        operation: "upsertDebitors",
        debitorsData: payload,
      },
    ]);

    await new Accounting().execute.call(
      context as unknown as IExecuteFunctions,
    );

    expect(context.helpers.httpRequest).toHaveBeenCalledTimes(1);
    const request = context.helpers.httpRequest.mock.calls[0][0] as {
      body: string;
    };
    expect(JSON.parse(request.body)).toEqual(payload);
  });

  test.each(
    writes.filter(
      (entry) =>
        ["costCenterProperties", "costSequences"].includes(entry.resource) &&
        entry.operation !== "create",
    ),
  )("$resource.$operation rejects an array payload", async (entry) => {
    const context = createContext([
      {
        resource: entry.resource,
        operation: entry.operation,
        ...entry.parameters,
        [entry.field]: "[]",
      },
    ]);
    await expect(
      new Accounting().execute.call(context as unknown as IExecuteFunctions),
    ).rejects.toThrow("must be a valid JSON object");
    expect(context.helpers.httpRequest).not.toHaveBeenCalled();
  });
});
