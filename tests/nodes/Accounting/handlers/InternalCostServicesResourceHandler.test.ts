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
import { InternalCostServicesResourceHandler } from "../../../../nodes/Accounting/handlers/InternalCostServicesResourceHandler";
import type { AuthContext } from "../../../../nodes/Accounting/types";
import { datevConnectClient } from "../../../../src/services/accountingClient";

// Test spies
let createInternalCostServiceSpy: any;

// Mock data
const mockCreatedInternalCostService = {
  id: "ICS001",
  cost_system_id: "CS01",
  service_name: "IT Support Services",
  service_description: "Internal IT support and maintenance services",
  service_type: "technical_support",
  cost_center_id: "CC001",
  target_cost_center_id: "CC002",
  service_date: "2023-11-01",
  quantity: 40.0,
  unit_of_measure: "hours",
  unit_cost: 75.0,
  total_cost: 3000.0,
  allocation_method: "direct_charge",
  allocation_basis: "actual_hours",
  is_billable: true,
  billable_rate: 85.0,
  markup_percentage: 13.33,
  cost_category: "operational",
  department_code: "IT",
  project_id: "PRJ001",
  work_order_id: "WO001",
  service_provider: "Internal IT Team",
  service_recipient: "Production Department",
  approval_status: "approved",
  approved_by: "manager.it@company.com",
  approval_date: "2023-11-01T14:30:00Z",
  created_date: "2023-11-01T10:00:00Z",
  created_by: "user.admin@company.com",
  last_modified: "2023-11-01T14:30:00Z",
  fiscal_period: "2023-11",
  status: "active",
};

