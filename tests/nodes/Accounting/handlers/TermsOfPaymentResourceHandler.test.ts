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
import { TermsOfPaymentResourceHandler } from "../../../../nodes/Accounting/handlers/TermsOfPaymentResourceHandler";
import type { AuthContext } from "../../../../nodes/Accounting/types";
import { datevConnectClient } from "../../../../src/services/accountingClient";

// Test spies
let getTermsOfPaymentSpy: any;
let getTermOfPaymentSpy: any;
let createTermOfPaymentSpy: any;
let updateTermOfPaymentSpy: any;

const mockTermOfPaymentDays = {
  id: "123",
  caption: "30 Tage netto",
  due_type: "due_in_days",
  cash_discount1_percentage: 2.0,
  cash_discount2_percentage: 1.0,
  due_in_days: {
    cash_discount1_days: 10,
    cash_discount2_days: 20,
    due_in_days: 30,
  },
};

const mockTermOfPaymentPeriod = {
  id: "456",
  caption: "44 days net",
  due_type: "due_as_period",
  cash_discount1_percentage: 3.0,
  due_as_period: {
    period1: {
      invoice_day_of_month: 15,
      due_date_net: {
        day_of_month: 15,
        related_month: "next_month",
      },
    },
  },
};

const mockTermsOfPaymentData = [mockTermOfPaymentDays, mockTermOfPaymentPeriod];

const mockSingleTermOfPayment = {
  id: "123",
  caption: "30 Tage netto",
  due_type: "due_in_days",
  cash_discount1_percentage: 2.0,
  cash_discount2_percentage: 1.0,
  due_in_days: {
    cash_discount1_days: 10,
    cash_discount2_days: 20,
    due_in_days: 30,
  },
};

const mockCreateResponse = {
  id: "789",
  caption: "60 Tage netto",
  due_type: "due_in_days",
  cash_discount1_percentage: 0,
  due_in_days: {
    due_in_days: 60,
  },
};

