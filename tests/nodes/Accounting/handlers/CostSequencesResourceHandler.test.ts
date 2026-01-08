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
import { CostSequencesResourceHandler } from "../../../../nodes/Accounting/handlers/CostSequencesResourceHandler";
import type { AuthContext } from "../../../../nodes/Accounting/types";
import { datevConnectClient } from "../../../../src/services/accountingClient";

// Test spies
let getCostSequencesSpy: any;
let getCostSequenceSpy: any;
let createCostSequenceSpy: any;
let getCostAccountingRecordsSpy: any;

// Mock data
const mockCostSequencesData = [
  {
    id: "SEQ001",
    name: "Production Sequence A",
    description: "Main production cost sequence",
    cost_system_id: "CS01",
    sequence_number: 1,
    sequence_type: "production",
    is_active: true,
    start_date: "2023-01-01",
    end_date: "2023-12-31",
    total_cost: 125000.5,
    unit_cost: 25.75,
    quantity: 4854,
    status: "active",
  },
  {
    id: "SEQ002",
    name: "Administrative Sequence",
    description: "Administrative overhead sequence",
    cost_system_id: "CS01",
    sequence_number: 2,
    sequence_type: "administrative",
    is_active: true,
    start_date: "2023-01-01",
    end_date: "2023-12-31",
    total_cost: 85000.25,
    unit_cost: 17.05,
    quantity: 4985,
    status: "active",
  },
  {
    id: "SEQ003",
    name: "Sales Support Sequence",
    description: "Sales support cost sequence",
    cost_system_id: "CS01",
    sequence_number: 3,
    sequence_type: "sales_support",
    is_active: false,
    start_date: "2023-01-01",
    end_date: "2023-06-30",
    total_cost: 45000.0,
    unit_cost: 15.0,
    quantity: 3000,
    status: "discontinued",
  },
];

const mockSingleCostSequence = {
  id: "SEQ001",
  name: "Production Sequence A",
  description: "Main production cost sequence",
  cost_system_id: "CS01",
  sequence_number: 1,
  sequence_type: "production",
  is_active: true,
  start_date: "2023-01-01",
  end_date: "2023-12-31",
  total_cost: 125000.5,
  unit_cost: 25.75,
  quantity: 4854,
  status: "active",
  cost_centers: [
    {
      id: "CC001",
      name: "Production Center A",
      allocated_cost: 75000.3,
    },
    {
      id: "CC002",
      name: "Quality Control",
      allocated_cost: 25000.1,
    },
  ],
  cost_drivers: [
    {
      driver_type: "machine_hours",
      driver_value: 2400.5,
      cost_per_unit: 10.42,
    },
    {
      driver_type: "labor_hours",
      driver_value: 1800.0,
      cost_per_unit: 15.33,
    },
  ],
  created_date: "2023-01-01T08:00:00Z",
  last_modified: "2023-11-01T16:45:00Z",
};

const mockCreatedCostSequence = {
  id: "SEQ004",
  name: "New Test Sequence",
  description: "Test sequence created via API",
  cost_system_id: "CS01",
  sequence_number: 4,
  sequence_type: "test",
  is_active: true,
  created_date: "2023-11-01T17:00:00Z",
  status: "created",
};

const mockCostAccountingRecords = [
  {
    id: "REC001",
    sequence_id: "SEQ001",
    record_date: "2023-10-01",
    cost_amount: 2500.75,
    quantity: 100,
    unit_cost: 25.01,
    cost_center_id: "CC001",
    account_id: "ACC001",
    description: "Production costs for October",
    transaction_type: "direct_cost",
  },
  {
    id: "REC002",
    sequence_id: "SEQ001",
    record_date: "2023-10-02",
    cost_amount: 1800.5,
    quantity: 72,
    unit_cost: 25.01,
    cost_center_id: "CC002",
    account_id: "ACC002",
    description: "Quality control costs",
    transaction_type: "overhead",
  },
  {
    id: "REC003",
    sequence_id: "SEQ001",
    record_date: "2023-10-03",
    cost_amount: 3200.25,
    quantity: 128,
    unit_cost: 25.0,
    cost_center_id: "CC001",
    account_id: "ACC001",
    description: "Additional production costs",
    transaction_type: "direct_cost",
  },
];

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
        costSequenceId: "SEQ001",
        costSequenceData: JSON.stringify({
          name: "New Test Sequence",
          description: "Test sequence created via API",
          sequence_type: "test",
          is_active: true,
        }),
        top: 50,
        skip: 10,
        select: "id,name,description,sequence_type,is_active,total_cost",
        filter: "is_active eq true",
        expand: "cost_centers,cost_drivers",
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

