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
import { AddresseeResourceHandler } from "../../../../nodes/MasterData/handlers/AddresseeResourceHandler";
import type { AuthContext } from "../../../../nodes/MasterData/types";
import * as datevConnectClientModule from "../../../../src/services/datevConnectClient";

// Test spies
let fetchAddresseesSpy: any;
let fetchAddresseeSpy: any;
let createAddresseeSpy: any;
let updateAddresseeSpy: any;
let fetchAddresseesDeletionLogSpy: any;

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
        addresseeId: "addressee-123",
        addresseeData: '{"name":"Test Addressee"}',
        top: 50,
        skip: 10,
        select: "id,name",
        filter: "status eq active",
        expand: "category",
        nationalRight: true,
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

describe("AddresseeResourceHandler", () => {
  beforeEach(() => {
    // Set up spies for all addressee API functions
    fetchAddresseesSpy = spyOn(
      datevConnectClientModule,
      "fetchAddressees",
    ).mockResolvedValue([]);
    fetchAddresseeSpy = spyOn(
      datevConnectClientModule,
      "fetchAddressee",
    ).mockResolvedValue({ id: "addressee-123" });
    createAddresseeSpy = spyOn(
      datevConnectClientModule,
      "createAddressee",
    ).mockResolvedValue(undefined);
    updateAddresseeSpy = spyOn(
      datevConnectClientModule,
      "updateAddressee",
    ).mockResolvedValue(undefined);
    fetchAddresseesDeletionLogSpy = spyOn(
      datevConnectClientModule,
      "fetchAddresseesDeletionLog",
    ).mockResolvedValue([]);
  });

  afterEach(() => {
    // Restore all spies
    fetchAddresseesSpy?.mockRestore();
    fetchAddresseeSpy?.mockRestore();
    createAddresseeSpy?.mockRestore();
    updateAddresseeSpy?.mockRestore();
    fetchAddresseesDeletionLogSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches addressees with parameters", async () => {
      const mockAddressees = [
        { id: "1", name: "Addressee 1" },
        { id: "2", name: "Addressee 2" },
      ];
      fetchAddresseesSpy.mockResolvedValueOnce(mockAddressees);

      const context = createMockContext();
      const handler = new AddresseeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchAddresseesSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        top: 50,
        skip: 10,
        select: "id,name",
        filter: "status eq active",
      });

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({ id: "1", name: "Addressee 1" });
      expect(returnData[1].json).toEqual({ id: "2", name: "Addressee 2" });
    });
  });

  describe("get operation", () => {
    test("fetches single addressee by ID", async () => {
      const mockAddressee = { id: "addressee-123", name: "Test Addressee" };
      fetchAddresseeSpy.mockResolvedValueOnce(mockAddressee);

      const context = createMockContext();
      const handler = new AddresseeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(fetchAddresseeSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        addresseeId: "addressee-123",
        select: "id,name",
        expand: "category",
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "addressee-123",
        name: "Test Addressee",
      });
    });
  });

  describe("create operation", () => {
    test("creates new addressee", async () => {
      const mockCreatedAddressee = {
        id: "new-addressee",
        name: "New Addressee",
      };
      createAddresseeSpy.mockResolvedValueOnce(mockCreatedAddressee);

      const context = createMockContext();
      const handler = new AddresseeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createAddresseeSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        addressee: { name: "Test Addressee" },
        nationalRight: undefined,
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "new-addressee",
        name: "New Addressee",
      });
    });
  });

  describe("update operation", () => {
    test("updates existing addressee", async () => {
      const mockUpdatedAddressee = {
        id: "addressee-123",
        name: "Updated Addressee",
      };
      updateAddresseeSpy.mockResolvedValueOnce(mockUpdatedAddressee);

      const context = createMockContext();
      const handler = new AddresseeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("update", mockAuthContext, returnData);

      expect(updateAddresseeSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        addresseeId: "addressee-123",
        addressee: { name: "Test Addressee" },
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({
        id: "addressee-123",
        name: "Updated Addressee",
      });
    });
  });

  describe("getDeletionLog operation", () => {
    test("fetches addressee deletion log", async () => {
      const mockDeletionLog = [
        { id: "deleted-1", deletedAt: "2023-01-01" },
        { id: "deleted-2", deletedAt: "2023-01-02" },
      ];
      fetchAddresseesDeletionLogSpy.mockResolvedValueOnce(mockDeletionLog);

      const context = createMockContext();
      const handler = new AddresseeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getDeletionLog", mockAuthContext, returnData);

      expect(fetchAddresseesDeletionLogSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        top: 50,
        skip: 10,
        select: "id,name",
        filter: "status eq active",
      });

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({
        id: "deleted-1",
        deletedAt: "2023-01-01",
      });
      expect(returnData[1].json).toEqual({
        id: "deleted-2",
        deletedAt: "2023-01-02",
      });
    });
  });

  describe("error handling", () => {
    test("handles API errors gracefully", async () => {
      fetchAddresseesSpy.mockRejectedValueOnce(new Error("API Error"));

      const context = createMockContext();
      const handler = new AddresseeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData),
      ).rejects.toThrow("API Error");
    });

    test("handles invalid operation", async () => {
      const context = createMockContext();
      context.continueOnFail.mockReturnValue(true);

      const handler = new AddresseeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute(
        "invalidOperation" as any,
        mockAuthContext,
        returnData,
      );

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json.error).toContain(
        'not supported for resource "addressee"',
      );
    });
  });
});
