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
import { VariousAddressesResourceHandler } from "../../../../nodes/Accounting/handlers/VariousAddressesResourceHandler";
import type { AuthContext } from "../../../../nodes/Accounting/types";
import { datevConnectClient } from "../../../../src/services/accountingClient";

// Test spies
let getVariousAddressesSpy: any;
let getVariousAddressSpy: any;
let createVariousAddressSpy: any;

const mockVariousAddresses = [
  {
    id: "1_-672289624",
    account_number: 295080394,
    business_partner_number: "10000",
    caption: "Tech Solutions GmbH",
    correspondence_title: "Herr",
    addresses: [
      {
        id: "addr_001",
        address_usage_type: {
          is_correspondence_address: true,
        },
        street: "Hauptstraße 123",
        zip_code: "10115",
        city: "Berlin",
        country_code: "DE",
      },
    ],
    communications: [
      {
        id: "comm_001",
        communication_usage_type: {
          is_main_communication_usage_type: true,
        },
        communication_type: "email",
        communication_connection: "info@techsolutions.de",
      },
      {
        id: "comm_002",
        communication_type: "phone",
        communication_connection: "+49 30 12345678",
      },
    ],
    banks: [
      {
        id: "bank_001",
        bank_code: "12030000",
        bank_account_number: "1234567890",
        bank_name: "Deutsche Bank",
      },
    ],
    correspondence_information: {
      alternative_contact_person: "Max Mustermann",
    },
  },
  {
    id: "2_-672289625",
    account_number: 295080395,
    business_partner_number: "10001",
    caption: "Office Supplies Ltd",
    correspondence_title: "Frau",
    addresses: [
      {
        id: "addr_002",
        address_usage_type: {
          is_correspondence_address: true,
        },
        street: "Industrial Park 45",
        zip_code: "20095",
        city: "Hamburg",
        country_code: "DE",
      },
    ],
    communications: [
      {
        id: "comm_003",
        communication_usage_type: {
          is_main_communication_usage_type: true,
        },
        communication_type: "email",
        communication_connection: "orders@officesupplies.de",
      },
      {
        id: "comm_004",
        communication_type: "phone",
        communication_connection: "+49 40 9876543",
      },
    ],
    correspondence_information: {
      alternative_contact_person: "Anna Schmidt",
    },
  },
];

const mockSingleVariousAddress = {
  id: "1_-672289624",
  account_number: 295080394,
  business_partner_number: "10000",
  caption: "Tech Solutions GmbH",
  correspondence_title: "Herr",
  addresses: [
    {
      id: "addr_001",
      address_usage_type: {
        is_correspondence_address: true,
      },
      street: "Hauptstraße 123",
      zip_code: "10115",
      city: "Berlin",
      country_code: "DE",
    },
  ],
  communications: [
    {
      id: "comm_001",
      communication_usage_type: {
        is_main_communication_usage_type: true,
      },
      communication_type: "email",
      communication_connection: "info@techsolutions.de",
    },
    {
      id: "comm_002",
      communication_type: "phone",
      communication_connection: "+49 30 12345678",
    },
    {
      id: "comm_003",
      communication_type: "fax",
      communication_connection: "+49 30 12345679",
    },
  ],
  banks: [
    {
      id: "bank_001",
      bank_code: "12030000",
      bank_account_number: "1234567890",
      bank_name: "Deutsche Bank",
    },
  ],
  correspondence_information: {
    alternative_contact_person: "Max Mustermann",
  },
};

const mockCreateResult = {
  id: "3_-672289626",
  account_number: 295080396,
  business_partner_number: "10002",
  caption: "New Customer Corp",
  correspondence_title: "Herr",
  addresses: [
    {
      id: "addr_003",
      address_usage_type: {
        is_correspondence_address: true,
      },
      street: "Innovation Street 100",
      zip_code: "80331",
      city: "Munich",
      country_code: "DE",
    },
  ],
  communications: [
    {
      id: "comm_005",
      communication_usage_type: {
        is_main_communication_usage_type: true,
      },
      communication_type: "email",
      communication_connection: "contact@newcustomer.com",
    },
    {
      id: "comm_006",
      communication_type: "phone",
      communication_connection: "+49 89 12345678",
    },
  ],
  correspondence_information: {
    alternative_contact_person: "John Doe",
  },
};

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
        variousAddressId: "ADDR001",
        variousAddressData: JSON.stringify({
          address_type: "customer",
          partner_name: "New Customer Corp",
          company_name: "New Customer Corp",
          street: "Innovation Street 100",
          postal_code: "80331",
          city: "Munich",
          country: "Germany",
          contact_person: "John Doe",
          email: "contact@newcustomer.com",
          phone: "+49 89 12345678",
        }),
        top: 50,
        skip: 10,
        select:
          "address_id,partner_name,company_name,street,city,country,email,phone",
        filter: "status eq 'active'",
        expand: "bank_details,business_hours",
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
  fiscalYearId: "FY2023",
};

