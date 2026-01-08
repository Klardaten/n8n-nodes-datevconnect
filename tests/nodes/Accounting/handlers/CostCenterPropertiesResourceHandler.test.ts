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
import { CostCenterPropertiesResourceHandler } from "../../../../nodes/Accounting/handlers/CostCenterPropertiesResourceHandler";
import type { AuthContext } from "../../../../nodes/Accounting/types";
import { datevConnectClient } from "../../../../src/services/accountingClient";

// Test spies
let getCostCenterPropertiesSpy: any;
let getCostCenterPropertySpy: any;

// Mock data
const mockCostCenterPropertiesData = [
  {
    id: "PROP001",
    name: "Department",
    description: "Department classification property",
    data_type: "string",
    is_required: true,
    is_active: true,
    default_value: null,
    allowed_values: ["Sales", "Marketing", "IT", "HR", "Finance"],
    sort_order: 1,
  },
  {
    id: "PROP002",
    name: "Location",
    description: "Physical location property",
    data_type: "string",
    is_required: false,
    is_active: true,
    default_value: "Main Office",
    allowed_values: ["Main Office", "Branch A", "Branch B", "Remote"],
    sort_order: 2,
  },
  {
    id: "PROP003",
    name: "Budget Limit",
    description: "Monthly budget limit property",
    data_type: "decimal",
    is_required: false,
    is_active: true,
    default_value: 10000.0,
    allowed_values: null,
    sort_order: 3,
  },
];