const mockUpdateResponse = {
  id: "NET30",
  caption: "Net 30 Days Updated",
  due_type: "due_in_days",
  cash_discount1_percentage: 1.5,
  due_in_days: {
    cash_discount1_days: 15,
    due_in_days: 30,
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
        termOfPaymentId: "NET30",
        termOfPaymentData: JSON.stringify({
          name: "Test Payment Term",
          payment_days: 45,
          discount_percentage: 2.5,
          discount_days: 10,
          is_active: true,
        }),
        top: 50,
        skip: 10,
        select: "id,name,payment_days",
        filter: "is_active eq true",
        expand: "details",
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

describe("TermsOfPaymentResourceHandler", () => {
  beforeEach(() => {
    getTermsOfPaymentSpy = spyOn(
      datevConnectClient.accounting,
      "getTermsOfPayment",
    ).mockResolvedValue(mockTermsOfPaymentData);
    getTermOfPaymentSpy = spyOn(
      datevConnectClient.accounting,
      "getTermOfPayment",
    ).mockResolvedValue(mockSingleTermOfPayment);
    createTermOfPaymentSpy = spyOn(
      datevConnectClient.accounting,
      "createTermOfPayment",
    ).mockResolvedValue(mockCreateResponse);
    updateTermOfPaymentSpy = spyOn(
      datevConnectClient.accounting,
      "updateTermOfPayment",
    ).mockResolvedValue(mockUpdateResponse);
  });

  afterEach(() => {
    getTermsOfPaymentSpy?.mockRestore();
    getTermOfPaymentSpy?.mockRestore();
    createTermOfPaymentSpy?.mockRestore();
    updateTermOfPaymentSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches all terms of payment with parameters", async () => {
      const context = createMockContext();
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getTermsOfPaymentSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        {
          top: 50,
          skip: 10,
          select: "id,name,payment_days",
          filter: "is_active eq true",
          expand: "details",
        },
      );

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({
        id: "123",
        caption: "30 Tage netto",
        due_type: "due_in_days",
        cash_discount1_percentage: 2.0,
        cash_discount2_percentage: 1.0,
        due_in_days: {
          cash_discount1_days: 10,
          cash_discount2_days: 20,
          due_in_days: 30,
        },
      });
    });

    test("handles empty results", async () => {
      getTermsOfPaymentSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

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
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getTermsOfPaymentSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        {
          top: 100, // Default value when top is undefined
        },
      );
    });
  });

  describe("get operation", () => {
    test("fetches single term of payment by ID", async () => {
      const context = createMockContext();
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getTermOfPaymentSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "NET30",
        {
          top: 50,
          skip: 10,
          select: "id,name,payment_days",
          filter: "is_active eq true",
          expand: "details",
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "123",
        caption: "30 Tage netto",
        due_type: "due_in_days",
        cash_discount1_percentage: 2.0,
        cash_discount2_percentage: 1.0,
        due_in_days: {
          cash_discount1_days: 10,
          cash_discount2_days: 20,
          due_in_days: 30,
        },
      });
    });

    test("handles null response from get", async () => {
      getTermOfPaymentSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("requires termOfPaymentId parameter", async () => {
      const context = createMockContext({
        parameters: { termOfPaymentId: undefined },
      });
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("get", mockAuthContext, returnData),
      ).rejects.toThrow();
    });
  });

  describe("create operation", () => {
    test("creates new term of payment with valid data", async () => {
      const context = createMockContext();
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createTermOfPaymentSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        {
          name: "Test Payment Term",
          payment_days: 45,
          discount_percentage: 2.5,
          discount_days: 10,
          is_active: true,
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "789",
        caption: "60 Tage netto",
        due_type: "due_in_days",
        cash_discount1_percentage: 0,
        due_in_days: {
          due_in_days: 60,
        },
      });
    });

    test("handles null response from create", async () => {
      createTermOfPaymentSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("requires termOfPaymentData parameter", async () => {
      const context = createMockContext({
        parameters: { termOfPaymentData: undefined },
      });
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("create", mockAuthContext, returnData),
      ).rejects.toThrow();
    });

    test("validates termOfPaymentData is valid JSON object", async () => {
      const context = createMockContext({
        parameters: { termOfPaymentData: "invalid json" },
      });
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("create", mockAuthContext, returnData),
      ).rejects.toThrow();
    });

    test("rejects array as termOfPaymentData", async () => {
      const context = createMockContext({
        parameters: { termOfPaymentData: JSON.stringify([{ name: "test" }]) },
      });
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("create", mockAuthContext, returnData),
      ).rejects.toThrow("Term of payment data must be a valid JSON object");
    });

    test("rejects null as termOfPaymentData", async () => {
      const context = createMockContext({
        parameters: { termOfPaymentData: "null" },
      });
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("create", mockAuthContext, returnData),
      ).rejects.toThrow("Term of payment data must be a valid JSON object");
    });
  });

  describe("update operation", () => {
    test("updates existing term of payment with valid data", async () => {
      const context = createMockContext();
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("update", mockAuthContext, returnData);

      expect(updateTermOfPaymentSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "NET30",
        {
          name: "Test Payment Term",
          payment_days: 45,
          discount_percentage: 2.5,
          discount_days: 10,
          is_active: true,
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "NET30",
        caption: "Net 30 Days Updated",
        due_type: "due_in_days",
        cash_discount1_percentage: 1.5,
        due_in_days: {
          cash_discount1_days: 15,
          due_in_days: 30,
        },
      });
    });

    test("handles null response from update", async () => {
      updateTermOfPaymentSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("update", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("requires both termOfPaymentId and termOfPaymentData parameters", async () => {
      const context = createMockContext({
        parameters: {
          termOfPaymentId: undefined,
          termOfPaymentData: JSON.stringify({ name: "test" }),
        },
      });
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("update", mockAuthContext, returnData),
      ).rejects.toThrow();
    });

    test("validates termOfPaymentData is valid JSON object for update", async () => {
      const context = createMockContext({
        parameters: {
          termOfPaymentId: "NET30",
          termOfPaymentData: "invalid json",
        },
      });
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("update", mockAuthContext, returnData),
      ).rejects.toThrow();
    });
  });

  describe("error handling", () => {
    test("throws NodeOperationError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute(
          "unsupportedOperation" as any,
          mockAuthContext,
          returnData,
        ),
      ).rejects.toThrow(
        'The operation "unsupportedOperation" is not supported for resource "termsOfPayment".',
      );
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      getTermsOfPaymentSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Error" });
    });

    test("propagates error when continueOnFail is false", async () => {
      getTermsOfPaymentSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext();
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("API Error");
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper execution context", async () => {
      const context = createMockContext();
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getTermsOfPaymentSpy).toHaveBeenCalledWith(
        context,
        expect.any(String),
        expect.any(String),
        expect.any(Object),
      );
    });

    test("handles metadata properly", async () => {
      const context = createMockContext();
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual(mockTermOfPaymentDays);
    });

    test("respects item index in error handling", async () => {
      getTermsOfPaymentSpy.mockRejectedValueOnce(new Error("Test error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new TermsOfPaymentResourceHandler(context, 5);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({ error: "Test error" });
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves select parameter", async () => {
      const context = createMockContext({
        parameters: { select: "id,name,payment_days" },
      });
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getTermsOfPaymentSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ select: "id,name,payment_days" }),
      );
    });

    test("correctly retrieves filter parameter", async () => {
      const context = createMockContext({
        parameters: { filter: "is_active eq true" },
      });
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getTermsOfPaymentSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ filter: "is_active eq true" }),
      );
    });

    test("correctly retrieves top and skip parameters", async () => {
      const context = createMockContext({
        parameters: { top: 25, skip: 5 },
      });
      const handler = new TermsOfPaymentResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getTermsOfPaymentSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        expect.objectContaining({ top: 25, skip: 5 }),
      );
    });
  });
});
