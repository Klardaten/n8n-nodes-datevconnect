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
import { CountryCodeResourceHandler } from "../../../../nodes/MasterData/handlers/CountryCodeResourceHandler";
import type { AuthContext } from "../../../../nodes/MasterData/types";
import * as datevConnectClientModule from "../../../../src/services/datevConnectClient";

// Test spies
let fetchCountryCodesSpy: any;

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
        // Country code operations parameters (only select and filter are used)
        select: "id,name",
        filter: "startswith(name, 'D')",
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
};

describe("CountryCodeResourceHandler", () => {
  beforeEach(() => {
    fetchCountryCodesSpy = spyOn(
      datevConnectClientModule,
      "fetchCountryCodes",
    ).mockResolvedValue([]);
  });

  afterEach(() => {
    fetchCountryCodesSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches country codes with parameters", async () => {
      const mockResponse = [
        { id: "DE", name: "Deutschland" },
        { id: "AT", name: "Österreich" },
      ];

      fetchCountryCodesSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new CountryCodeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchCountryCodesSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        top: 100,
        skip: 0,
        select: "id,name",
        filter: "startswith(name, 'D')",
      });

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({ id: "DE", name: "Deutschland" });
      expect(returnData[1].json).toEqual({ id: "AT", name: "Österreich" });
    });

    test("handles empty results", async () => {
      const mockResponse: any[] = [];
      fetchCountryCodesSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new CountryCodeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchCountryCodesSpy).toHaveBeenCalled();
      expect(returnData).toHaveLength(0);
    });

    test("handles parameters with default values", async () => {
      const mockContextWithDefaults = createMockContext({
        parameters: {
          select: undefined,
          filter: undefined,
        },
      });
      const mockResponse = [{ id: "US", name: "United States" }];
      fetchCountryCodesSpy.mockResolvedValue(mockResponse);

      const handler = new CountryCodeResourceHandler(
        mockContextWithDefaults,
        0,
      );
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchCountryCodesSpy).toHaveBeenCalledWith({
        host: "https://api.example.com",
        token: "test-token",
        clientInstanceId: "instance-1",
        top: 100,
        skip: 0,
        select: undefined,
        filter: undefined,
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ id: "US", name: "United States" });
    });
  });

  describe("error handling", () => {
    test("throws NodeApiError for unsupported operation", async () => {
      const mockContext = createMockContext();
      const handler = new CountryCodeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("unsupported", mockAuthContext, returnData),
      ).rejects.toThrow(
        'The operation "unsupported" is not supported for resource "countryCode".',
      );
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      const mockContextWithContinueOnFail = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const apiError = new Error("API Error");
      fetchCountryCodesSpy.mockRejectedValue(apiError);

      const handler = new CountryCodeResourceHandler(
        mockContextWithContinueOnFail,
        0,
      );
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        error: "API Error",
      });
    });

    test("propagates error when continueOnFail is false", async () => {
      const apiError = new Error("API Error");
      fetchCountryCodesSpy.mockRejectedValue(apiError);

      const mockContext = createMockContext();
      const handler = new CountryCodeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow();
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper authentication context", async () => {
      const mockResponse = [{ id: "FR", name: "France" }];
      fetchCountryCodesSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new CountryCodeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchCountryCodesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          host: mockAuthContext.host,
          token: mockAuthContext.token,
          clientInstanceId: mockAuthContext.clientInstanceId,
        }),
      );
    });

    test("handles metadata properly", async () => {
      const mockResponse = [{ id: "IT", name: "Italy" }];
      fetchCountryCodesSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new CountryCodeResourceHandler(mockContext, 2);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ id: "IT", name: "Italy" });
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves select parameter", async () => {
      const mockResponse = [{ id: "ES", name: "Spain" }];
      fetchCountryCodesSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new CountryCodeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchCountryCodesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          select: "id,name",
        }),
      );
    });

    test("correctly retrieves filter parameter", async () => {
      const mockResponse = [{ id: "DE", name: "Deutschland" }];
      fetchCountryCodesSpy.mockResolvedValue(mockResponse);

      const mockContext = createMockContext();
      const handler = new CountryCodeResourceHandler(mockContext, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchCountryCodesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: "startswith(name, 'D')",
        }),
      );
    });
  });
});