describe("VariousAddressesResourceHandler", () => {
  beforeEach(() => {
    getVariousAddressesSpy = spyOn(
      datevConnectClient.accounting,
      "getVariousAddresses",
    ).mockResolvedValue(mockVariousAddresses as any);
    getVariousAddressSpy = spyOn(
      datevConnectClient.accounting,
      "getVariousAddress",
    ).mockResolvedValue(mockSingleVariousAddress as any);
    createVariousAddressSpy = spyOn(
      datevConnectClient.accounting,
      "createVariousAddress",
    ).mockResolvedValue(mockCreateResult as any);
  });

  afterEach(() => {
    getVariousAddressesSpy?.mockRestore();
    getVariousAddressSpy?.mockRestore();
    createVariousAddressSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches all various addresses", async () => {
      const context = createMockContext();
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getVariousAddressesSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        {
          top: 50,
          skip: 10,
          select:
            "address_id,partner_name,company_name,street,city,country,email,phone",
          filter: "status eq 'active'",
          expand: "bank_details,business_hours",
        },
      );

      expect(returnData).toHaveLength(2); // Array with 2 addresses becomes 2 items
      expect(returnData[0].json).toEqual(mockVariousAddresses[0]);
      expect(returnData[1].json).toEqual(mockVariousAddresses[1]);
    });

    test("handles empty results", async () => {
      getVariousAddressesSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(0); // Empty array becomes no items
    });

    test("handles null response", async () => {
      getVariousAddressesSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true }); // null becomes default success response
    });

    test("handles custom query parameters", async () => {
      const context = createMockContext({
        parameters: {
          top: 25,
          skip: 5,
          select: "address_id,partner_name,city,country",
          filter: "address_type eq 'business_partner'",
          expand: "bank_details",
        },
      });
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getVariousAddressesSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        expect.objectContaining({
          top: 25,
          skip: 5,
          select: "address_id,partner_name,city,country",
          filter: "address_type eq 'business_partner'",
          expand: "bank_details",
        }),
      );
    });
  });

  describe("get operation", () => {
    test("fetches single various address", async () => {
      const context = createMockContext();
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getVariousAddressSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "ADDR001",
        {
          top: 50,
          skip: 10,
          select:
            "address_id,partner_name,company_name,street,city,country,email,phone",
          filter: "status eq 'active'",
          expand: "bank_details,business_hours",
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockSingleVariousAddress);
    });

    test("requires variousAddressId parameter", async () => {
      const context = createMockContext({
        parameters: { variousAddressId: undefined },
      });
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("get", mockAuthContext, returnData),
      ).rejects.toThrow('Parameter "variousAddressId" is required');
    });

    test("handles empty variousAddressId parameter", async () => {
      const context = createMockContext({
        parameters: { variousAddressId: "" },
      });
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("get", mockAuthContext, returnData),
      ).rejects.toThrow('Parameter "variousAddressId" is required');
    });

    test("handles null response for single address", async () => {
      getVariousAddressSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true }); // null becomes default success response
    });

    test("fetches address with custom parameters", async () => {
      const context = createMockContext({
        parameters: {
          variousAddressId: "ADDR002",
          select: "address_id,partner_name,street,city",
          expand: "business_hours",
        },
      });
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getVariousAddressSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "ADDR002",
        expect.objectContaining({
          select: "address_id,partner_name,street,city",
          expand: "business_hours",
        }),
      );
    });
  });

  describe("create operation", () => {
    test("creates new various address", async () => {
      const context = createMockContext();
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createVariousAddressSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        {
          address_type: "customer",
          partner_name: "New Customer Corp",
          company_name: "New Customer Corp",
          street: "Innovation Street 100",
          postal_code: "80331",
          city: "Munich",
          country: "Germany",
          contact_person: "John Doe",
          email: "contact@newcustomer.com",
          phone: "+49 89 12345678",
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockCreateResult);
    });

    test("requires variousAddressData parameter", async () => {
      const context = createMockContext({
        parameters: { variousAddressData: undefined },
      });
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("create", mockAuthContext, returnData),
      ).rejects.toThrow('Parameter "variousAddressData" is required');
    });

    test("handles invalid JSON in variousAddressData parameter", async () => {
      const context = createMockContext({
        parameters: {
          variousAddressData: "invalid json",
        },
      });
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("create", mockAuthContext, returnData),
      ).rejects.toThrow('Invalid JSON in parameter "variousAddressData"');
    });

    test("validates variousAddressData is an object", async () => {
      const context = createMockContext({
        parameters: {
          variousAddressData: JSON.stringify([{ invalid: "array" }]),
        },
      });
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("create", mockAuthContext, returnData),
      ).rejects.toThrow("Various address data must be a valid JSON object");
    });

    test("validates variousAddressData is not null", async () => {
      const context = createMockContext({
        parameters: {
          variousAddressData: JSON.stringify(null),
        },
      });
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("create", mockAuthContext, returnData),
      ).rejects.toThrow("Various address data must be a valid JSON object");
    });

    test("handles complex address creation", async () => {
      const complexAddressData = {
        address_type: "supplier",
        partner_name: "Global Supplies International",
        company_name: "Global Supplies International Ltd",
        street: "Corporate Boulevard 500",
        street_2: "Suite 1200",
        postal_code: "60311",
        city: "Frankfurt am Main",
        state: "Hessen",
        country: "Germany",
        country_code: "DE",
        contact_person: "Maria Rodriguez",
        title: "Regional Manager",
        phone: "+49 69 12345678",
        mobile: "+49 170 9876543",
        email: "maria.rodriguez@globalsupplies.com",
        website: "https://www.globalsupplies.com",
        tax_number: "98/765/43210",
        vat_id: "DE987654321",
        business_hours: {
          monday: "09:00-17:00",
          friday: "09:00-15:00",
        },
        bank_details: {
          bank_name: "Commerzbank AG",
          iban: "DE98765432109876543210",
          bic: "COBADEFF",
        },
        custom_fields: {
          industry: "Manufacturing",
          payment_terms: "30 days",
        },
      };

      const context = createMockContext({
        parameters: {
          variousAddressData: JSON.stringify(complexAddressData),
        },
      });
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createVariousAddressSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        expect.objectContaining({
          address_type: "supplier",
          partner_name: "Global Supplies International",
          company_name: "Global Supplies International Ltd",
          street: "Corporate Boulevard 500",
          street_2: "Suite 1200",
          contact_person: "Maria Rodriguez",
          business_hours: expect.objectContaining({
            monday: "09:00-17:00",
            friday: "09:00-15:00",
          }),
          bank_details: expect.objectContaining({
            bank_name: "Commerzbank AG",
            iban: "DE98765432109876543210",
          }),
          custom_fields: expect.objectContaining({
            industry: "Manufacturing",
            payment_terms: "30 days",
          }),
        }),
      );
    });

    test("handles null response from creation", async () => {
      createVariousAddressSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true }); // null becomes default success response
    });

    test("handles undefined variousAddressData parameter gracefully", async () => {
      const context = createMockContext({
        parameters: { variousAddressData: undefined },
      });
      // Override getNodeParameter to return undefined
      context.getNodeParameter = mock(
        (name: string, itemIndex: number, defaultValue?: unknown) => {
          if (name === "variousAddressData") return undefined;
          return defaultValue;
        },
      );

      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("create", mockAuthContext, returnData),
      ).rejects.toThrow('Parameter "variousAddressData" is required');
    });
  });

  describe("error handling", () => {
    test("throws NodeOperationError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("unsupportedOperation", mockAuthContext, returnData),
      ).rejects.toThrow(
        'The operation "unsupportedOperation" is not supported for resource "variousAddresses".',
      );
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      getVariousAddressesSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Error" });
    });

    test("propagates error when continueOnFail is false", async () => {
      getVariousAddressSpy.mockRejectedValueOnce(
        new Error("Address not found"),
      );
      const context = createMockContext();
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("get", mockAuthContext, returnData),
      ).rejects.toThrow("Address not found");
    });

    test("handles network timeout errors", async () => {
      createVariousAddressSpy.mockRejectedValueOnce(
        new Error("Network timeout"),
      );
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "Network timeout" });
    });

    test("handles authentication errors", async () => {
      getVariousAddressesSpy.mockRejectedValueOnce(new Error("Unauthorized"));
      const context = createMockContext();
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("Unauthorized");
    });

    test("handles validation errors from create operations", async () => {
      createVariousAddressSpy.mockRejectedValueOnce(
        new Error("Validation Error: Invalid postal code"),
      );
      const context = createMockContext();
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("create", mockAuthContext, returnData),
      ).rejects.toThrow("Validation Error: Invalid postal code");
    });

    test("handles duplicate address errors", async () => {
      createVariousAddressSpy.mockRejectedValueOnce(
        new Error("Duplicate address detected"),
      );
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        error: "Duplicate address detected",
      });
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper execution context", async () => {
      const context = createMockContext();
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getVariousAddressesSpy).toHaveBeenCalledWith(
        context,
        expect.any(String),
        expect.any(String),
        expect.any(Object),
      );
    });

    test("handles metadata properly", async () => {
      const context = createMockContext();
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual(mockVariousAddresses[0]);
    });

    test("respects item index in error handling", async () => {
      getVariousAddressesSpy.mockRejectedValueOnce(new Error("Test error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new VariousAddressesResourceHandler(context, 2);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({ error: "Test error" });
    });

    test("constructs proper sendSuccess function", async () => {
      const context = createMockContext();
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      // Verify that the handler constructs data properly through BaseResourceHandler
      expect(returnData).toHaveLength(2); // Array with 2 addresses becomes 2 items
      expect(returnData[0].json).toBeDefined();
    });

    test("uses parseJsonParameter correctly for create operations", async () => {
      const context = createMockContext({
        parameters: {
          variousAddressData: JSON.stringify({
            test: "data",
            address_type: "test_type",
          }),
        },
      });
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createVariousAddressSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        expect.objectContaining({
          test: "data",
          address_type: "test_type",
        }),
      );
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves variousAddressId parameter", async () => {
      const context = createMockContext({
        parameters: { variousAddressId: "TEST_ADDRESS" },
      });
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getVariousAddressSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "TEST_ADDRESS",
        expect.any(Object),
      );
    });

    test("correctly retrieves query parameters for getAll", async () => {
      const context = createMockContext({
        parameters: {
          top: 25,
          skip: 5,
          select: "address_id,partner_name,city",
          filter: "country eq 'Germany'",
          expand: "bank_details",
        },
      });
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getVariousAddressesSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        expect.objectContaining({
          top: 25,
          skip: 5,
          select: "address_id,partner_name,city",
          filter: "country eq 'Germany'",
          expand: "bank_details",
        }),
      );
    });

    test("correctly parses complex address data", async () => {
      const complexAddressData = {
        address_type: "headquarters",
        partner_name: "Multinational Corp",
        addresses: {
          billing: {
            street: "Finance Street 1",
            city: "Frankfurt",
          },
          shipping: {
            street: "Logistics Avenue 2",
            city: "Hamburg",
          },
        },
        contacts: [
          {
            name: "CFO John Smith",
            department: "Finance",
            email: "cfo@company.com",
          },
          {
            name: "COO Jane Doe",
            department: "Operations",
            email: "coo@company.com",
          },
        ],
        compliance: {
          gdpr_compliant: true,
          data_processing_agreement: true,
          last_audit: "2023-06-15",
        },
      };

      const context = createMockContext({
        parameters: {
          variousAddressData: JSON.stringify(complexAddressData),
        },
      });
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createVariousAddressSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        expect.objectContaining({
          address_type: "headquarters",
          partner_name: "Multinational Corp",
          addresses: expect.objectContaining({
            billing: expect.objectContaining({
              street: "Finance Street 1",
              city: "Frankfurt",
            }),
            shipping: expect.objectContaining({
              street: "Logistics Avenue 2",
              city: "Hamburg",
            }),
          }),
          contacts: expect.arrayContaining([
            expect.objectContaining({
              name: "CFO John Smith",
              department: "Finance",
            }),
            expect.objectContaining({
              name: "COO Jane Doe",
              department: "Operations",
            }),
          ]),
          compliance: expect.objectContaining({
            gdpr_compliant: true,
            data_processing_agreement: true,
          }),
        }),
      );
    });

    test("handles empty variousAddressData object", async () => {
      const context = createMockContext({
        parameters: {
          variousAddressData: JSON.stringify({}),
        },
      });
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createVariousAddressSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        {},
      );
    });
  });

  describe("data validation", () => {
    test("handles various address types", async () => {
      const addressesWithTypes = [
        {
          address_id: "A1",
          address_type: "business_partner",
          partner_name: "BP Corp",
        },
        {
          address_id: "A2",
          address_type: "supplier",
          partner_name: "Supplier Ltd",
        },
        {
          address_id: "A3",
          address_type: "customer",
          partner_name: "Customer Inc",
        },
        {
          address_id: "A4",
          address_type: "vendor",
          partner_name: "Vendor GmbH",
        },
      ];

      getVariousAddressesSpy.mockResolvedValueOnce(addressesWithTypes as any);
      const context = createMockContext();
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(4); // Array with 4 addresses becomes 4 items
      expect(returnData[0].json.address_type).toBe("business_partner");
      expect(returnData[1].json.address_type).toBe("supplier");
      expect(returnData[2].json.address_type).toBe("customer");
      expect(returnData[3].json.address_type).toBe("vendor");
    });

    test("handles international addresses correctly", async () => {
      const internationalAddress = {
        address_id: "INTL001",
        partner_name: "Global Partner",
        street: "123 International Boulevard",
        city: "New York",
        state: "NY",
        postal_code: "10001",
        country: "United States",
        country_code: "US",
        phone: "+1 212 555-0123",
        email: "contact@globalpartner.com",
      };

      getVariousAddressSpy.mockResolvedValueOnce(internationalAddress as any);
      const context = createMockContext();
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData[0].json.country).toBe("United States");
      expect(returnData[0].json.country_code).toBe("US");
      expect(returnData[0].json.state).toBe("NY");
      expect(returnData[0].json.postal_code).toBe("10001");
    });

    test("handles boolean flags in address data", async () => {
      const addressWithFlags = {
        address_id: "FLAGS001",
        is_primary: true,
        is_billing: false,
        is_shipping: true,
        is_active: true,
        email_verified: false,
        phone_verified: true,
      };

      getVariousAddressSpy.mockResolvedValueOnce(addressWithFlags as any);
      const context = createMockContext();
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData[0].json.is_primary).toBe(true);
      expect(returnData[0].json.is_billing).toBe(false);
      expect(returnData[0].json.is_shipping).toBe(true);
      expect(returnData[0].json.is_active).toBe(true);
      expect(returnData[0].json.email_verified).toBe(false);
      expect(returnData[0].json.phone_verified).toBe(true);
    });

    test("handles date fields correctly", async () => {
      const addressWithDates = {
        address_id: "DATE001",
        created_date: "2023-01-15T10:30:00Z",
        last_modified: "2023-11-01T14:20:00Z",
        last_verified: "2023-10-15T09:00:00Z",
        next_verification: "2024-10-15",
      };

      getVariousAddressSpy.mockResolvedValueOnce(addressWithDates as any);
      const context = createMockContext();
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData[0].json.created_date).toBe("2023-01-15T10:30:00Z");
      expect(returnData[0].json.last_modified).toBe("2023-11-01T14:20:00Z");
      expect(returnData[0].json.last_verified).toBe("2023-10-15T09:00:00Z");
      expect(returnData[0].json.next_verification).toBe("2024-10-15");
    });

    test("handles nested objects in address data", async () => {
      const addressWithNested = {
        address_id: "NESTED001",
        bank_details: {
          bank_name: "Deutsche Bank",
          iban: "DE12345678901234567890",
          bic: "DEUTDEFF",
          account_holder: "Company Name",
        },
        business_hours: {
          monday: "09:00-17:00",
          tuesday: "09:00-17:00",
          wednesday: "09:00-17:00",
          thursday: "09:00-17:00",
          friday: "09:00-16:00",
        },
      };

      getVariousAddressSpy.mockResolvedValueOnce(addressWithNested as any);
      const context = createMockContext();
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData[0].json.bank_details.bank_name).toBe("Deutsche Bank");
      expect(returnData[0].json.bank_details.iban).toBe(
        "DE12345678901234567890",
      );
      expect(returnData[0].json.business_hours.monday).toBe("09:00-17:00");
      expect(returnData[0].json.business_hours.friday).toBe("09:00-16:00");
    });

    test("handles contact arrays in address data", async () => {
      const addressWithContacts = {
        address_id: "CONTACTS001",
        contacts: [
          {
            name: "Primary Contact",
            role: "Manager",
            email: "manager@company.com",
            phone: "+49 30 12345678",
          },
          {
            name: "Secondary Contact",
            role: "Assistant",
            email: "assistant@company.com",
            phone: "+49 30 12345679",
          },
        ],
      };

      getVariousAddressSpy.mockResolvedValueOnce(addressWithContacts as any);
      const context = createMockContext();
      const handler = new VariousAddressesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData[0].json.contacts).toHaveLength(2);
      expect(returnData[0].json.contacts[0].name).toBe("Primary Contact");
      expect(returnData[0].json.contacts[0].role).toBe("Manager");
      expect(returnData[0].json.contacts[1].name).toBe("Secondary Contact");
      expect(returnData[0].json.contacts[1].role).toBe("Assistant");
    });
  });
});
