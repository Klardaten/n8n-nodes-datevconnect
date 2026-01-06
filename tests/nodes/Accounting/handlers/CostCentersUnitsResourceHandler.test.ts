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
import { CostCentersUnitsResourceHandler } from "../../../../nodes/Accounting/handlers/CostCentersUnitsResourceHandler";
import type { AuthContext } from "../../../../nodes/Accounting/types";
import { datevConnectClient } from "../../../../src/services/accountingClient";

// Test spies
let getCostCentersSpy: any;
let getCostCenterSpy: any;

// Mock data
const mockCostCentersData = [
  {
    id: "CC001",
    name: "Administration",
    description: "Administrative cost center",
    cost_system_id: "CS01",
    parent_id: null,
    is_active: true,
    cost_type: "department",
    responsibility_center: "ADM",
    budget_amount: 50000.0,
    actual_amount: 42500.75,
    variance: -7499.25,
    variance_percentage: -15.0,
  },
  {
    id: "CC002",
    name: "Sales",
    description: "Sales department cost center",
    cost_system_id: "CS01",
    parent_id: "CC001",
    is_active: true,
    cost_type: "revenue",
    responsibility_center: "SAL",
    budget_amount: 150000.0,
    actual_amount: 165000.5,
    variance: 15000.5,
    variance_percentage: 10.0,
  },
  {
    id: "CC003",
    name: "Production Unit A",
    description: "Manufacturing unit A",
    cost_system_id: "CS01",
    parent_id: "CC001",
    is_active: false,
    cost_type: "production",
    responsibility_center: "PRD",
    budget_amount: 200000.0,
    actual_amount: 185000.25,
    variance: -14999.75,
    variance_percentage: -7.5,
  },
];