describe("CostSequencesResourceHandler", () => {
  beforeEach(() => {
    getCostSequencesSpy = spyOn(
      datevConnectClient.accounting,
      "getCostSequences",
    ).mockResolvedValue(mockCostSequencesData);
    getCostSequenceSpy = spyOn(
      datevConnectClient.accounting,
      "getCostSequence",
    ).mockResolvedValue(mockSingleCostSequence);
    createCostSequenceSpy = spyOn(
      datevConnectClient.accounting,
      "createCostSequence",
    ).mockResolvedValue(mockCreatedCostSequence);
    getCostAccountingRecordsSpy = spyOn(
      datevConnectClient.accounting,
      "getCostAccountingRecords",
    ).mockResolvedValue(mockCostAccountingRecords);
  });

  afterEach(() => {
    getCostSequencesSpy?.mockRestore();
    getCostSequenceSpy?.mockRestore();
    createCostSequenceSpy?.mockRestore();
    getCostAccountingRecordsSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches all cost sequences with parameters", async () => {
      const context = createMockContext();
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostSequencesSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        {
          top: 50,
          skip: 10,
          select: "id,name,description,sequence_type,is_active,total_cost",
          filter: "is_active eq true",
          expand: "cost_centers,cost_drivers",
        },
      );

      expect(returnData).toHaveLength(3);
      expect(returnData[0].json).toEqual({
        id: "SEQ001",
        name: "Production Sequence A",
        description: "Main production cost sequence",
        cost_system_id: "CS01",
        sequence_number: 1,
        sequence_type: "production",
        is_active: true,
        start_date: "2023-01-01",
        end_date: "2023-12-31",
        total_cost: 125000.5,
        unit_cost: 25.75,
        quantity: 4854,
        status: "active",
      });
    });

    test("handles empty results", async () => {
      getCostSequencesSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(0);
    });

    test("handles null response", async () => {
      getCostSequencesSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });

    test("requires costSystemId parameter", async () => {
      const context = createMockContext({
        parameters: { costSystemId: undefined },
      });
      const handler = new CostSequencesResourceHandler(context, 0);
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
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostSequencesSpy).toHaveBeenCalledWith(
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
    test("fetches single cost sequence by ID", async () => {
      const context = createMockContext();
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getCostSequenceSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        "SEQ001",
        {
          top: 50,
          skip: 10,
          select: "id,name,description,sequence_type,is_active,total_cost",
          filter: "is_active eq true",
          expand: "cost_centers,cost_drivers",
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "SEQ001",
        name: "Production Sequence A",
        description: "Main production cost sequence",
        cost_system_id: "CS01",
        sequence_number: 1,
        sequence_type: "production",
        is_active: true,
        start_date: "2023-01-01",
        end_date: "2023-12-31",
        total_cost: 125000.5,
        unit_cost: 25.75,
        quantity: 4854,
        status: "active",
        created_date: "2023-01-01T08:00:00Z",
        last_modified: "2023-11-01T16:45:00Z",
        cost_centers: [
          {
            id: "CC001",
            name: "Production Center A",
            allocated_cost: 75000.3,
          },
          {
            id: "CC002",
            name: "Quality Control",
            allocated_cost: 25000.1,
          },
        ],
        cost_drivers: [
          {
            driver_type: "machine_hours",
            driver_value: 2400.5,
            cost_per_unit: 10.42,
          },
          {
            driver_type: "labor_hours",
            driver_value: 1800,
            cost_per_unit: 15.33,
          },
        ],
      });
    });

    test("handles null response for get operation", async () => {
      getCostSequenceSpy.mockReset().mockResolvedValue(null);
      const context = createMockContext();
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });
  });

  describe("create operation", () => {
    test("creates new cost sequence with valid data", async () => {
      const context = createMockContext();
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createCostSequenceSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        "SEQ001",
        {
          name: "New Test Sequence",
          description: "Test sequence created via API",
          sequence_type: "test",
          is_active: true,
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "SEQ004",
        name: "New Test Sequence",
        description: "Test sequence created via API",
        cost_system_id: "CS01",
        sequence_number: 4,
        sequence_type: "test",
        is_active: true,
        created_date: "2023-11-01T17:00:00Z",
        status: "created",
      });
    });

    test("handles null response from create", async () => {
      createCostSequenceSpy.mockReset().mockResolvedValue(null);
      const context = createMockContext();
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });
  });

  describe("getCostAccountingRecords operation", () => {
    test("fetches cost accounting records for sequence", async () => {
      const context = createMockContext();
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute(
        "getCostAccountingRecords",
        mockAuthContext,
        returnData,
      );

      expect(getCostAccountingRecordsSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        "SEQ001",
        {
          top: 50,
          skip: 10,
          select: "id,name,description,sequence_type,is_active,total_cost",
          filter: "is_active eq true",
          expand: "cost_centers,cost_drivers",
        },
      );

      expect(returnData).toHaveLength(3);
      expect(returnData[0].json).toEqual({
        id: "REC001",
        sequence_id: "SEQ001",
        record_date: "2023-10-01",
        cost_amount: 2500.75,
        quantity: 100,
        unit_cost: 25.01,
        cost_center_id: "CC001",
        account_id: "ACC001",
        description: "Production costs for October",
        transaction_type: "direct_cost",
      });
    });

    test("handles empty cost accounting records results", async () => {
      getCostAccountingRecordsSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute(
        "getCostAccountingRecords",
        mockAuthContext,
        returnData,
      );

      expect(returnData).toHaveLength(0);
    });
  });

  describe("error handling", () => {
    test("throws NodeOperationError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new CostSequencesResourceHandler(context, 0);
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
      getCostSequencesSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Error" });
    });

    test("propagates error when continueOnFail is false", async () => {
      getCostSequencesSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext();
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("API Error");
    });

    test("handles missing costSystemId parameter error", async () => {
      const context = createMockContext({
        parameters: { costSystemId: "" },
      });
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow('Parameter "costSystemId" is required');
    });

    test("handles network timeout errors", async () => {
      getCostSequencesSpy.mockRejectedValueOnce(new Error("Network timeout"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "Network timeout" });
    });

    test("handles authentication errors", async () => {
      getCostSequencesSpy.mockRejectedValueOnce(new Error("Unauthorized"));
      const context = createMockContext();
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("Unauthorized");
    });

    test("handles invalid JSON in costSequenceData parameter", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          costSequenceId: "SEQ001",
          costSequenceData: "invalid json",
        },
      });
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("create", mockAuthContext, returnData),
      ).rejects.toThrow('Invalid JSON in parameter "costSequenceData"');
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper execution context", async () => {
      const context = createMockContext();
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostSequencesSpy).toHaveBeenCalledWith(
        context,
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(Object),
      );
    });

    test("handles metadata properly", async () => {
      const context = createMockContext();
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual(mockCostSequencesData[0]);
    });

    test("respects item index in error handling", async () => {
      getCostSequencesSpy.mockRejectedValueOnce(new Error("Test error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new CostSequencesResourceHandler(context, 2);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({ error: "Test error" });
    });

    test("constructs proper sendSuccess function", async () => {
      const context = createMockContext();
      const handler = new CostSequencesResourceHandler(context, 0);
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
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostSequencesSpy).toHaveBeenCalledWith(
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
          select: "id,name,sequence_type",
        },
      });
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostSequencesSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        expect.objectContaining({ select: "id,name,sequence_type" }),
      );
    });

    test("correctly retrieves filter parameter", async () => {
      const context = createMockContext({
        parameters: {
          costSystemId: "CS01",
          filter: "sequence_type eq 'production'",
        },
      });
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostSequencesSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        expect.objectContaining({ filter: "sequence_type eq 'production'" }),
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
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostSequencesSpy).toHaveBeenCalledWith(
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
          expand: "cost_centers",
        },
      });
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getCostSequencesSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "CS01",
        expect.objectContaining({ expand: "cost_centers" }),
      );
    });
  });

  describe("data validation", () => {
    test("handles cost sequences with various types", async () => {
      const mockDataWithVariousTypes = [
        {
          id: "SEQ001",
          name: "Production Sequence",
          sequence_type: "production",
          is_active: true,
          total_cost: 100000.0,
        },
        {
          id: "SEQ002",
          name: "Administrative Sequence",
          sequence_type: "administrative",
          is_active: true,
          total_cost: 50000.0,
        },
        {
          id: "SEQ003",
          name: "Sales Sequence",
          sequence_type: "sales_support",
          is_active: false,
          total_cost: 25000.0,
        },
      ];

      getCostSequencesSpy.mockResolvedValueOnce(mockDataWithVariousTypes);
      const context = createMockContext();
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(3);
      expect(returnData[0].json.sequence_type).toBe("production");
      expect(returnData[1].json.sequence_type).toBe("administrative");
      expect(returnData[2].json.sequence_type).toBe("sales_support");
    });

    test("handles cost sequences with financial data", async () => {
      const mockDataWithFinancials = [
        {
          id: "SEQ001",
          name: "Production Sequence A",
          total_cost: 125000.5,
          unit_cost: 25.75,
          quantity: 4854,
          cost_variance: -2500.25,
          budget_amount: 127500.75,
        },
      ];

      getCostSequencesSpy.mockResolvedValueOnce(mockDataWithFinancials);
      const context = createMockContext();
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json.total_cost).toBe(125000.5);
      expect(returnData[0].json.unit_cost).toBe(25.75);
      expect(returnData[0].json.quantity).toBe(4854);
      expect(returnData[0].json.cost_variance).toBe(-2500.25);
      expect(returnData[0].json.budget_amount).toBe(127500.75);
    });

    test("handles cost sequences with date ranges", async () => {
      const mockDataWithDates = [
        {
          id: "SEQ001",
          name: "Q1 Production",
          start_date: "2023-01-01",
          end_date: "2023-03-31",
          is_active: true,
        },
        {
          id: "SEQ002",
          name: "H1 Administrative",
          start_date: "2023-01-01",
          end_date: "2023-06-30",
          is_active: false,
        },
      ];

      getCostSequencesSpy.mockResolvedValueOnce(mockDataWithDates);
      const context = createMockContext();
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json.start_date).toBe("2023-01-01");
      expect(returnData[0].json.end_date).toBe("2023-03-31");
      expect(returnData[1].json.start_date).toBe("2023-01-01");
      expect(returnData[1].json.end_date).toBe("2023-06-30");
    });

    test("handles cost sequences with boolean flags", async () => {
      const mockDataWithBooleans = [
        {
          id: "SEQ001",
          name: "Active Sequence",
          is_active: true,
          is_budget_controlled: true,
          is_cost_allocated: false,
          requires_approval: true,
        },
        {
          id: "SEQ002",
          name: "Inactive Sequence",
          is_active: false,
          is_budget_controlled: false,
          is_cost_allocated: true,
          requires_approval: false,
        },
      ];

      getCostSequencesSpy.mockResolvedValueOnce(mockDataWithBooleans);
      const context = createMockContext();
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json.is_active).toBe(true);
      expect(returnData[0].json.is_budget_controlled).toBe(true);
      expect(returnData[0].json.is_cost_allocated).toBe(false);
      expect(returnData[0].json.requires_approval).toBe(true);
      expect(returnData[1].json.is_active).toBe(false);
      expect(returnData[1].json.is_budget_controlled).toBe(false);
      expect(returnData[1].json.is_cost_allocated).toBe(true);
      expect(returnData[1].json.requires_approval).toBe(false);
    });

    test("handles cost sequences with missing optional fields", async () => {
      const mockDataWithMissingFields = [
        {
          id: "SEQ001",
          name: "Basic Sequence",
          cost_system_id: "CS01",
          sequence_number: 1,
          // missing description, dates, costs, etc.
        },
      ];

      getCostSequencesSpy.mockResolvedValueOnce(mockDataWithMissingFields);
      const context = createMockContext();
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({
        id: "SEQ001",
        name: "Basic Sequence",
        cost_system_id: "CS01",
        sequence_number: 1,
      });
    });

    test("handles cost sequences with status indicators", async () => {
      const mockDataWithStatus = [
        {
          id: "SEQ001",
          name: "Active Sequence",
          status: "active",
          sequence_state: "running",
        },
        {
          id: "SEQ002",
          name: "Paused Sequence",
          status: "paused",
          sequence_state: "on_hold",
        },
        {
          id: "SEQ003",
          name: "Completed Sequence",
          status: "completed",
          sequence_state: "finished",
        },
      ];

      getCostSequencesSpy.mockResolvedValueOnce(mockDataWithStatus);
      const context = createMockContext();
      const handler = new CostSequencesResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json.status).toBe("active");
      expect(returnData[0].json.sequence_state).toBe("running");
      expect(returnData[1].json.status).toBe("paused");
      expect(returnData[1].json.sequence_state).toBe("on_hold");
      expect(returnData[2].json.status).toBe("completed");
      expect(returnData[2].json.sequence_state).toBe("finished");
    });
  });
});
