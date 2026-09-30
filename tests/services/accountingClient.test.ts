import { describe, expect, test } from "bun:test";
import type { IExecuteFunctions } from "n8n-workflow";

import { datevConnectClient } from "../../src/services/accountingClient";

type HttpRequestCall = {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  returnFullResponse?: boolean;
};

function createExecuteContext(
  apiKey: string,
  calls: HttpRequestCall[],
): IExecuteFunctions {
  return {
    async getCredentials() {
      return {
        host: "https://api.example.com",
        clientInstanceId: "instance-1",
        apiKey,
      };
    },
    helpers: {
      async httpRequest(options: unknown) {
        const call = options as HttpRequestCall;
        calls.push(call);

        return {
          body: [{ id: "client-1" }],
          statusCode: 200,
          statusMessage: "OK",
          headers: {
            "content-type": "application/json",
          },
        };
      },
    },
  } as unknown as IExecuteFunctions;
}

describe("datevConnectClient.accounting", () => {
  test.each([
    [
      "getAccountsReceivableCondensed",
      "/datevconnect/accounting/v1/clients/client-123/fiscal-years/2025/accounts-receivable/condense",
    ],
    [
      "getAccountsPayableCondensed",
      "/datevconnect/accounting/v1/clients/client-123/fiscal-years/2025/accounts-payable/condense",
    ],
  ] as const)(
    "%s requests the condense endpoint without paging",
    async (operation, path) => {
      const apiKey = `uk-${"x".repeat(61)}`;
      const calls: HttpRequestCall[] = [];
      const context = createExecuteContext(apiKey, calls);

      const response = await datevConnectClient.accounting[operation](
        context,
        "client-123",
        "2025",
        {
          select: "account_number",
          filter: "is_cleared eq false",
          top: 5,
          skip: 10,
        },
      );

      expect(response).toEqual([{ id: "client-1" }]);
      expect(calls).toHaveLength(1);

      const [call] = calls;
      const url = new URL(call.url);

      expect(url.pathname).toBe(path);
      expect(Object.fromEntries(url.searchParams)).toEqual({
        select: "account_number",
        filter: "is_cleared eq false",
      });
      expect(call.method).toBe("GET");
      expect(call.headers).toMatchObject({
        authorization: `Bearer ${apiKey}`,
        "x-client-instance-id": "instance-1",
      });
    },
  );

  test.each([
    [
      "getAccountsReceivable",
      "/datevconnect/accounting/v1/clients/client-123/fiscal-years/2025/accounts-receivable",
    ],
    [
      "getAccountsPayable",
      "/datevconnect/accounting/v1/clients/client-123/fiscal-years/2025/accounts-payable",
    ],
  ] as const)("%s preserves paging", async (operation, path) => {
    const calls: HttpRequestCall[] = [];
    const context = createExecuteContext(`uk-${"x".repeat(61)}`, calls);

    await datevConnectClient.accounting[operation](
      context,
      "client-123",
      "2025",
      { top: 5, skip: 10 },
    );

    expect(calls).toHaveLength(1);
    const url = new URL(calls[0].url);

    expect(url.pathname).toBe(path);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      top: "5",
      skip: "10",
    });
  });

  test("uses user API key directly for accounting requests", async () => {
    const apiKey = `uk-${"x".repeat(61)}`;
    const calls: HttpRequestCall[] = [];
    const context = createExecuteContext(apiKey, calls);

    const response = await datevConnectClient.accounting.getClients(context, {
      top: 5,
    });

    expect(response).toEqual([{ id: "client-1" }]);
    expect(calls).toHaveLength(1);

    const [call] = calls;
    const url = new URL(call.url);

    expect(url.pathname).toBe("/datevconnect/accounting/v1/clients");
    expect(url.searchParams.get("top")).toBe("5");
    expect(call.method).toBe("GET");
    expect(call.returnFullResponse).toBe(true);
    expect(call.headers).toMatchObject({
      authorization: `Bearer ${apiKey}`,
      "x-client-instance-id": "instance-1",
    });
    expect(
      calls.some(
        (request) => new URL(request.url).pathname === "/api/auth/login",
      ),
    ).toBe(false);
  });
});