const mockSingleCostCenter = {
  id: "CC001",
  name: "Administration",
  description: "Administrative cost center",
  cost_system_id: "CS01",
  parent_id: null,
  is_active: true,
  cost_type: "department",
  responsibility_center: "ADM",
  budget_amount: 50000.0,
  actual_amount: 42500.75,
  variance: -7499.25,
  variance_percentage: -15.0,
  sub_centers: [
    {
      id: "CC001-1",
      name: "HR",
      description: "Human Resources sub-center",
    },
    {
      id: "CC001-2",
      name: "Finance",
      description: "Finance sub-center",
    },
  ],
  allocations: [
    {
      source_center: "CC002",
      amount: 5000.0,
      allocation_key: "headcount",
    },
  ],
  created_date: "2023-01-01T10:00:00Z",
  last_modified: "2023-11-01T14:30:00Z",
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
        costSystemId: "CS01",
        costCenterId: "CC001",
        top: 50,
        skip: 10,
        select: "id,name,description,cost_type,is_active",
        filter: "is_active eq true",
        expand: "sub_centers,allocations",
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

describe("CostCentersUnitsResourceHandler", () => {
  beforeEach(() => {
    getCostCentersSpy = spyOn(
      datevConnectClient.accounting,
      "getCostCenters",
    ).mockResolvedValue(mockCostCentersData);
    getCostCenterSpy = spyOn(
      datevConnectClient.accounting,
      "getCostCenter",
    ).mockResolvedValue(mockSingleCostCenter);
  });

  afterEach(() => {
    getCostCentersSpy?.mockRestore();
    getCostCenterSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches all cost centers with parameters", async () => {
      const context = createMockContext();
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostCentersSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        {
          top: 50,
          skip: 10,
          select: "id,name,description,cost_type,is_active",
          filter: "is_active eq true",
          expand: "sub_centers,allocations",
        },
      );

      expect(returnData).toHaveLength(3);
      expect(returnData[0].json).toEqual({
        id: "CC001",
        name: "Administration",
        description: "Administrative cost center",
        cost_system_id: "CS01",
        parent_id: null,
        is_active: true,
        cost_type: "department",
        responsibility_center: "ADM",
        budget_amount: 50000.0,
        actual_amount: 42500.75,
        variance: -7499.25,
        variance_percentage: -15.0,
      });
    });

    test("handles empty results", async () => {
      getCostCentersSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(0);
    });

    test("handles null response", async () => {
      getCostCentersSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("requires costSystemId parameter", async () => {
      const context = createMockContext({
        parameters: { costSystemId: undefined },
      });
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow('Parameter "costSystemId" is required');
    });

    test("handles parameters with default values", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          top: undefined,
          skip: undefined,
          select: undefined,
          filter: undefined,
          expand: undefined,
        },
      });
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostCentersSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        {
          top: 100, // Default value when top is undefined
        },
      );
    });
  });

  describe("get operation", () => {
    test("fetches single cost center by ID", async () => {
      const context = createMockContext();
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getCostCenterSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        "CC001",
        {
          top: 50,
          skip: 10,
          select: "id,name,description,cost_type,is_active",
          filter: "is_active eq true",
          expand: "sub_centers,allocations",
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockSingleCostCenter);
    });

    test("handles null response for get operation", async () => {
      getCostCenterSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });
  });

  describe("error handling", () => {
    test("throws NodeOperationError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new CostCentersUnitsResourceHandler(context, 0);
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
      getCostCentersSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Error" });
    });

    test("propagates error when continueOnFail is false", async () => {
      getCostCentersSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext();
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("API Error");
    });

    test("handles missing costSystemId parameter error", async () => {
      const context = createMockContext({
        parameters: { costSystemId: "" },
      });
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow('Parameter "costSystemId" is required');
    });

    test("handles network timeout errors", async () => {
      getCostCentersSpy.mockRejectedValueOnce(new Error("Network timeout"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "Network timeout" });
    });

    test("handles authentication errors", async () => {
      getCostCentersSpy.mockRejectedValueOnce(new Error("Unauthorized"));
      const context = createMockContext();
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper execution context", async () => {
      const context = createMockContext();
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostCentersSpy).toHaveBeenCalledWith(
        context,
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(Object),
      );
    });

    test("handles metadata properly", async () => {
      const context = createMockContext();
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual(mockCostCentersData[0]);
    });

    test("respects item index in error handling", async () => {
      getCostCentersSpy.mockRejectedValueOnce(new Error("Test error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new CostCentersUnitsResourceHandler(context, 2);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({ error: "Test error" });
    });

    test("constructs proper sendSuccess function", async () => {
      const context = createMockContext();
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      // Verify that the handler constructs data properly through BaseResourceHandler
      expect(returnData).toHaveLength(3);
      expect(returnData.every((item) => item.json !== undefined)).toBe(true);
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves costSystemId parameter", async () => {
      const context = createMockContext({
        parameters: { costSystemId: "TEST_CS" },
      });
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostCentersSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "TEST_CS",
        expect.any(Object),
      );
    });

    test("correctly retrieves select parameter", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          select: "id,name,cost_type",
        },
      });
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostCentersSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        expect.objectContaining({ select: "id,name,cost_type" }),
      );
    });

    test("correctly retrieves filter parameter", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          filter: "cost_type eq 'department'",
        },
      });
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostCentersSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        expect.objectContaining({ filter: "cost_type eq 'department'" }),
      );
    });

    test("correctly retrieves top and skip parameters", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          top: 25,
          skip: 5,
        },
      });
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostCentersSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        expect.objectContaining({ top: 25, skip: 5 }),
      );
    });

    test("correctly retrieves expand parameter", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          expand: "sub_centers",
        },
      });
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostCentersSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        expect.objectContaining({ expand: "sub_centers" }),
      );
    });
  });

  describe("data validation", () => {
    test("handles cost centers with various cost types", async () => {
      const mockDataWithVariousTypes = [
        {
          id: "CC001",
          name: "Administration",
          cost_type: "department",
          is_active: true,
        },
        {
          id: "CC002",
          name: "Sales",
          cost_type: "revenue",
          is_active: true,
        },
        {
          id: "CC003",
          name: "Production",
          cost_type: "production",
          is_active: false,
        },
      ];

      getCostCentersSpy.mockResolvedValueOnce(mockDataWithVariousTypes);
      const context = createMockContext();
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(3);
      expect(returnData[0].json.cost_type).toBe("department");
      expect(returnData[1].json.cost_type).toBe("revenue");
      expect(returnData[2].json.cost_type).toBe("production");
    });

    test("handles cost centers with financial data", async () => {
      const mockDataWithFinancials = [
        {
          id: "CC001",
          name: "Administration",
          budget_amount: 50000.0,
          actual_amount: 42500.75,
          variance: -7499.25,
          variance_percentage: -15.0,
        },
      ];

      getCostCentersSpy.mockResolvedValueOnce(mockDataWithFinancials);
      const context = createMockContext();
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json.budget_amount).toBe(50000.0);
      expect(returnData[0].json.actual_amount).toBe(42500.75);
      expect(returnData[0].json.variance).toBe(-7499.25);
      expect(returnData[0].json.variance_percentage).toBe(-15.0);
    });

    test("handles cost centers with hierarchical structure", async () => {
      const mockDataWithHierarchy = [
        {
          id: "CC001",
          name: "Administration",
          parent_id: null,
          is_active: true,
        },
        {
          id: "CC002",
          name: "HR",
          parent_id: "CC001",
          is_active: true,
        },
      ];

      getCostCentersSpy.mockResolvedValueOnce(mockDataWithHierarchy);
      const context = createMockContext();
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json.parent_id).toBeNull();
      expect(returnData[1].json.parent_id).toBe("CC001");
    });

    test("handles cost centers with boolean status flags", async () => {
      const mockDataWithBooleans = [
        {
          id: "CC001",
          name: "Active Center",
          is_active: true,
          is_budget_controlled: true,
          is_cost_allocated: false,
        },
        {
          id: "CC002",
          name: "Inactive Center",
          is_active: false,
          is_budget_controlled: false,
          is_cost_allocated: true,
        },
      ];

      getCostCentersSpy.mockResolvedValueOnce(mockDataWithBooleans);
      const context = createMockContext();
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json.is_active).toBe(true);
      expect(returnData[0].json.is_budget_controlled).toBe(true);
      expect(returnData[0].json.is_cost_allocated).toBe(false);
      expect(returnData[1].json.is_active).toBe(false);
      expect(returnData[1].json.is_budget_controlled).toBe(false);
      expect(returnData[1].json.is_cost_allocated).toBe(true);
    });

    test("handles cost centers with missing optional fields", async () => {
      const mockDataWithMissingFields = [
        {
          id: "CC001",
          name: "Basic Center",
          cost_system_id: "CS01",
          // missing description, parent_id, budget_amount, etc.
        },
      ];

      getCostCentersSpy.mockResolvedValueOnce(mockDataWithMissingFields);
      const context = createMockContext();
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({
        id: "CC001",
        name: "Basic Center",
        cost_system_id: "CS01",
      });
    });

    test("handles cost centers with special characters in names", async () => {
      const mockDataWithSpecialChars = [
        {
          id: "CC001",
          name: "Cost Center #1 (Main)",
          description: "Center with special chars: & < > \" ' %",
          responsibility_center: "R&D",
        },
      ];

      getCostCentersSpy.mockResolvedValueOnce(mockDataWithSpecialChars);
      const context = createMockContext();
      const handler = new CostCentersUnitsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json.name).toBe("Cost Center #1 (Main)");
      expect(returnData[0].json.description).toBe(
        "Center with special chars: & < > \" ' %",
      );
      expect(returnData[0].json.responsibility_center).toBe("R&D");
    });
  });
});