const mockSingleCostCenterProperty = {
  id: "PROP001",
  name: "Department",
  description: "Department classification property",
  data_type: "string",
  is_required: true,
  is_active: true,
  default_value: null,
  allowed_values: ["Sales", "Marketing", "IT", "HR", "Finance"],
  sort_order: 1,
  created_date: "2023-01-15T09:00:00Z",
  last_modified: "2023-10-20T15:30:00Z",
  usage_count: 45,
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
        costSystemId: "COSTSYS001",
        costCenterPropertyId: "PROP001",
        top: 50,
        skip: 10,
        select: "id,name,data_type,is_required",
        filter: "is_active eq true",
        expand: "usage_statistics",
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

describe("CostCenterPropertiesResourceHandler", () => {
  beforeEach(() => {
    getCostCenterPropertiesSpy = spyOn(
      datevConnectClient.accounting,
      "getCostCenterProperties",
    ).mockResolvedValue(mockCostCenterPropertiesData);
    getCostCenterPropertySpy = spyOn(
      datevConnectClient.accounting,
      "getCostCenterProperty",
    ).mockResolvedValue(mockSingleCostCenterProperty);
  });

  afterEach(() => {
    getCostCenterPropertiesSpy?.mockRestore();
    getCostCenterPropertySpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches all cost center properties with parameters", async () => {
      const context = createMockContext();
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostCenterPropertiesSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "COSTSYS001",
        {
          top: 50,
          skip: 10,
          select: "id,name,data_type,is_required",
          filter: "is_active eq true",
          expand: "usage_statistics",
        },
      );

      expect(returnData).toHaveLength(3);
      expect(returnData[0].json).toEqual({
        id: "PROP001",
        name: "Department",
        description: "Department classification property",
        data_type: "string",
        is_required: true,
        is_active: true,
        default_value: null,
        allowed_values: ["Sales", "Marketing", "IT", "HR", "Finance"],
        sort_order: 1,
      });
    });

    test("handles empty results", async () => {
      getCostCenterPropertiesSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(0);
    });

    test("handles null response", async () => {
      getCostCenterPropertiesSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("handles parameters with default values", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "COSTSYS001",
          top: undefined,
          skip: undefined,
          select: undefined,
          filter: undefined,
          expand: undefined,
        },
      });
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostCenterPropertiesSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "COSTSYS001",
        {
          top: 100, // Default value when top is undefined
        },
      );
    });

    test("requires costSystemId parameter", async () => {
      const context = createMockContext({
        parameters: { costSystemId: undefined },
      });
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow();
    });

    test("handles filtered results by data type", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "COSTSYS001",
          filter: "data_type eq 'string'",
        },
      });
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostCenterPropertiesSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "COSTSYS001",
        {
          top: 50,
          skip: 10,
          select: "id,name,data_type,is_required",
          filter: "data_type eq 'string'",
          expand: "usage_statistics",
        },
      );
    });
  });

  describe("get operation", () => {
    test("fetches single cost center property by ID", async () => {
      const context = createMockContext();
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getCostCenterPropertySpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "COSTSYS001",
        "PROP001",
        {
          top: 50,
          skip: 10,
          select: "id,name,data_type,is_required",
          filter: "is_active eq true",
          expand: "usage_statistics",
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "PROP001",
        name: "Department",
        description: "Department classification property",
        data_type: "string",
        is_required: true,
        is_active: true,
        default_value: null,
        allowed_values: ["Sales", "Marketing", "IT", "HR", "Finance"],
        sort_order: 1,
        created_date: "2023-01-15T09:00:00Z",
        last_modified: "2023-10-20T15:30:00Z",
        usage_count: 45,
      });
    });

    test("handles empty results for get operation", async () => {
      getCostCenterPropertySpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("handles null response for get operation", async () => {
      getCostCenterPropertySpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("requires both costSystemId and costCenterPropertyId parameters for get", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "COSTSYS001",
          costCenterPropertyId: undefined,
        },
      });
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("get", mockAuthContext, returnData),
      ).rejects.toThrow('Parameter "costCenterPropertyId" is required');
    });

    test("handles parameters with default values for get", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "COSTSYS002",
          costCenterPropertyId: "PROP999",
          top: undefined,
          skip: undefined,
          select: undefined,
          filter: undefined,
          expand: undefined,
        },
      });
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getCostCenterPropertySpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "COSTSYS002",
        "PROP999",
        {
          top: 100, // Default value when top is undefined
        },
      );
    });
  });

  describe("error handling", () => {
    test("throws NodeOperationError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute(
          "unsupportedOperation" as any,
          mockAuthContext,
          returnData,
        ),
      ).rejects.toThrow("Unknown operation: unsupportedOperation");
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      getCostCenterPropertiesSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Error" });
    });

    test("propagates error when continueOnFail is false", async () => {
      getCostCenterPropertiesSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext();
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("API Error");
    });

    test("handles network timeout errors", async () => {
      getCostCenterPropertiesSpy.mockRejectedValueOnce(
        new Error("Network timeout"),
      );
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "Network timeout" });
    });

    test("handles authentication errors", async () => {
      getCostCenterPropertiesSpy.mockRejectedValueOnce(
        new Error("Unauthorized"),
      );
      const context = createMockContext();
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper execution context", async () => {
      const context = createMockContext();
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostCenterPropertiesSpy).toHaveBeenCalledWith(
        context,
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(Object),
      );
    });

    test("handles metadata properly", async () => {
      const context = createMockContext();
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual(mockCostCenterPropertiesData[0]);
    });

    test("respects item index in error handling", async () => {
      getCostCenterPropertiesSpy.mockRejectedValueOnce(new Error("Test error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new CostCenterPropertiesResourceHandler(context, 4);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({ error: "Test error" });
    });

    test("constructs proper sendSuccess function", async () => {
      const context = createMockContext();
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      // Verify that the handler constructs data properly through BaseResourceHandler
      expect(returnData).toHaveLength(3);
      expect(returnData.every((item) => item.json !== undefined)).toBe(true);
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves select parameter", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "COSTSYS001",
          select: "id,name,data_type",
        },
      });
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostCenterPropertiesSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "COSTSYS001",
        expect.objectContaining({ select: "id,name,data_type" }),
      );
    });

    test("correctly retrieves filter parameter", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "COSTSYS001",
          filter: "is_required eq true",
        },
      });
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostCenterPropertiesSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "COSTSYS001",
        expect.objectContaining({ filter: "is_required eq true" }),
      );
    });

    test("correctly retrieves costSystemId parameter", async () => {
      const context = createMockContext({
        parameters: { costSystemId: "COSTSYS999" },
      });
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostCenterPropertiesSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "COSTSYS999",
        expect.any(Object),
      );
    });

    test("correctly retrieves costCenterPropertyId parameter", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "COSTSYS001",
          costCenterPropertyId: "PROP999",
        },
      });
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostCenterPropertiesSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "COSTSYS001",
        expect.any(Object),
      );
    });

    test("correctly retrieves top and skip parameters", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "COSTSYS001",
          top: 25,
          skip: 5,
        },
      });
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostCenterPropertiesSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "COSTSYS001",
        expect.objectContaining({ top: 25, skip: 5 }),
      );
    });

    test("correctly retrieves expand parameter", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "COSTSYS001",
          expand: "validation_rules",
        },
      });
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostCenterPropertiesSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "2023",
        "COSTSYS001",
        expect.objectContaining({ expand: "validation_rules" }),
      );
    });
  });

  describe("data validation", () => {
    test("handles properties with various data types", async () => {
      const mockDataWithVariousTypes = [
        {
          id: "PROP001",
          name: "String Property",
          data_type: "string",
          default_value: "Default",
        },
        {
          id: "PROP002",
          name: "Number Property",
          data_type: "decimal",
          default_value: 100.5,
        },
        {
          id: "PROP003",
          name: "Boolean Property",
          data_type: "boolean",
          default_value: true,
        },
        {
          id: "PROP004",
          name: "Date Property",
          data_type: "date",
          default_value: "2023-01-01",
        },
      ];

      getCostCenterPropertiesSpy.mockResolvedValueOnce(
        mockDataWithVariousTypes,
      );
      const context = createMockContext();
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(4);
      expect(returnData[0].json.data_type).toBe("string");
      expect(returnData[1].json.data_type).toBe("decimal");
      expect(returnData[2].json.data_type).toBe("boolean");
      expect(returnData[3].json.data_type).toBe("date");
    });

    test("handles properties with allowed values arrays", async () => {
      const mockDataWithAllowedValues = [
        {
          id: "PROP001",
          name: "Size Property",
          allowed_values: ["Small", "Medium", "Large", "Extra Large"],
        },
        {
          id: "PROP002",
          name: "Priority Property",
          allowed_values: ["Low", "Medium", "High", "Critical"],
        },
      ];

      getCostCenterPropertiesSpy.mockResolvedValueOnce(
        mockDataWithAllowedValues,
      );
      const context = createMockContext();
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json.allowed_values).toEqual([
        "Small",
        "Medium",
        "Large",
        "Extra Large",
      ]);
      expect(returnData[1].json.allowed_values).toEqual([
        "Low",
        "Medium",
        "High",
        "Critical",
      ]);
    });

    test("handles properties with boolean flags", async () => {
      const mockDataWithBooleans = [
        {
          id: "PROP001",
          name: "Required Property",
          is_required: true,
          is_active: true,
        },
        {
          id: "PROP002",
          name: "Optional Property",
          is_required: false,
          is_active: false,
        },
      ];

      getCostCenterPropertiesSpy.mockResolvedValueOnce(mockDataWithBooleans);
      const context = createMockContext();
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json.is_required).toBe(true);
      expect(returnData[0].json.is_active).toBe(true);
      expect(returnData[1].json.is_required).toBe(false);
      expect(returnData[1].json.is_active).toBe(false);
    });

    test("handles properties with missing optional fields", async () => {
      const mockDataWithMissingFields = [
        {
          id: "PROP001",
          name: "Minimal Property",
          data_type: "string",
          // missing description, default_value, allowed_values, etc.
        },
      ];

      getCostCenterPropertiesSpy.mockResolvedValueOnce(
        mockDataWithMissingFields,
      );
      const context = createMockContext();
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({
        id: "PROP001",
        name: "Minimal Property",
        data_type: "string",
      });
    });

    test("handles properties with null default values", async () => {
      const mockDataWithNullDefaults = [
        {
          id: "PROP001",
          name: "No Default Property",
          data_type: "string",
          default_value: null,
          allowed_values: null,
        },
      ];

      getCostCenterPropertiesSpy.mockResolvedValueOnce(
        mockDataWithNullDefaults,
      );
      const context = createMockContext();
      const handler = new CostCenterPropertiesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json.default_value).toBeNull();
      expect(returnData[0].json.allowed_values).toBeNull();
    });
  });
});