const mockComplexInternalCostService = {
  id: "ICS002",
  cost_system_id: "CS01",
  service_name: "Facilities Management",
  service_description: "Building maintenance and facilities services",
  service_type: "facilities",
  cost_center_id: "CC003",
  target_cost_center_id: "CC004",
  service_date: "2023-11-01",
  quantity: 1.0,
  unit_of_measure: "service",
  unit_cost: 2500.0,
  total_cost: 2500.0,
  allocation_method: "activity_based",
  allocation_basis: "square_footage",
  is_billable: false,
  cost_category: "overhead",
  department_code: "FAC",
  service_provider: "Facilities Team",
  service_recipient: "All Departments",
  allocation_details: [
    {
      target_center: "CC001",
      allocation_percentage: 0.25,
      allocated_amount: 625.0,
      allocation_driver: "office_space",
    },
    {
      target_center: "CC002",
      allocation_percentage: 0.45,
      allocated_amount: 1125.0,
      allocation_driver: "production_area",
    },
    {
      target_center: "CC005",
      allocation_percentage: 0.3,
      allocated_amount: 750.0,
      allocation_driver: "warehouse_space",
    },
  ],
  cost_drivers: [
    {
      driver_type: "square_footage",
      total_driver_units: 10000.0,
      cost_per_unit: 0.25,
    },
  ],
  approval_status: "pending",
  created_date: "2023-11-01T11:00:00Z",
  created_by: "user.facilities@company.com",
  fiscal_period: "2023-11",
  status: "active",
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
        internalCostServiceData: JSON.stringify({
          service_name: "IT Support Services",
          service_description: "Internal IT support and maintenance services",
          service_type: "technical_support",
          cost_center_id: "CC001",
          target_cost_center_id: "CC002",
          service_date: "2023-11-01",
          quantity: 40.0,
          unit_of_measure: "hours",
          unit_cost: 75.0,
          total_cost: 3000.0,
          allocation_method: "direct_charge",
          is_billable: true,
        }),
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

describe("InternalCostServicesResourceHandler", () => {
  beforeEach(() => {
    createInternalCostServiceSpy = spyOn(
      datevConnectClient.accounting,
      "createInternalCostService",
    ).mockResolvedValue(mockCreatedInternalCostService);
  });

  afterEach(() => {
    createInternalCostServiceSpy?.mockRestore();
  });

  describe("create operation", () => {
    test("creates internal cost service with valid data", async () => {
      const context = createMockContext();
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createInternalCostServiceSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        {
          service_name: "IT Support Services",
          service_description: "Internal IT support and maintenance services",
          service_type: "technical_support",
          cost_center_id: "CC001",
          target_cost_center_id: "CC002",
          service_date: "2023-11-01",
          quantity: 40.0,
          unit_of_measure: "hours",
          unit_cost: 75.0,
          total_cost: 3000.0,
          allocation_method: "direct_charge",
          is_billable: true,
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "ICS001",
        cost_system_id: "CS01",
        service_name: "IT Support Services",
        service_description: "Internal IT support and maintenance services",
        service_type: "technical_support",
        cost_center_id: "CC001",
        target_cost_center_id: "CC002",
        service_date: "2023-11-01",
        quantity: 40.0,
        unit_of_measure: "hours",
        unit_cost: 75.0,
        total_cost: 3000.0,
        allocation_method: "direct_charge",
        allocation_basis: "actual_hours",
        is_billable: true,
        billable_rate: 85.0,
        markup_percentage: 13.33,
        cost_category: "operational",
        department_code: "IT",
        project_id: "PRJ001",
        work_order_id: "WO001",
        service_provider: "Internal IT Team",
        service_recipient: "Production Department",
        approval_status: "approved",
        approved_by: "manager.it@company.com",
        approval_date: "2023-11-01T14:30:00Z",
        created_date: "2023-11-01T10:00:00Z",
        created_by: "user.admin@company.com",
        last_modified: "2023-11-01T14:30:00Z",
        fiscal_period: "2023-11",
        status: "active",
      });
    });

    test("creates complex internal cost service with allocation details", async () => {
      createInternalCostServiceSpy.mockResolvedValueOnce(
        mockComplexInternalCostService,
      );
      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          internalCostServiceData: JSON.stringify({
            service_name: "Facilities Management",
            service_description: "Building maintenance and facilities services",
            service_type: "facilities",
            cost_center_id: "CC003",
            target_cost_center_id: "CC004",
            service_date: "2023-11-01",
            quantity: 1.0,
            unit_of_measure: "service",
            unit_cost: 2500.0,
            total_cost: 2500.0,
            allocation_method: "activity_based",
            is_billable: false,
            allocation_details: [
              {
                target_center: "CC001",
                allocation_percentage: 0.25,
                allocated_amount: 625.0,
              },
            ],
          }),
        },
      });
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createInternalCostServiceSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        expect.objectContaining({
          service_name: "Facilities Management",
          service_type: "facilities",
          allocation_method: "activity_based",
          is_billable: false,
        }),
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json.service_name).toBe("Facilities Management");
      expect(returnData[0].json.allocation_details).toHaveLength(3);
      expect(returnData[0].json.cost_drivers).toHaveLength(1);
    });

    test("handles null response from create", async () => {
      createInternalCostServiceSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("requires costSystemId parameter", async () => {
      const context = createMockContext({
        parameters: { costSystemId: undefined },
      });
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("create", mockAuthContext, returnData),
      ).rejects.toThrow('Parameter "costSystemId" is required');
    });

    test("handles undefined internalCostServiceData parameter gracefully", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          // internalCostServiceData is missing from parameters
        },
      });
      // Override getNodeParameter to return undefined for internalCostServiceData
      context.getNodeParameter = mock(
        (name: string, itemIndex: number, defaultValue?: unknown) => {
          if (name === "internalCostServiceData") return undefined;
          if (name === "costSystemId") return "CS01";
          return defaultValue;
        },
      );

      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      // The handler handles undefined parameters gracefully
      await handler.execute("create", mockAuthContext, returnData);

      // Verify it calls the API with undefined data when parameter is undefined
      expect(createInternalCostServiceSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        undefined, // parseJsonParameter returns undefined when input is undefined
      );
      expect(returnData).toHaveLength(1);
    });

    test("handles invalid JSON in internalCostServiceData parameter", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          internalCostServiceData: "invalid json string",
        },
      });
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("create", mockAuthContext, returnData),
      ).rejects.toThrow('Invalid JSON in parameter "internalCostServiceData"');
    });

    test("creates internal cost service with minimal required data", async () => {
      const minimalServiceData = {
        id: "ICS003",
        cost_system_id: "CS01",
        service_name: "Basic Service",
        cost_center_id: "CC001",
        target_cost_center_id: "CC002",
        service_date: "2023-11-01",
        total_cost: 1000.0,
        created_date: "2023-11-01T12:00:00Z",
        status: "active",
      };

      createInternalCostServiceSpy.mockResolvedValueOnce(minimalServiceData);
      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          internalCostServiceData: JSON.stringify({
            service_name: "Basic Service",
            cost_center_id: "CC001",
            target_cost_center_id: "CC002",
            service_date: "2023-11-01",
            total_cost: 1000.0,
          }),
        },
      });
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(returnData[0].json.service_name).toBe("Basic Service");
      expect(returnData[0].json.total_cost).toBe(1000.0);
    });

    test("creates billable internal cost service", async () => {
      const billableServiceData = {
        id: "ICS004",
        cost_system_id: "CS01",
        service_name: "Consulting Services",
        service_type: "consulting",
        cost_center_id: "CC001",
        target_cost_center_id: "CC002",
        service_date: "2023-11-01",
        quantity: 20.0,
        unit_of_measure: "hours",
        unit_cost: 100.0,
        total_cost: 2000.0,
        is_billable: true,
        billable_rate: 150.0,
        markup_percentage: 50.0,
        created_date: "2023-11-01T13:00:00Z",
        status: "active",
      };

      createInternalCostServiceSpy.mockResolvedValueOnce(billableServiceData);
      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          internalCostServiceData: JSON.stringify({
            service_name: "Consulting Services",
            service_type: "consulting",
            cost_center_id: "CC001",
            target_cost_center_id: "CC002",
            service_date: "2023-11-01",
            quantity: 20.0,
            unit_of_measure: "hours",
            unit_cost: 100.0,
            total_cost: 2000.0,
            is_billable: true,
            billable_rate: 150.0,
          }),
        },
      });
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(returnData[0].json.is_billable).toBe(true);
      expect(returnData[0].json.billable_rate).toBe(150.0);
      expect(returnData[0].json.markup_percentage).toBe(50.0);
    });
  });

  describe("error handling", () => {
    test("throws NodeOperationError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll" as any, mockAuthContext, returnData),
      ).rejects.toThrow("Unknown operation: getAll");
    });

    test("throws NodeOperationError for get operation", async () => {
      const context = createMockContext();
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("get" as any, mockAuthContext, returnData),
      ).rejects.toThrow("Unknown operation: get");
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      createInternalCostServiceSpy.mockRejectedValueOnce(
        new Error("API Error: Validation failed"),
      );
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        error: "API Error: Validation failed",
      });
    });

    test("propagates error when continueOnFail is false", async () => {
      createInternalCostServiceSpy.mockRejectedValueOnce(
        new Error("API Error: Validation failed"),
      );
      const context = createMockContext();
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("create", mockAuthContext, returnData),
      ).rejects.toThrow("API Error: Validation failed");
    });

    test("handles missing costSystemId parameter error", async () => {
      const context = createMockContext({
        parameters: { costSystemId: "" },
      });
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("create", mockAuthContext, returnData),
      ).rejects.toThrow('Parameter "costSystemId" is required');
    });

    test("handles network timeout errors", async () => {
      createInternalCostServiceSpy.mockRejectedValueOnce(
        new Error("Network timeout"),
      );
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "Network timeout" });
    });

    test("handles authentication errors", async () => {
      createInternalCostServiceSpy.mockRejectedValueOnce(
        new Error("Unauthorized"),
      );
      const context = createMockContext();
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("create", mockAuthContext, returnData),
      ).rejects.toThrow("Unauthorized");
    });

    test("handles validation errors from API", async () => {
      createInternalCostServiceSpy.mockRejectedValueOnce(
        new Error("Validation Error: Invalid cost center"),
      );
      const context = createMockContext();
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("create", mockAuthContext, returnData),
      ).rejects.toThrow("Validation Error: Invalid cost center");
    });

    test("handles malformed JSON gracefully", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          internalCostServiceData: "{invalid json",
        },
      });
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("create", mockAuthContext, returnData),
      ).rejects.toThrow('Invalid JSON in parameter "internalCostServiceData"');
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper execution context", async () => {
      const context = createMockContext();
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createInternalCostServiceSpy).toHaveBeenCalledWith(
        context,
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(Object),
      );
    });

    test("handles metadata properly", async () => {
      const context = createMockContext();
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual(mockCreatedInternalCostService);
    });

    test("respects item index in error handling", async () => {
      createInternalCostServiceSpy.mockRejectedValueOnce(
        new Error("Test error"),
      );
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new InternalCostServicesResourceHandler(context, 2);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({ error: "Test error" });
    });

    test("constructs proper sendSuccess function", async () => {
      const context = createMockContext();
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      // Verify that the handler constructs data properly through BaseResourceHandler
      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toBeDefined();
    });

    test("uses parseJsonParameter correctly", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          internalCostServiceData: JSON.stringify({
            service_name: "Test Service",
            cost_center_id: "CC001",
            target_cost_center_id: "CC002",
            total_cost: 500.0,
          }),
        },
      });
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createInternalCostServiceSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        expect.objectContaining({
          service_name: "Test Service",
          cost_center_id: "CC001",
          target_cost_center_id: "CC002",
          total_cost: 500.0,
        }),
      );
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves costSystemId parameter", async () => {
      const context = createMockContext({
        parameters: { costSystemId: "TEST_CS" },
      });
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createInternalCostServiceSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "TEST_CS",
        expect.any(Object),
      );
    });

    test("correctly parses complex internalCostServiceData", async () => {
      const complexData = {
        service_name: "Complex Service",
        service_description: "A complex internal service",
        service_type: "multi_department",
        cost_center_id: "CC001",
        target_cost_center_id: "CC002",
        service_date: "2023-11-01",
        quantity: 100.0,
        unit_of_measure: "units",
        unit_cost: 50.0,
        total_cost: 5000.0,
        allocation_method: "activity_based",
        is_billable: true,
        billable_rate: 60.0,
        allocation_details: [
          { target_center: "CC003", allocation_percentage: 0.5 },
          { target_center: "CC004", allocation_percentage: 0.5 },
        ],
      };

      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          internalCostServiceData: JSON.stringify(complexData),
        },
      });
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createInternalCostServiceSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        expect.objectContaining({
          service_name: "Complex Service",
          service_type: "multi_department",
          allocation_method: "activity_based",
          allocation_details: expect.arrayContaining([
            expect.objectContaining({ target_center: "CC003" }),
            expect.objectContaining({ target_center: "CC004" }),
          ]),
        }),
      );
    });

    test("handles empty internalCostServiceData object", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          internalCostServiceData: JSON.stringify({}),
        },
      });
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createInternalCostServiceSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        {},
      );
    });

    test("handles string representation of internalCostServiceData", async () => {
      const stringData =
        '{"service_name":"String Service","total_cost":1000.00}';
      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          internalCostServiceData: stringData,
        },
      });
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createInternalCostServiceSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        expect.objectContaining({
          service_name: "String Service",
          total_cost: 1000.0,
        }),
      );
    });
  });

  describe("data validation", () => {
    test("handles various service types", async () => {
      const serviceTypes = [
        "technical_support",
        "facilities",
        "consulting",
        "administrative",
        "maintenance",
      ];

      for (const serviceType of serviceTypes) {
        const serviceData = {
          id: `ICS_${serviceType}`,
          service_name: `${serviceType} Service`,
          service_type: serviceType,
          cost_system_id: "CS01",
          created_date: "2023-11-01T12:00:00Z",
          status: "active",
        };

        createInternalCostServiceSpy.mockResolvedValueOnce(serviceData);
        const context = createMockContext({
          parameters: {
            costSystemId: "CS01",
            internalCostServiceData: JSON.stringify({
              service_name: `${serviceType} Service`,
              service_type: serviceType,
            }),
          },
        });
        const handler = new InternalCostServicesResourceHandler(context, 0);
        const returnData: any[] = [];

        await handler.execute("create", mockAuthContext, returnData);

        expect(returnData[0].json.service_type).toBe(serviceType);
      }
    });

    test("handles boolean flags correctly", async () => {
      const serviceWithFlags = {
        id: "ICS005",
        service_name: "Flagged Service",
        is_billable: true,
        is_approved: false,
        is_recurring: true,
        requires_authorization: false,
        created_date: "2023-11-01T12:00:00Z",
        status: "active",
      };

      createInternalCostServiceSpy.mockResolvedValueOnce(serviceWithFlags);
      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          internalCostServiceData: JSON.stringify({
            service_name: "Flagged Service",
            is_billable: true,
            is_approved: false,
            is_recurring: true,
            requires_authorization: false,
          }),
        },
      });
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(returnData[0].json.is_billable).toBe(true);
      expect(returnData[0].json.is_approved).toBe(false);
      expect(returnData[0].json.is_recurring).toBe(true);
      expect(returnData[0].json.requires_authorization).toBe(false);
    });

    test("handles numeric precision for costs", async () => {
      const serviceWithPrecision = {
        id: "ICS006",
        service_name: "Precision Service",
        unit_cost: 123.456789,
        total_cost: 12345.6789,
        billable_rate: 150.123456,
        markup_percentage: 21.67,
        created_date: "2023-11-01T12:00:00Z",
        status: "active",
      };

      createInternalCostServiceSpy.mockResolvedValueOnce(serviceWithPrecision);
      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          internalCostServiceData: JSON.stringify({
            service_name: "Precision Service",
            unit_cost: 123.456789,
            total_cost: 12345.6789,
            billable_rate: 150.123456,
            markup_percentage: 21.67,
          }),
        },
      });
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(returnData[0].json.unit_cost).toBe(123.456789);
      expect(returnData[0].json.total_cost).toBe(12345.6789);
      expect(returnData[0].json.billable_rate).toBe(150.123456);
      expect(returnData[0].json.markup_percentage).toBe(21.67);
    });

    test("handles date fields correctly", async () => {
      const serviceWithDates = {
        id: "ICS007",
        service_name: "Date Service",
        service_date: "2023-11-01",
        created_date: "2023-11-01T10:00:00Z",
        last_modified: "2023-11-01T14:30:00Z",
        approval_date: "2023-11-01T14:30:00Z",
        status: "active",
      };

      createInternalCostServiceSpy.mockResolvedValueOnce(serviceWithDates);
      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          internalCostServiceData: JSON.stringify({
            service_name: "Date Service",
            service_date: "2023-11-01",
          }),
        },
      });
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(returnData[0].json.service_date).toBe("2023-11-01");
      expect(returnData[0].json.created_date).toBe("2023-11-01T10:00:00Z");
      expect(returnData[0].json.approval_date).toBe("2023-11-01T14:30:00Z");
    });

    test("handles special characters in service names and descriptions", async () => {
      const serviceWithSpecialChars = {
        id: "ICS008",
        service_name: "Service with Special Chars: & < > \" ' %",
        service_description:
          "Description with symbols: @#$%^&*()_+-={}[]|\\:;\"'<>?,./",
        department_code: "R&D",
        created_date: "2023-11-01T12:00:00Z",
        status: "active",
      };

      createInternalCostServiceSpy.mockResolvedValueOnce(
        serviceWithSpecialChars,
      );
      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          internalCostServiceData: JSON.stringify({
            service_name: "Service with Special Chars: & < > \" ' %",
            service_description:
              "Description with symbols: @#$%^&*()_+-={}[]|\\:;\"'<>?,./",
            department_code: "R&D",
          }),
        },
      });
      const handler = new InternalCostServicesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(returnData[0].json.service_name).toBe(
        "Service with Special Chars: & < > \" ' %",
      );
      expect(returnData[0].json.service_description).toBe(
        "Description with symbols: @#$%^&*()_+-={}[]|\\:;\"'<>?,./",
      );
      expect(returnData[0].json.department_code).toBe("R&D");
    });
  });
});
