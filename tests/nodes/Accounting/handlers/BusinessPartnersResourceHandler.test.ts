/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  describe,
  expect,
  test,
  beforeEach,
  afterEach,
  spyOn,
  mock,
} from "bun:test";
import { BusinessPartnersResourceHandler } from "../../../../nodes/Accounting/handlers/BusinessPartnersResourceHandler";
import type { AuthContext } from "../../../../nodes/Accounting/types";
import { datevConnectClient } from "../../../../src/services/accountingClient";

// Test spies
let getDebitorsSpy: any;
let getDebitorSpy: any;
let createDebitorSpy: any;
let updateDebitorSpy: any;
let getCreditorsSpy: any;
let getCreditorSpy: any;
let createCreditorSpy: any;
let updateCreditorSpy: any;

// Mock IExecuteFunctions
const createMockContext = (overrides: any = {}) => ({
  getCredentials: mock().mockResolvedValue({
    host: "https://api.example.com",
    email: "user@example.com",
    password: "secret",
    clientInstanceId: "instance-1",
    ...overrides.credentials,
  }),
  getNodeParameter: mock(
    (name: string, itemIndex: number, defaultValue?: unknown) => {
      const mockParams: Record<string, unknown> = {
        debitorId: "debitor-123",
        creditorId: "creditor-123",
        debitorData: '{"name":"Test Debitor"}',
        creditorData: '{"name":"Test Creditor"}',
        top: 50,
        skip: 10,
        select: "id,name",
        filter: "status eq active",
        expand: "relationships",
        ...overrides.parameters,
      };
      return mockParams[name] !== undefined ? mockParams[name] : defaultValue;
    },
  ),
  getNode: mock(() => ({ name: "TestNode" })),
  helpers: {
    returnJsonArray: mock((data: any[]) =>
      data.map((entry) => ({ json: entry })),
    ),
    constructExecutionMetaData: mock((data: any[], meta: any) =>
      data.map((entry) => ({ ...entry, pairedItem: meta.itemData })),
    ),
  },
  continueOnFail: mock(() => false),
  ...overrides.context,
});

const mockAuthContext: AuthContext = {
  host: "https://api.example.com",
  token: "test-token",
  clientInstanceId: "instance-1",
  clientId: "client-123",
  fiscalYearId: "2023",
};

