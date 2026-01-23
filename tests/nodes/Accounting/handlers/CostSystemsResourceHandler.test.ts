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
import { CostSystemsResourceHandler } from "../../../../nodes/Accounting/handlers/CostSystemsResourceHandler";
import type { AuthContext } from "../../../../nodes/Accounting/types";
import { datevConnectClient } from "../../../../src/services/accountingClient";

// Test spies
let getCostSystemsSpy: any;
let getCostSystemSpy: any;

// Mock data
const mockCostSystemsData: any = [
  {
    id: "CS01",
    name: "Primary Cost System",
    description: "Main cost accounting system for operations",
    system_type: "standard",
    is_active: true,
    default_currency: "EUR",
    cost_method: "standard_costing",
    allocation_method: "activity_based",
    created_date: "2023-01-01T00:00:00Z",
    cost_center_count: 25,
    cost_sequence_count: 15,
    total_budget: 2500000.0,
    actual_costs: 2350000.75,
    variance: -149999.25,
    variance_percentage: -6.0,
  },
  {
    id: "CS02",
    name: "Project Cost System",
    description: "Cost system for project-based accounting",
    system_type: "project_based",
    is_active: true,
    default_currency: "EUR",
    cost_method: "actual_costing",
    allocation_method: "direct_allocation",
    created_date: "2023-02-01T00:00:00Z",
    cost_center_count: 12,
    cost_sequence_count: 8,
    total_budget: 1000000.0,
    actual_costs: 950000.5,
    variance: -49999.5,
    variance_percentage: -5.0,
  },
  {
    id: "CS03",
    name: "Manufacturing Cost System",
    description: "Specialized system for manufacturing costs",
    system_type: "manufacturing",
    is_active: false,
    default_currency: "EUR",
    cost_method: "target_costing",
    allocation_method: "process_based",
    created_date: "2023-01-15T00:00:00Z",
    cost_center_count: 30,
    cost_sequence_count: 20,
    total_budget: 3000000.0,
    actual_costs: 0.0,
    variance: 0.0,
    variance_percentage: 0.0,
    deactivated_date: "2023-06-30T00:00:00Z",
  } as any,
];

