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
import { StocktakingDataResourceHandler } from "../../../../nodes/Accounting/handlers/StocktakingDataResourceHandler";
import type { AuthContext } from "../../../../nodes/Accounting/types";
import { datevConnectClient } from "../../../../src/services/accountingClient";

// Test spies
let getStocktakingDataSpy: any;
let getStocktakingDataByAssetSpy: any;
let updateStocktakingDataSpy: any;

const mockStocktakingData = [
  {
    id: "501",
    asset_number: 100,
    inventory_number: "320009",
    accounting_reason: 30,
    general_ledger_account: {
      account_number: 8400,
    },
    inventory_name: "MB Vito 109 CDI Kombi",
    acquisition_date: "2005-04-29T00:00:00+02:00",
    economic_lifetime: 120,
    kost1_cost_center_id: "cc_001",
  },
  {
    id: "502",
    asset_number: 101,
    inventory_number: "320010",
    accounting_reason: 50,
    general_ledger_account: {
      account_number: 8500,
    },
    inventory_name: "Dell Laptop Precision",
    acquisition_date: "2023-01-15T00:00:00+01:00",
    economic_lifetime: 36,
    kost1_cost_center_id: "cc_002",
  },
];

const mockSingleStocktakingData = {
  id: "501",
  asset_number: 100,
  inventory_number: "320009",
  accounting_reason: 30,
  general_ledger_account: {
    account_number: 8400,
  },
  inventory_name: "MB Vito 109 CDI Kombi",
  acquisition_date: "2005-04-29T00:00:00+02:00",
  economic_lifetime: 120,
  kost1_cost_center_id: "cc_001",
};