describe("BusinessPartnersResourceHandler", () => {
  beforeEach(() => {
    getDebitorsSpy = spyOn(
      datevConnectClient.accounting,
      "getDebitors",
    ).mockResolvedValue([
      {
        id: "100990000",
        account_number: 100990000,
        caption: "Tech Solutions GmbH",
        business_partner_number: "2250829",
        alternative_search_name: "Tech Solutions",
        is_business_partner_active: true,
        eu_vat_id_country_code: "DE",
        eu_vat_id_number: "123456789",
        accounting_information: {
          account_balance: 15000.5,
        },
        addresses: [
          {
            id: "addr_deb_001",
            street: "Hauptstr. 123",
            zip_code: "10115",
            city: "Berlin",
            country_code: "DE",
          },
        ],
      },
      {
        id: "100990001",
        account_number: 100990001,
        caption: "Mueller & Associates",
        business_partner_number: "2250830",
        alternative_search_name: "Mueller",
        is_business_partner_active: true,
        accounting_information: {
          account_balance: 2500.0,
        },
      },
    ]);

    getDebitorSpy = spyOn(
      datevConnectClient.accounting,
      "getDebitor",
    ).mockResolvedValue({
      id: "100990000",
      account_number: 100990000,
      caption: "Tech Solutions GmbH",
      business_partner_number: "2250829",
      alternative_search_name: "Tech Solutions",
      is_business_partner_active: true,
      eu_vat_id_country_code: "DE",
      eu_vat_id_number: "123456789",
      accounting_information: {
        account_balance: 15000.5,
      },
    });

    createDebitorSpy = spyOn(
      datevConnectClient.accounting,
      "createDebitor",
    ).mockResolvedValue(undefined);
    updateDebitorSpy = spyOn(
      datevConnectClient.accounting,
      "updateDebitor",
    ).mockResolvedValue(undefined);

    getCreditorsSpy = spyOn(
      datevConnectClient.accounting,
      "getCreditors",
    ).mockResolvedValue([
      {
        id: "701000000",
        account_number: 701000000,
        caption: "Office Supplies GmbH",
        business_partner_number: "SUP001",
        alternative_search_name: "Office Supplies",
        is_business_partner_active: true,
        accounting_information: {
          alternative_contact_person: "Anna Schmidt",
        },
        addresses: [
          {
            id: "addr_cred_001",
            street: "Industriestr. 45",
            zip_code: "20095",
            city: "Hamburg",
            country_code: "DE",
          },
        ],
      },
      {
        id: "701000001",
        account_number: 701000001,
        caption: "IT Services Ltd",
        business_partner_number: "SUP002",
        alternative_search_name: "IT Services",
        is_business_partner_active: true,
        accounting_information: {
          alternative_contact_person: "John Smith",
        },
      },
    ]);

    getCreditorSpy = spyOn(
      datevConnectClient.accounting,
      "getCreditor",
    ).mockResolvedValue({
      id: "701000000",
      account_number: 701000000,
      caption: "Office Supplies GmbH",
      business_partner_number: "SUP001",
      alternative_search_name: "Office Supplies",
      is_business_partner_active: true,
      accounting_information: {
        alternative_contact_person: "Anna Schmidt",
      },
    });

    createCreditorSpy = spyOn(
      datevConnectClient.accounting,
      "createCreditor",
    ).mockResolvedValue(undefined);
    updateCreditorSpy = spyOn(
      datevConnectClient.accounting,
      "updateCreditor",
    ).mockResolvedValue(undefined);
  });

  afterEach(() => {
    getDebitorsSpy?.mockRestore();
    getDebitorSpy?.mockRestore();
    createDebitorSpy?.mockRestore();
    updateDebitorSpy?.mockRestore();
    getCreditorsSpy?.mockRestore();
    getCreditorSpy?.mockRestore();
    createCreditorSpy?.mockRestore();
    updateCreditorSpy?.mockRestore();
  });

  describe("debitor operations", () => {
    describe("getDebitors operation", () => {
      test("fetches debitors with parameters", async () => {
        const context = createMockContext();
        const handler = new BusinessPartnersResourceHandler(context, 0);
        const returnData: any[] = [];

        await handler.execute("getDebitors", mockAuthContext, returnData);

        expect(getDebitorsSpy).toHaveBeenCalledWith(
          context,
          "client-123",
          "2023",
          {
            top: 50,
            skip: 10,
            select: "id,name",
            filter: "status eq active",
            expand: "relationships",
          },
        );

        expect(returnData).toHaveLength(2);
        expect(returnData[0].json).toEqual({
          id: "100990000",
          account_number: 100990000,
          caption: "Tech Solutions GmbH",
          business_partner_number: "2250829",
          alternative_search_name: "Tech Solutions",
          is_business_partner_active: true,
          eu_vat_id_country_code: "DE",
          eu_vat_id_number: "123456789",
          accounting_information: {
            account_balance: 15000.5,
          },
          addresses: [
            {
              id: "addr_deb_001",
              street: "Hauptstr. 123",
              zip_code: "10115",
              city: "Berlin",
              country_code: "DE",
            },
          ],
        });
      });

      test("handles empty results", async () => {
        getDebitorsSpy.mockResolvedValueOnce([]);
        const context = createMockContext();
        const handler = new BusinessPartnersResourceHandler(context, 0);
        const returnData: any[] = [];

        await handler.execute("getDebitors", mockAuthContext, returnData);

        expect(returnData).toHaveLength(0);
      });

      test("handles parameters with default values", async () => {
        const context = createMockContext({
          parameters: {
            top: undefined,
            skip: undefined,
            select: undefined,
            filter: undefined,
            expand: undefined,
          },
        });
        const handler = new BusinessPartnersResourceHandler(context, 0);
        const returnData: any[] = [];

        await handler.execute("getDebitors", mockAuthContext, returnData);

        expect(getDebitorsSpy).toHaveBeenCalledWith(
          context,
          "client-123",
          "2023",
          {
            top: 100, // Default value when top is undefined
          },
        );
      });
    });

    describe("getDebitor operation", () => {
      test("fetches single debitor by ID", async () => {
        const context = createMockContext();
        const handler = new BusinessPartnersResourceHandler(context, 0);
        const returnData: any[] = [];

        await handler.execute("getDebitor", mockAuthContext, returnData);

        expect(getDebitorSpy).toHaveBeenCalledWith(
          context,
          "client-123",
          "2023",
          "debitor-123",
          {
            top: 50,
            skip: 10,
            select: "id,name",
            filter: "status eq active",
            expand: "relationships",
          },
        );

        expect(returnData).toHaveLength(1);
        expect(returnData[0].json).toEqual({
          id: "100990000",
          account_number: 100990000,
          caption: "Tech Solutions GmbH",
          business_partner_number: "2250829",
          alternative_search_name: "Tech Solutions",
          is_business_partner_active: true,
          eu_vat_id_country_code: "DE",
          eu_vat_id_number: "123456789",
          accounting_information: {
            account_balance: 15000.5,
          },
        });
      });
    });

    describe("createDebitor operation", () => {
      test("creates debitor with data", async () => {
        createDebitorSpy.mockResolvedValueOnce({ id: "new-debitor-id" });
        const context = createMockContext();
        const handler = new BusinessPartnersResourceHandler(context, 0);
        const returnData: any[] = [];

        await handler.execute("createDebitor", mockAuthContext, returnData);

        expect(createDebitorSpy).toHaveBeenCalledWith(
          context,
          "client-123",
          "2023",
          { name: "Test Debitor" },
        );
        expect(returnData).toHaveLength(1);
        expect(returnData[0].json).toEqual({ id: "new-debitor-id" });
      });

      test("creates debitor without response data", async () => {
        createDebitorSpy.mockResolvedValueOnce(undefined);
        const context = createMockContext();
        const handler = new BusinessPartnersResourceHandler(context, 0);
        const returnData: any[] = [];

        await handler.execute("createDebitor", mockAuthContext, returnData);

        expect(createDebitorSpy).toHaveBeenCalledWith(
          context,
          "client-123",
          "2023",
          { name: "Test Debitor" },
        );
        expect(returnData).toHaveLength(1);
        expect(returnData[0].json).toEqual({ success: true });
      });
    });

    describe("updateDebitor operation", () => {
      test("updates debitor with data", async () => {
        updateDebitorSpy.mockResolvedValueOnce({
          id: "debitor-123",
          name: "Updated Debitor",
        });
        const context = createMockContext();
        const handler = new BusinessPartnersResourceHandler(context, 0);
        const returnData: any[] = [];

        await handler.execute("updateDebitor", mockAuthContext, returnData);

        expect(updateDebitorSpy).toHaveBeenCalledWith(
          context,
          "client-123",
          "2023",
          "debitor-123",
          { name: "Test Debitor" },
        );
        expect(returnData).toHaveLength(1);
        expect(returnData[0].json).toEqual({
          id: "debitor-123",
          name: "Updated Debitor",
        });
      });
    });
  });

  describe("creditor operations", () => {
    describe("getCreditors operation", () => {
      test("fetches creditors with parameters", async () => {
        const context = createMockContext();
        const handler = new BusinessPartnersResourceHandler(context, 0);
        const returnData: any[] = [];

        await handler.execute("getCreditors", mockAuthContext, returnData);

        expect(getCreditorsSpy).toHaveBeenCalledWith(
          context,
          "client-123",
          "2023",
          {
            top: 50,
            skip: 10,
            select: "id,name",
            filter: "status eq active",
            expand: "relationships",
          },
        );

        expect(returnData).toHaveLength(2);
        expect(returnData[0].json).toEqual({
          id: "701000000",
          account_number: 701000000,
          caption: "Office Supplies GmbH",
          business_partner_number: "SUP001",
          alternative_search_name: "Office Supplies",
          is_business_partner_active: true,
          accounting_information: {
            alternative_contact_person: "Anna Schmidt",
          },
          addresses: [
            {
              id: "addr_cred_001",
              street: "Industriestr. 45",
              zip_code: "20095",
              city: "Hamburg",
              country_code: "DE",
            },
          ],
        });
      });
    });

    describe("getCreditor operation", () => {
      test("fetches single creditor by ID", async () => {
        const context = createMockContext();
        const handler = new BusinessPartnersResourceHandler(context, 0);
        const returnData: any[] = [];

        await handler.execute("getCreditor", mockAuthContext, returnData);

        expect(getCreditorSpy).toHaveBeenCalledWith(
          context,
          "client-123",
          "2023",
          "creditor-123",
          {
            top: 50,
            skip: 10,
            select: "id,name",
            filter: "status eq active",
            expand: "relationships",
          },
        );

        expect(returnData).toHaveLength(1);
        expect(returnData[0].json).toEqual({
          id: "701000000",
          account_number: 701000000,
          caption: "Office Supplies GmbH",
          business_partner_number: "SUP001",
          alternative_search_name: "Office Supplies",
          is_business_partner_active: true,
          accounting_information: {
            alternative_contact_person: "Anna Schmidt",
          },
        });
      });
    });

    describe("createCreditor operation", () => {
      test("creates creditor with data", async () => {
        createCreditorSpy.mockResolvedValueOnce({ id: "new-creditor-id" });
        const context = createMockContext();
        const handler = new BusinessPartnersResourceHandler(context, 0);
        const returnData: any[] = [];

        await handler.execute("createCreditor", mockAuthContext, returnData);

        expect(createCreditorSpy).toHaveBeenCalledWith(
          context,
          "client-123",
          "2023",
          { name: "Test Creditor" },
        );
        expect(returnData).toHaveLength(1);
        expect(returnData[0].json).toEqual({ id: "new-creditor-id" });
      });
    });

    describe("updateCreditor operation", () => {
      test("updates creditor with data", async () => {
        updateCreditorSpy.mockResolvedValueOnce({
          id: "creditor-123",
          name: "Updated Creditor",
        });
        const context = createMockContext();
        const handler = new BusinessPartnersResourceHandler(context, 0);
        const returnData: any[] = [];

        await handler.execute("updateCreditor", mockAuthContext, returnData);

        expect(updateCreditorSpy).toHaveBeenCalledWith(
          context,
          "client-123",
          "2023",
          "creditor-123",
          { name: "Test Creditor" },
        );
        expect(returnData).toHaveLength(1);
        expect(returnData[0].json).toEqual({
          id: "creditor-123",
          name: "Updated Creditor",
        });
      });
    });
  });

  describe("error handling", () => {
    test("throws NodeApiError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new BusinessPartnersResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute(
          "unsupportedOperation" as any,
          mockAuthContext,
          returnData,
        ),
      ).rejects.toThrow("Unknown operation: unsupportedOperation");
    });

    test("validates required parameters", async () => {
      const context = createMockContext();
      const handler = new BusinessPartnersResourceHandler(context, 0);
      const returnData: any[] = [];

      const invalidAuthContext = {
        host: "https://api.example.com",
        token: "test-token",
        clientInstanceId: "instance-1",
        // Missing clientId and fiscalYearId
      };

      await expect(
        handler.execute("getDebitors", invalidAuthContext as any, returnData),
      ).rejects.toThrow(
        "Client ID and Fiscal Year ID are required for business partner operations",
      );
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      getDebitorsSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });
      const handler = new BusinessPartnersResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getDebitors", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Error" });
    });

    test("propagates error when continueOnFail is false", async () => {
      getDebitorsSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext();
      const handler = new BusinessPartnersResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getDebitors", mockAuthContext, returnData),
      ).rejects.toThrow("API Error");
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper execution context", async () => {
      const context = createMockContext();
      const handler = new BusinessPartnersResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getDebitors", mockAuthContext, returnData);

      expect(getDebitorsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.any(Object),
      );
    });

    test("handles metadata properly", async () => {
      const context = createMockContext();
      const handler = new BusinessPartnersResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getDebitors", mockAuthContext, returnData);

      expect(returnData[0]).toHaveProperty("pairedItem");
      expect(returnData[0].pairedItem).toEqual({ item: 0 });
    });

    test("respects item index in error handling", async () => {
      const context = createMockContext();
      const handler = new BusinessPartnersResourceHandler(context, 5); // Different item index
      const returnData: any[] = [];

      const invalidAuthContext = {
        host: "https://api.example.com",
        token: "test-token",
        clientInstanceId: "instance-1",
      };

      await expect(
        handler.execute("getDebitors", invalidAuthContext as any, returnData),
      ).rejects.toThrow(
        "Client ID and Fiscal Year ID are required for business partner operations",
      );
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves debitorId parameter", async () => {
      const context = createMockContext({
        parameters: { debitorId: "test-debitor-id" },
      });
      const handler = new BusinessPartnersResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getDebitor", mockAuthContext, returnData);

      expect(getDebitorSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "test-debitor-id",
        expect.any(Object),
      );
    });

    test("correctly retrieves creditorId parameter", async () => {
      const context = createMockContext({
        parameters: { creditorId: "test-creditor-id" },
      });
      const handler = new BusinessPartnersResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getCreditor", mockAuthContext, returnData);

      expect(getCreditorSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "test-creditor-id",
        expect.any(Object),
      );
    });

    test("correctly parses JSON data parameters", async () => {
      const context = createMockContext({
        parameters: {
          debitorData: '{"name":"Custom Debitor","account":"12345"}',
        },
      });
      const handler = new BusinessPartnersResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("createDebitor", mockAuthContext, returnData);

      expect(createDebitorSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        { name: "Custom Debitor", account: "12345" },
      );
    });
  });
});