const mockSingleCostSystem: any = {
  id: "CS01",
  name: "Primary Cost System",
  description: "Main cost accounting system for operations",
  system_type: "standard",
  is_active: true,
  default_currency: "EUR",
  cost_method: "standard_costing",
  allocation_method: "activity_based",
  created_date: "2023-01-01T00:00:00Z",
  cost_center_count: 25,
  cost_sequence_count: 15,
  total_budget: 2500000.0,
  actual_costs: 2350000.75,
  variance: -149999.25,
  variance_percentage: -6.0,
  cost_centers: [
    {
      id: "CC001",
      name: "Administration",
      budget: 100000.0,
      actual: 95000.5,
    },
    {
      id: "CC002",
      name: "Production",
      budget: 800000.0,
      actual: 785000.25,
    },
  ],
  allocation_rules: [
    {
      rule_id: "AR001",
      source_center: "CC001",
      target_centers: ["CC002", "CC003"],
      allocation_basis: "headcount",
      percentage: 0.15,
    },
    {
      rule_id: "AR002",
      source_center: "CC002",
      target_centers: ["CC004"],
      allocation_basis: "machine_hours",
      percentage: 0.25,
    },
  ],
  configuration: {
    auto_allocation: true,
    variance_analysis: true,
    budget_control: true,
    approval_workflow: false,
    reporting_frequency: "monthly",
  },
  last_calculation: "2023-10-31T23:59:59Z",
  last_modified: "2023-11-01T09:30:00Z",
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
        top: 50,
        skip: 10,
        select: "id,name,description,system_type,is_active,cost_method",
        filter: "is_active eq true",
        expand: "cost_centers,allocation_rules",
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

describe("CostSystemsResourceHandler", () => {
  beforeEach(() => {
    getCostSystemsSpy = spyOn(
      datevConnectClient.accounting,
      "getCostSystems",
    ).mockResolvedValue(mockCostSystemsData);
    getCostSystemSpy = spyOn(
      datevConnectClient.accounting,
      "getCostSystem",
    ).mockResolvedValue(mockSingleCostSystem);
  });

  afterEach(() => {
    getCostSystemsSpy?.mockRestore();
    getCostSystemSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches all cost systems with parameters", async () => {
      const context = createMockContext();
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostSystemsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        {
          top: 50,
          skip: 10,
          select: "id,name,description,system_type,is_active,cost_method",
          filter: "is_active eq true",
          expand: "cost_centers,allocation_rules",
        },
      );

      expect(returnData).toHaveLength(3);
      expect(returnData[0].json).toEqual({
        id: "CS01",
        name: "Primary Cost System",
        description: "Main cost accounting system for operations",
        system_type: "standard",
        is_active: true,
        default_currency: "EUR",
        cost_method: "standard_costing",
        allocation_method: "activity_based",
        created_date: "2023-01-01T00:00:00Z",
        cost_center_count: 25,
        cost_sequence_count: 15,
        total_budget: 2500000.0,
        actual_costs: 2350000.75,
        variance: -149999.25,
        variance_percentage: -6.0,
      });
    });

    test("handles empty results", async () => {
      getCostSystemsSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(0);
    });

    test("handles null response", async () => {
      getCostSystemsSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("requires clientId and fiscalYearId parameters", async () => {
      const context = createMockContext();
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];
      const invalidAuthContext = { ...mockAuthContext, clientId: undefined };

      await expect(
        handler.execute("getAll", invalidAuthContext, returnData),
      ).rejects.toThrow(
        "Client ID and Fiscal Year ID are required for this operation",
      );
    });

    test("requires fiscalYearId parameter", async () => {
      const context = createMockContext();
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];
      const invalidAuthContext = {
        ...mockAuthContext,
        fiscalYearId: undefined,
      };

      await expect(
        handler.execute("getAll", invalidAuthContext, returnData),
      ).rejects.toThrow(
        "Client ID and Fiscal Year ID are required for this operation",
      );
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
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostSystemsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        {
          top: 100, // Default value when top is undefined
        },
      );
    });
  });

  describe("get operation", () => {
    test("fetches single cost system by ID", async () => {
      const context = createMockContext();
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getCostSystemSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        {
          top: 50,
          skip: 10,
          select: "id,name,description,system_type,is_active,cost_method",
          filter: "is_active eq true",
          expand: "cost_centers,allocation_rules",
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "CS01",
        name: "Primary Cost System",
        description: "Main cost accounting system for operations",
        system_type: "standard",
        is_active: true,
        default_currency: "EUR",
        cost_method: "standard_costing",
        allocation_method: "activity_based",
        created_date: "2023-01-01T00:00:00Z",
        cost_center_count: 25,
        cost_sequence_count: 15,
        total_budget: 2500000.0,
        actual_costs: 2350000.75,
        variance: -149999.25,
        variance_percentage: -6.0,
        cost_centers: [
          {
            id: "CC001",
            name: "Administration",
            budget: 100000.0,
            actual: 95000.5,
          },
          {
            id: "CC002",
            name: "Production",
            budget: 800000.0,
            actual: 785000.25,
          },
        ],
        allocation_rules: [
          {
            rule_id: "AR001",
            source_center: "CC001",
            target_centers: ["CC002", "CC003"],
            allocation_basis: "headcount",
            percentage: 0.15,
          },
          {
            rule_id: "AR002",
            source_center: "CC002",
            target_centers: ["CC004"],
            allocation_basis: "machine_hours",
            percentage: 0.25,
          },
        ],
        configuration: {
          auto_allocation: true,
          variance_analysis: true,
          budget_control: true,
          approval_workflow: false,
          reporting_frequency: "monthly",
        },
        last_calculation: "2023-10-31T23:59:59Z",
        last_modified: "2023-11-01T09:30:00Z",
      });
    });

    test("handles null response from get", async () => {
      getCostSystemSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("requires costSystemId parameter", async () => {
      const context = createMockContext({
        parameters: { costSystemId: undefined },
      });
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("get", mockAuthContext, returnData),
      ).rejects.toThrow('Parameter "costSystemId" is required');
    });

    test("requires both clientId and fiscalYearId parameters for get", async () => {
      const context = createMockContext();
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];
      const invalidAuthContext = {
        ...mockAuthContext,
        clientId: undefined,
        fiscalYearId: undefined,
      };

      await expect(
        handler.execute("get", invalidAuthContext, returnData),
      ).rejects.toThrow(
        "Client ID and Fiscal Year ID are required for this operation",
      );
    });

    test("handles get with custom select parameter", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          select: "id,name,system_type",
        },
      });
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getCostSystemSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        expect.objectContaining({ select: "id,name,system_type" }),
      );
    });
  });

  describe("error handling", () => {
    test("throws NodeOperationError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new CostSystemsResourceHandler(context, 0);
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
      getCostSystemsSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Error" });
    });

    test("propagates error when continueOnFail is false", async () => {
      getCostSystemsSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext();
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("API Error");
    });

    test("handles missing costSystemId parameter error", async () => {
      const context = createMockContext({
        parameters: { costSystemId: "" },
      });
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("get", mockAuthContext, returnData),
      ).rejects.toThrow('Parameter "costSystemId" is required');
    });

    test("handles network timeout errors in get operation", async () => {
      getCostSystemSpy.mockRejectedValueOnce(new Error("Network timeout"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "Network timeout" });
    });

    test("handles authentication errors", async () => {
      getCostSystemsSpy.mockRejectedValueOnce(new Error("Unauthorized"));
      const context = createMockContext();
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper execution context", async () => {
      const context = createMockContext();
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostSystemsSpy).toHaveBeenCalledWith(
        context,
        expect.any(String),
        expect.any(String),
        expect.any(Object),
      );
    });

    test("handles metadata properly", async () => {
      const context = createMockContext();
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual(mockCostSystemsData[0]);
    });

    test("respects item index in error handling", async () => {
      getCostSystemsSpy.mockRejectedValueOnce(new Error("Test error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new CostSystemsResourceHandler(context, 2);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({ error: "Test error" });
    });

    test("constructs proper sendSuccess function", async () => {
      const context = createMockContext();
      const handler = new CostSystemsResourceHandler(context, 0);
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
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getCostSystemSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "TEST_CS",
        expect.any(Object),
      );
    });

    test("correctly retrieves select parameter for getAll", async () => {
      const context = createMockContext({
        parameters: { select: "id,name,system_type" },
      });
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostSystemsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        expect.objectContaining({ select: "id,name,system_type" }),
      );
    });

    test("correctly retrieves filter parameter", async () => {
      const context = createMockContext({
        parameters: { filter: "system_type eq 'standard'" },
      });
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostSystemsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        expect.objectContaining({ filter: "system_type eq 'standard'" }),
      );
    });

    test("correctly retrieves top and skip parameters", async () => {
      const context = createMockContext({
        parameters: { top: 25, skip: 5 },
      });
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostSystemsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        expect.objectContaining({ top: 25, skip: 5 }),
      );
    });

    test("correctly retrieves expand parameter", async () => {
      const context = createMockContext({
        parameters: { expand: "cost_centers" },
      });
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostSystemsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        expect.objectContaining({ expand: "cost_centers" }),
      );
    });
  });

  describe("data validation", () => {
    test("handles cost systems with various types", async () => {
      const mockDataWithVariousTypes = [
        {
          id: "CS01",
          name: "Standard System",
          system_type: "standard",
          is_active: true,
          cost_method: "standard_costing",
        },
        {
          id: "CS02",
          name: "Project System",
          system_type: "project_based",
          is_active: true,
          cost_method: "actual_costing",
        },
        {
          id: "CS03",
          name: "Manufacturing System",
          system_type: "manufacturing",
          is_active: false,
          cost_method: "target_costing",
        },
      ];

      getCostSystemsSpy.mockResolvedValueOnce(mockDataWithVariousTypes);
      const context = createMockContext();
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(3);
      expect(returnData[0].json.system_type).toBe("standard");
      expect(returnData[1].json.system_type).toBe("project_based");
      expect(returnData[2].json.system_type).toBe("manufacturing");
    });

    test("handles cost systems with financial data", async () => {
      const mockDataWithFinancials = [
        {
          id: "CS01",
          name: "Primary System",
          total_budget: 2500000.0,
          actual_costs: 2350000.75,
          variance: -149999.25,
          variance_percentage: -6.0,
          cost_center_count: 25,
          cost_sequence_count: 15,
        },
      ];

      getCostSystemsSpy.mockResolvedValueOnce(mockDataWithFinancials);
      const context = createMockContext();
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json.total_budget).toBe(2500000.0);
      expect(returnData[0].json.actual_costs).toBe(2350000.75);
      expect(returnData[0].json.variance).toBe(-149999.25);
      expect(returnData[0].json.variance_percentage).toBe(-6.0);
      expect(returnData[0].json.cost_center_count).toBe(25);
      expect(returnData[0].json.cost_sequence_count).toBe(15);
    });

    test("handles cost systems with allocation methods", async () => {
      const mockDataWithAllocations = [
        {
          id: "CS01",
          name: "Activity Based System",
          allocation_method: "activity_based",
          cost_method: "standard_costing",
        },
        {
          id: "CS02",
          name: "Direct Allocation System",
          allocation_method: "direct_allocation",
          cost_method: "actual_costing",
        },
        {
          id: "CS03",
          name: "Process Based System",
          allocation_method: "process_based",
          cost_method: "target_costing",
        },
      ];

      getCostSystemsSpy.mockResolvedValueOnce(mockDataWithAllocations);
      const context = createMockContext();
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json.allocation_method).toBe("activity_based");
      expect(returnData[1].json.allocation_method).toBe("direct_allocation");
      expect(returnData[2].json.allocation_method).toBe("process_based");
    });

    test("handles cost systems with boolean status flags", async () => {
      const mockDataWithBooleans = [
        {
          id: "CS01",
          name: "Active System",
          is_active: true,
          auto_allocation: true,
          variance_analysis: true,
          budget_control: false,
        },
        {
          id: "CS02",
          name: "Inactive System",
          is_active: false,
          auto_allocation: false,
          variance_analysis: false,
          budget_control: true,
        },
      ];

      getCostSystemsSpy.mockResolvedValueOnce(mockDataWithBooleans);
      const context = createMockContext();
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json.is_active).toBe(true);
      expect(returnData[0].json.auto_allocation).toBe(true);
      expect(returnData[0].json.variance_analysis).toBe(true);
      expect(returnData[0].json.budget_control).toBe(false);
      expect(returnData[1].json.is_active).toBe(false);
      expect(returnData[1].json.auto_allocation).toBe(false);
      expect(returnData[1].json.variance_analysis).toBe(false);
      expect(returnData[1].json.budget_control).toBe(true);
    });

    test("handles cost systems with missing optional fields", async () => {
      const mockDataWithMissingFields = [
        {
          id: "CS01",
          name: "Basic System",
          system_type: "standard",
          is_active: true,
          // missing description, dates, financial data, etc.
        },
      ];

      getCostSystemsSpy.mockResolvedValueOnce(mockDataWithMissingFields);
      const context = createMockContext();
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({
        id: "CS01",
        name: "Basic System",
        system_type: "standard",
        is_active: true,
      });
    });

    test("handles cost systems with currency information", async () => {
      const mockDataWithCurrency = [
        {
          id: "CS01",
          name: "EUR System",
          default_currency: "EUR",
          exchange_rate: 1.0,
        },
        {
          id: "CS02",
          name: "USD System",
          default_currency: "USD",
          exchange_rate: 1.1,
        },
        {
          id: "CS03",
          name: "GBP System",
          default_currency: "GBP",
          exchange_rate: 0.85,
        },
      ];

      getCostSystemsSpy.mockResolvedValueOnce(mockDataWithCurrency);
      const context = createMockContext();
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json.default_currency).toBe("EUR");
      expect(returnData[1].json.default_currency).toBe("USD");
      expect(returnData[2].json.default_currency).toBe("GBP");
      expect(returnData[0].json.exchange_rate).toBe(1.0);
      expect(returnData[1].json.exchange_rate).toBe(1.1);
      expect(returnData[2].json.exchange_rate).toBe(0.85);
    });

    test("handles cost systems with date fields", async () => {
      const mockDataWithDates = [
        {
          id: "CS01",
          name: "Active System",
          created_date: "2023-01-01T00:00:00Z",
          last_modified: "2023-11-01T09:30:00Z",
          last_calculation: "2023-10-31T23:59:59Z",
        },
        {
          id: "CS02",
          name: "Deactivated System",
          created_date: "2023-01-15T00:00:00Z",
          last_modified: "2023-06-30T00:00:00Z",
          deactivated_date: "2023-06-30T00:00:00Z",
        },
      ];

      getCostSystemsSpy.mockResolvedValueOnce(mockDataWithDates);
      const context = createMockContext();
      const handler = new CostSystemsResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json.created_date).toBe("2023-01-01T00:00:00Z");
      expect(returnData[0].json.last_modified).toBe("2023-11-01T09:30:00Z");
      expect(returnData[0].json.last_calculation).toBe("2023-10-31T23:59:59Z");
      expect(returnData[1].json.deactivated_date).toBe("2023-06-30T00:00:00Z");
    });
  });
});