const mockUpdateResult = {
  id: "501",
  asset_number: 100,
  inventory_number: "320009",
  accounting_reason: 30,
  general_ledger_account: {
    account_number: 8400,
  },
  inventory_name: "MB Vito 109 CDI Kombi - Updated",
  acquisition_date: "2005-04-29T00:00:00+02:00",
  economic_lifetime: 120,
  kost1_cost_center_id: "cc_001",
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
        assetId: "ASSET001",
        stocktakingData: JSON.stringify({
          counted_quantity: 1,
          condition: "excellent",
          notes: "Updated after thorough inspection",
          verification_date: "2023-12-31T15:30:00Z",
          verified_by: "Inspector Smith",
        }),
        top: 50,
        skip: 10,
        select:
          "asset_id,asset_name,asset_category,location,counted_quantity,condition",
        filter: "status eq 'active'",
        expand: "maintenance_records,stocktaking_history",
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

describe("StocktakingDataResourceHandler", () => {
  beforeEach(() => {
    getStocktakingDataSpy = spyOn(
      datevConnectClient.accounting,
      "getStocktakingData",
    ).mockResolvedValue(mockStocktakingData as any);
    getStocktakingDataByAssetSpy = spyOn(
      datevConnectClient.accounting,
      "getStocktakingDataByAsset",
    ).mockResolvedValue(mockSingleStocktakingData as any);
    updateStocktakingDataSpy = spyOn(
      datevConnectClient.accounting,
      "updateStocktakingData",
    ).mockResolvedValue(mockUpdateResult as any);
  });

  afterEach(() => {
    getStocktakingDataSpy?.mockRestore();
    getStocktakingDataByAssetSpy?.mockRestore();
    updateStocktakingDataSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches all stocktaking data", async () => {
      const context = createMockContext();
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getStocktakingDataSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        {
          top: 50,
          skip: 10,
          select:
            "asset_id,asset_name,asset_category,location,counted_quantity,condition",
          filter: "status eq 'active'",
          expand: "maintenance_records,stocktaking_history",
        },
      );

      expect(returnData).toHaveLength(2); // Array with 2 assets becomes 2 items
      expect(returnData[0].json).toEqual(mockStocktakingData[0]);
      expect(returnData[1].json).toEqual(mockStocktakingData[1]);
    });

    test("handles empty results", async () => {
      getStocktakingDataSpy.mockResolvedValueOnce([]);
      const context = createMockContext();
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(0); // Empty array becomes no items
    });

    test("handles null response", async () => {
      getStocktakingDataSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new StocktakingDataResourceHandler(context, 0);
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
          select: "asset_id,asset_name,condition",
          filter: "department eq 'Manufacturing'",
          expand: "maintenance_records",
        },
      });
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getStocktakingDataSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        expect.objectContaining({
          top: 25,
          skip: 5,
          select: "asset_id,asset_name,condition",
          filter: "department eq 'Manufacturing'",
          expand: "maintenance_records",
        }),
      );
    });
  });

  describe("get operation", () => {
    test("fetches single asset stocktaking data", async () => {
      const context = createMockContext();
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getStocktakingDataByAssetSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "ASSET001",
        {
          top: 50,
          skip: 10,
          select:
            "asset_id,asset_name,asset_category,location,counted_quantity,condition",
          filter: "status eq 'active'",
          expand: "maintenance_records,stocktaking_history",
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockSingleStocktakingData);
    });

    test("requires assetId parameter", async () => {
      const context = createMockContext({
        parameters: { assetId: undefined },
      });
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("get", mockAuthContext, returnData),
      ).rejects.toThrow('Parameter "assetId" is required');
    });

    test("handles empty assetId parameter", async () => {
      const context = createMockContext({
        parameters: { assetId: "" },
      });
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("get", mockAuthContext, returnData),
      ).rejects.toThrow('Parameter "assetId" is required');
    });

    test("handles null response for single asset", async () => {
      getStocktakingDataByAssetSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true }); // null becomes default success response
    });

    test("fetches asset with custom parameters", async () => {
      const context = createMockContext({
        parameters: {
          assetId: "ASSET002",
          select: "asset_id,asset_name,net_book_value",
          expand: "stocktaking_history",
        },
      });
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getStocktakingDataByAssetSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "ASSET002",
        expect.objectContaining({
          select: "asset_id,asset_name,net_book_value",
          expand: "stocktaking_history",
        }),
      );
    });
  });

  describe("update operation", () => {
    test("updates stocktaking data for asset", async () => {
      const context = createMockContext();
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("update", mockAuthContext, returnData);

      expect(updateStocktakingDataSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "ASSET001",
        {
          counted_quantity: 1,
          condition: "excellent",
          notes: "Updated after thorough inspection",
          verification_date: "2023-12-31T15:30:00Z",
          verified_by: "Inspector Smith",
        },
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockUpdateResult);
    });

    test("requires assetId parameter for update", async () => {
      const context = createMockContext({
        parameters: { assetId: undefined },
      });
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("update", mockAuthContext, returnData),
      ).rejects.toThrow('Parameter "assetId" is required');
    });

    test("requires stocktakingData parameter", async () => {
      const context = createMockContext({
        parameters: { stocktakingData: undefined },
      });
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("update", mockAuthContext, returnData),
      ).rejects.toThrow('Parameter "stocktakingData" is required');
    });

    test("handles invalid JSON in stocktakingData parameter", async () => {
      const context = createMockContext({
        parameters: {
          stocktakingData: "invalid json",
        },
      });
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("update", mockAuthContext, returnData),
      ).rejects.toThrow('Invalid JSON in parameter "stocktakingData"');
    });

    test("validates stocktakingData is an object", async () => {
      const context = createMockContext({
        parameters: {
          stocktakingData: JSON.stringify([{ invalid: "array" }]),
        },
      });
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("update", mockAuthContext, returnData),
      ).rejects.toThrow("Stocktaking data must be a valid JSON object");
    });

    test("validates stocktakingData is not null", async () => {
      const context = createMockContext({
        parameters: {
          stocktakingData: JSON.stringify(null),
        },
      });
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("update", mockAuthContext, returnData),
      ).rejects.toThrow("Stocktaking data must be a valid JSON object");
    });

    test("handles complex stocktaking data update", async () => {
      const complexUpdateData = {
        counted_quantity: 2,
        expected_quantity: 1,
        difference: 1,
        condition: "fair",
        notes: "Found additional unit during stocktaking",
        verification_date: "2023-12-31T17:00:00Z",
        verified_by: "Senior Inspector",
        discrepancy_reason: "Unrecorded purchase",
        corrective_action: "Update asset register",
        maintenance_required: true,
        next_inspection_date: "2024-06-30",
      };

      const context = createMockContext({
        parameters: {
          assetId: "ASSET003",
          stocktakingData: JSON.stringify(complexUpdateData),
        },
      });
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("update", mockAuthContext, returnData);

      expect(updateStocktakingDataSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "ASSET003",
        expect.objectContaining({
          counted_quantity: 2,
          expected_quantity: 1,
          difference: 1,
          condition: "fair",
          discrepancy_reason: "Unrecorded purchase",
          corrective_action: "Update asset register",
          maintenance_required: true,
        }),
      );
    });

    test("handles null response from update", async () => {
      updateStocktakingDataSpy.mockResolvedValueOnce(null);
      const context = createMockContext();
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("update", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true }); // null becomes default success response
    });

    test("handles undefined stocktakingData parameter gracefully", async () => {
      const context = createMockContext({
        parameters: { stocktakingData: undefined },
      });
      // Override getNodeParameter to return undefined
      context.getNodeParameter = mock(
        (name: string, itemIndex: number, defaultValue?: unknown) => {
          if (name === "stocktakingData") return undefined;
          if (name === "assetId") return "ASSET001";
          return defaultValue;
        },
      );

      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("update", mockAuthContext, returnData),
      ).rejects.toThrow('Parameter "stocktakingData" is required');
    });
  });

  describe("error handling", () => {
    test("throws NodeOperationError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("unsupportedOperation", mockAuthContext, returnData),
      ).rejects.toThrow(
        'The operation "unsupportedOperation" is not supported for resource "stocktakingData".',
      );
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      getStocktakingDataSpy.mockRejectedValueOnce(new Error("API Error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Error" });
    });

    test("propagates error when continueOnFail is false", async () => {
      getStocktakingDataByAssetSpy.mockRejectedValueOnce(
        new Error("Asset not found"),
      );
      const context = createMockContext();
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("get", mockAuthContext, returnData),
      ).rejects.toThrow("Asset not found");
    });

    test("handles network timeout errors", async () => {
      updateStocktakingDataSpy.mockRejectedValueOnce(
        new Error("Network timeout"),
      );
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("update", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "Network timeout" });
    });

    test("handles authentication errors", async () => {
      getStocktakingDataSpy.mockRejectedValueOnce(new Error("Unauthorized"));
      const context = createMockContext();
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("Unauthorized");
    });

    test("handles validation errors from update operations", async () => {
      updateStocktakingDataSpy.mockRejectedValueOnce(
        new Error("Validation Error: Invalid asset condition"),
      );
      const context = createMockContext();
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("update", mockAuthContext, returnData),
      ).rejects.toThrow("Validation Error: Invalid asset condition");
    });

    test("handles database connection errors", async () => {
      getStocktakingDataByAssetSpy.mockRejectedValueOnce(
        new Error("Database connection failed"),
      );
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        error: "Database connection failed",
      });
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper execution context", async () => {
      const context = createMockContext();
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getStocktakingDataSpy).toHaveBeenCalledWith(
        context,
        expect.any(String),
        expect.any(String),
        expect.any(Object),
      );
    });

    test("handles metadata properly", async () => {
      const context = createMockContext();
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual(mockStocktakingData[0]);
    });

    test("respects item index in error handling", async () => {
      getStocktakingDataSpy.mockRejectedValueOnce(new Error("Test error"));
      const context = createMockContext({
        context: {
          continueOnFail: mock(() => true),
        },
      });

      const handler = new StocktakingDataResourceHandler(context, 2);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].json).toEqual({ error: "Test error" });
    });

    test("constructs proper sendSuccess function", async () => {
      const context = createMockContext();
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      // Verify that the handler constructs data properly through BaseResourceHandler
      expect(returnData).toHaveLength(2); // Array with 2 assets becomes 2 items
      expect(returnData[0].json).toBeDefined();
    });

    test("uses parseJsonParameter correctly for update operations", async () => {
      const context = createMockContext({
        parameters: {
          stocktakingData: JSON.stringify({
            test: "data",
            counted_quantity: 5,
          }),
        },
      });
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("update", mockAuthContext, returnData);

      expect(updateStocktakingDataSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "ASSET001",
        expect.objectContaining({
          test: "data",
          counted_quantity: 5,
        }),
      );
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves assetId parameter", async () => {
      const context = createMockContext({
        parameters: { assetId: "TEST_ASSET" },
      });
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(getStocktakingDataByAssetSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "TEST_ASSET",
        expect.any(Object),
      );
    });

    test("correctly retrieves query parameters for getAll", async () => {
      const context = createMockContext({
        parameters: {
          top: 25,
          skip: 5,
          select: "asset_id,asset_name,condition",
          filter: "location eq 'Warehouse A'",
          expand: "maintenance_records",
        },
      });
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(getStocktakingDataSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        expect.objectContaining({
          top: 25,
          skip: 5,
          select: "asset_id,asset_name,condition",
          filter: "location eq 'Warehouse A'",
          expand: "maintenance_records",
        }),
      );
    });

    test("correctly parses complex stocktaking data", async () => {
      const complexStocktakingData = {
        counted_quantity: 3,
        expected_quantity: 2,
        difference: 1,
        condition: "needs_repair",
        notes: "Asset shows signs of wear",
        verification_date: "2023-12-31T18:00:00Z",
        verified_by: "Expert Inspector",
        damage_assessment: {
          severity: "minor",
          repair_cost_estimate: 250.0,
          repair_urgency: "medium",
        },
        location_changes: [
          {
            from: "Storage Room A",
            to: "Workshop",
            date: "2023-12-15",
            reason: "Scheduled maintenance",
          },
        ],
        compliance_checks: {
          safety_inspection: "passed",
          environmental_compliance: "passed",
          certification_valid: true,
          next_certification_date: "2024-12-31",
        },
      };

      const context = createMockContext({
        parameters: {
          assetId: "COMPLEX_ASSET",
          stocktakingData: JSON.stringify(complexStocktakingData),
        },
      });
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("update", mockAuthContext, returnData);

      expect(updateStocktakingDataSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "COMPLEX_ASSET",
        expect.objectContaining({
          counted_quantity: 3,
          expected_quantity: 2,
          difference: 1,
          condition: "needs_repair",
          damage_assessment: expect.objectContaining({
            severity: "minor",
            repair_cost_estimate: 250.0,
          }),
          location_changes: expect.arrayContaining([
            expect.objectContaining({
              from: "Storage Room A",
              to: "Workshop",
            }),
          ]),
          compliance_checks: expect.objectContaining({
            safety_inspection: "passed",
            certification_valid: true,
          }),
        }),
      );
    });

    test("handles empty stocktakingData object", async () => {
      const context = createMockContext({
        parameters: {
          stocktakingData: JSON.stringify({}),
        },
      });
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("update", mockAuthContext, returnData);

      expect(updateStocktakingDataSpy).toHaveBeenCalledWith(
        context,
        "client-123",
        "FY2023",
        "ASSET001",
        {},
      );
    });
  });

  describe("data validation", () => {
    test("handles various asset categories", async () => {
      const assetsWithCategories = [
        { asset_id: "A1", asset_category: "machinery", condition: "excellent" },
        { asset_id: "A2", asset_category: "equipment", condition: "good" },
        { asset_id: "A3", asset_category: "furniture", condition: "fair" },
        { asset_id: "A4", asset_category: "vehicles", condition: "poor" },
      ];

      getStocktakingDataSpy.mockResolvedValueOnce(assetsWithCategories as any);
      const context = createMockContext();
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(4); // Array with 4 assets becomes 4 items
      expect(returnData[0].json.asset_category).toBe("machinery");
      expect(returnData[1].json.asset_category).toBe("equipment");
      expect(returnData[2].json.asset_category).toBe("furniture");
      expect(returnData[3].json.asset_category).toBe("vehicles");
    });

    test("handles asset conditions correctly", async () => {
      const assetConditions = {
        asset_id: "CONDITION_TEST",
        condition: "needs_repair",
        condition_details: {
          visual_inspection: "poor",
          functional_test: "failed",
          safety_check: "warning",
        },
      };

      getStocktakingDataByAssetSpy.mockResolvedValueOnce(
        assetConditions as any,
      );
      const context = createMockContext();
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData[0].json.condition).toBe("needs_repair");
      expect(returnData[0].json.condition_details.visual_inspection).toBe(
        "poor",
      );
      expect(returnData[0].json.condition_details.functional_test).toBe(
        "failed",
      );
    });

    test("handles numeric precision in financial data", async () => {
      const preciseAsset = {
        asset_id: "PRECISE001",
        unit_value: 1234.567,
        acquisition_cost: 9999.99,
        accumulated_depreciation: 2345.678,
        net_book_value: 7654.312,
      };

      getStocktakingDataByAssetSpy.mockResolvedValueOnce(preciseAsset as any);
      const context = createMockContext();
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData[0].json.unit_value).toBe(1234.567);
      expect(returnData[0].json.acquisition_cost).toBe(9999.99);
      expect(returnData[0].json.accumulated_depreciation).toBe(2345.678);
      expect(returnData[0].json.net_book_value).toBe(7654.312);
    });

    test("handles date fields correctly", async () => {
      const assetWithDates = {
        asset_id: "DATE001",
        stocktaking_date: "2023-12-31",
        acquisition_date: "2020-01-15",
        last_maintenance: "2023-11-15",
        next_maintenance: "2024-05-15",
        verification_date: "2023-12-31T14:30:00Z",
        warranty_until: "2025-03-10",
      };

      getStocktakingDataByAssetSpy.mockResolvedValueOnce(assetWithDates as any);
      const context = createMockContext();
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData[0].json.stocktaking_date).toBe("2023-12-31");
      expect(returnData[0].json.acquisition_date).toBe("2020-01-15");
      expect(returnData[0].json.verification_date).toBe("2023-12-31T14:30:00Z");
      expect(returnData[0].json.warranty_until).toBe("2025-03-10");
    });

    test("handles boolean flags in asset data", async () => {
      const assetWithFlags = {
        asset_id: "FLAGS001",
        is_active: true,
        requires_maintenance: false,
        is_insured: true,
        is_leased: false,
        has_warranty: true,
        is_certified: false,
      };

      getStocktakingDataByAssetSpy.mockResolvedValueOnce(assetWithFlags as any);
      const context = createMockContext();
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData[0].json.is_active).toBe(true);
      expect(returnData[0].json.requires_maintenance).toBe(false);
      expect(returnData[0].json.is_insured).toBe(true);
      expect(returnData[0].json.is_leased).toBe(false);
      expect(returnData[0].json.has_warranty).toBe(true);
      expect(returnData[0].json.is_certified).toBe(false);
    });

    test("handles nested arrays in maintenance records", async () => {
      const assetWithMaintenance = {
        asset_id: "MAINT001",
        maintenance_records: [
          {
            date: "2023-11-15",
            type: "preventive",
            cost: 150.0,
            parts_replaced: ["filter", "oil", "gasket"],
          },
          {
            date: "2023-08-10",
            type: "repair",
            cost: 300.0,
            parts_replaced: ["motor", "bearing"],
          },
        ],
      };

      getStocktakingDataByAssetSpy.mockResolvedValueOnce(
        assetWithMaintenance as any,
      );
      const context = createMockContext();
      const handler = new StocktakingDataResourceHandler(context, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(returnData[0].json.maintenance_records).toHaveLength(2);
      expect(returnData[0].json.maintenance_records[0].parts_replaced).toEqual([
        "filter",
        "oil",
        "gasket",
      ]);
      expect(returnData[0].json.maintenance_records[1].parts_replaced).toEqual([
        "motor",
        "bearing",
      ]);
    });
  });
});
