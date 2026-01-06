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
import { CorporateStructureResourceHandler } from "../../../../nodes/MasterData/handlers/CorporateStructureResourceHandler";
import type { AuthContext } from "../../../../nodes/MasterData/types";
import * as datevConnectClientModule from "../../../../src/services/datevConnectClient";

// Test spies
let fetchCorporateStructuresSpy: any;
let fetchCorporateStructureSpy: any;
let fetchEstablishmentSpy: any;

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
        // Corporate structure operations parameters
        select: "id,name,number",
        filter: "status eq active",
        organizationId: "f43f9c3g-380c-494e-97c8-d12fff738180",
        establishmentId: "h63f9c3g-380c-494e-97c8-d12fff738180",
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

describe("CorporateStructureResourceHandler", () => {
  beforeEach(() => {
    fetchCorporateStructuresSpy = spyOn(
      datevConnectClientModule,
      "fetchCorporateStructures",
    ).mockResolvedValue([]);
    fetchCorporateStructureSpy = spyOn(
      datevConnectClientModule,
      "fetchCorporateStructure",
    ).mockResolvedValue({});
    fetchEstablishmentSpy = spyOn(
      datevConnectClientModule,
      "fetchEstablishment",
    ).mockResolvedValue({});
  });

  afterEach(() => {
    fetchCorporateStructuresSpy?.mockRestore();
    fetchCorporateStructureSpy?.mockRestore();
    fetchEstablishmentSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches corporate structures with parameters", async () => {
      const mockCorporateStructures = [
        {
          id: "f43f9c3g-380c-494e-97c8-d12fff738180",
          name: "Musterkanzlei",
          number: 1,
          status: "active",
          timestamp: "2016-03-31",
          establishments: [
            {
              id: "h63f9c3g-380c-494e-97c8-d12fff738180",
              name: "Musterkanzlei - Hauptsitz",
              number: 1,
              short_name: "Hauptsitz",
              status: "active",
              timestamp: "2018-03-31",
            },
          ],
          functional_areas: [
            {
              id: "g93e8c3g-380c-494e-97c8-d12fff738371",
              name: "Gesamtunternehmen",
              short_name: "999",
              status: "active",
              timestamp: "2018-01-31",
            },
          ],
        },
      ];
      fetchCorporateStructuresSpy.mockResolvedValueOnce(
        mockCorporateStructures,
      );

      const context = createMockContext();
      const handler = new CorporateStructureResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchCorporateStructuresSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        top: 100,
        skip: 0,
        select: "id,name,number",
        filter: "status eq active",
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockCorporateStructures[0]);
    });

    test("handles empty results", async () => {
      fetchCorporateStructuresSpy.mockResolvedValueOnce([]);

      const context = createMockContext();
      const handler = new CorporateStructureResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchCorporateStructuresSpy).toHaveBeenCalled();
      expect(returnData).toHaveLength(0);
    });

    test("handles parameters with default values", async () => {
      const mockCorporateStructures = [
        {
          id: "f43f9c3g-380c-494e-97c8-d12fff738180",
          name: "Musterkanzlei",
        },
      ];
      fetchCorporateStructuresSpy.mockResolvedValueOnce(
        mockCorporateStructures,
      );

      const context = createMockContext({
        parameters: {
          select: undefined,
          filter: undefined,
        },
      });
      const handler = new CorporateStructureResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchCorporateStructuresSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        top: 100,
        skip: 0,
        select: undefined,
        filter: undefined,
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockCorporateStructures[0]);
    });
  });

  describe("get operation", () => {
    test("fetches specific organization with parameters", async () => {
      const mockOrganization = {
        id: "f43f9c3g-380c-494e-97c8-d12fff738180",
        name: "Musterkanzlei",
        number: 1,
        status: "active",
        establishments: [],
        functional_areas: [],
      };
      fetchCorporateStructureSpy.mockResolvedValueOnce(mockOrganization);

      const context = createMockContext();
      const handler = new CorporateStructureResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(fetchCorporateStructureSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        organizationId: "f43f9c3g-380c-494e-97c8-d12fff738180",
        select: "id,name,number",
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockOrganization);
    });

    test("handles parameters with default values for get", async () => {
      const mockOrganization = {
        id: "f43f9c3g-380c-494e-97c8-d12fff738180",
        name: "Musterkanzlei",
      };
      fetchCorporateStructureSpy.mockResolvedValueOnce(mockOrganization);

      const context = createMockContext({
        parameters: {
          select: undefined,
          organizationId: "test-org-id",
        },
      });
      const handler = new CorporateStructureResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(fetchCorporateStructureSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        organizationId: "test-org-id",
        select: undefined,
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockOrganization);
    });
  });

  describe("getEstablishment operation", () => {
    test("fetches specific establishment with parameters", async () => {
      const mockEstablishment = {
        id: "h63f9c3g-380c-494e-97c8-d12fff738180",
        name: "Musterkanzlei - Hauptsitz",
        number: 1,
        short_name: "Hauptsitz",
        status: "active",
        timestamp: "2018-03-31",
      };
      fetchEstablishmentSpy.mockResolvedValueOnce(mockEstablishment);

      const context = createMockContext();
      const handler = new CorporateStructureResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getEstablishment", mockAuthContext, returnData);

      expect(fetchEstablishmentSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        organizationId: "f43f9c3g-380c-494e-97c8-d12fff738180",
        establishmentId: "h63f9c3g-380c-494e-97c8-d12fff738180",
        select: "id,name,number",
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockEstablishment);
    });

    test("handles parameters with default values for getEstablishment", async () => {
      const mockEstablishment = {
        id: "h63f9c3g-380c-494e-97c8-d12fff738180",
        name: "Musterkanzlei - Hauptsitz",
      };
      fetchEstablishmentSpy.mockResolvedValueOnce(mockEstablishment);

      const context = createMockContext({
        parameters: {
          select: undefined,
          organizationId: "test-org-id",
          establishmentId: "test-est-id",
        },
      });
      const handler = new CorporateStructureResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getEstablishment", mockAuthContext, returnData);

      expect(fetchEstablishmentSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        organizationId: "test-org-id",
        establishmentId: "test-est-id",
        select: undefined,
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockEstablishment);
    });
  });

  describe("error handling", () => {
    test("throws NodeApiError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new CorporateStructureResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("unsupportedOp", mockAuthContext, returnData),
      ).rejects.toThrow(
        'The operation "unsupportedOp" is not supported for resource "corporateStructure".',
      );
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      fetchCorporateStructuresSpy.mockRejectedValueOnce(
        new Error("API Connection Failed"),
      );

      const context = createMockContext({
        context: { continueOnFail: mock(() => true) },
      });
      const handler = new CorporateStructureResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "API Connection Failed" });
      expect(returnData[0].pairedItem).toEqual({ item: 0 });
    });

    test("throws error when continueOnFail is false", async () => {
      fetchCorporateStructureSpy.mockRejectedValueOnce(
        new Error("API Connection Failed"),
      );

      const context = createMockContext({
        context: { continueOnFail: mock(() => false) },
      });
      const handler = new CorporateStructureResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("get", mockAuthContext, returnData),
      ).rejects.toThrow("API Connection Failed");
    });

    test("handles missing organizationId parameter", async () => {
      const context = createMockContext({
        parameters: {
          organizationId: "",
        },
      });
      const handler = new CorporateStructureResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("get", mockAuthContext, returnData),
      ).rejects.toThrow();
    });

    test("handles missing establishmentId parameter", async () => {
      const context = createMockContext({
        parameters: {
          organizationId: "test-org-id",
          establishmentId: "",
        },
      });
      const handler = new CorporateStructureResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getEstablishment", mockAuthContext, returnData),
      ).rejects.toThrow();
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper authentication context", async () => {
      const mockCorporateStructures = [
        {
          id: "f43f9c3g-380c-494e-97c8-d12fff738180",
          name: "Musterkanzlei",
        },
      ];
      fetchCorporateStructuresSpy.mockResolvedValueOnce(
        mockCorporateStructures,
      );

      const customAuthContext: AuthContext = {
        host: "https://custom.api.com",
        token: "custom-token",
        clientInstanceId: "custom-instance",
      };

      const context = createMockContext();
      const handler = new CorporateStructureResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", customAuthContext, returnData);

      expect(fetchCorporateStructuresSpy).toHaveBeenCalledWith({
        ...customAuthContext,
        top: 100,
        skip: 0,
        select: "id,name,number",
        filter: "status eq active",
      });
    });

    test("handles metadata properly", async () => {
      const mockCorporateStructures = [
        {
          id: "f43f9c3g-380c-494e-97c8-d12fff738180",
          name: "Musterkanzlei",
        },
      ];
      fetchCorporateStructuresSpy.mockResolvedValueOnce(
        mockCorporateStructures,
      );

      const context = createMockContext();
      const handler = new CorporateStructureResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      // Verify metadata construction is called
      expect(context.helpers.constructExecutionMetaData).toHaveBeenCalledWith(
        [
          {
            json: {
              id: "f43f9c3g-380c-494e-97c8-d12fff738180",
              name: "Musterkanzlei",
            },
          },
        ],
        { itemData: { item: 0 } },
      );
    });

    test("respects item index in error handling", async () => {
      fetchCorporateStructuresSpy.mockRejectedValueOnce(
        new Error("Test Error"),
      );

      const context = createMockContext({
        context: { continueOnFail: mock(() => true) },
      });
      const handler = new CorporateStructureResourceHandler(context as any, 3);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].pairedItem).toEqual({ item: 3 });
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves select parameter", async () => {
      const mockCorporateStructures = [
        { id: "f43f9c3g-380c-494e-97c8-d12fff738180" },
      ];
      fetchCorporateStructuresSpy.mockResolvedValueOnce(
        mockCorporateStructures,
      );

      const context = createMockContext({
        parameters: {
          select: "id,name,status,establishments,functional_areas",
        },
      });
      const handler = new CorporateStructureResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchCorporateStructuresSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        top: 100,
        skip: 0,
        select: "id,name,status,establishments,functional_areas",
        filter: "status eq active",
      });
    });

    test("correctly retrieves filter parameter", async () => {
      const mockCorporateStructures = [
        { id: "f43f9c3g-380c-494e-97c8-d12fff738180" },
      ];
      fetchCorporateStructuresSpy.mockResolvedValueOnce(
        mockCorporateStructures,
      );

      const context = createMockContext({
        parameters: {
          filter: "contains(name, 'Muster')",
        },
      });
      const handler = new CorporateStructureResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchCorporateStructuresSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        top: 100,
        skip: 0,
        select: "id,name,number",
        filter: "contains(name, 'Muster')",
      });
    });

    test("correctly retrieves organizationId and establishmentId parameters", async () => {
      const mockEstablishment = { id: "h63f9c3g-380c-494e-97c8-d12fff738180" };
      fetchEstablishmentSpy.mockResolvedValueOnce(mockEstablishment);

      const context = createMockContext({
        parameters: {
          organizationId: "custom-org-id",
          establishmentId: "custom-est-id",
        },
      });
      const handler = new CorporateStructureResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getEstablishment", mockAuthContext, returnData);

      expect(fetchEstablishmentSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        organizationId: "custom-org-id",
        establishmentId: "custom-est-id",
        select: "id,name,number",
      });
    });
  });
});
