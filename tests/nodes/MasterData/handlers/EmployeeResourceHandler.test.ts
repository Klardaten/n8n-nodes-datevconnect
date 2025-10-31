/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test, beforeEach, afterEach, spyOn, mock } from "bun:test";
import { EmployeeResourceHandler } from "../../../../nodes/MasterData/handlers/EmployeeResourceHandler";
import type { AuthContext } from "../../../../nodes/MasterData/types";
import * as datevConnectClientModule from "../../../../src/services/datevConnectClient";

// Test spies
let fetchEmployeesSpy: any;
let fetchEmployeeSpy: any;
let createEmployeeSpy: any;
let updateEmployeeSpy: any;

// Mock IExecuteFunctions
const createMockContext = (overrides: any = {}) => ({
  getCredentials: mock().mockResolvedValue({
    host: "https://api.example.com",
    email: "user@example.com",
    password: "secret",
    clientInstanceId: "instance-1",
    ...overrides.credentials,
  }),
  getNodeParameter: mock((name: string, itemIndex: number, defaultValue?: unknown) => {
    const mockParams: Record<string, unknown> = {
      // Employee operations parameters
      "employeeId": "employee-123",
      "employeeData": '{"name":"Test Employee","email":"test@example.com"}',
      "select": "id,name,email",
      "filter": "status eq active",
      ...overrides.parameters,
    };
    return mockParams[name] !== undefined ? mockParams[name] : defaultValue;
  }),
  getNode: mock(() => ({ name: "TestNode" })),
  helpers: {
    returnJsonArray: mock((data: any[]) => data.map(entry => ({ json: entry }))),
    constructExecutionMetaData: mock((data: any[], meta: any) => 
      data.map(entry => ({ ...entry, pairedItem: meta.itemData }))
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

describe("EmployeeResourceHandler", () => {
  beforeEach(() => {
    fetchEmployeesSpy = spyOn(datevConnectClientModule, "fetchEmployees").mockResolvedValue([]);
    fetchEmployeeSpy = spyOn(datevConnectClientModule, "fetchEmployee").mockResolvedValue({ id: "employee-123" });
    createEmployeeSpy = spyOn(datevConnectClientModule, "createEmployee").mockResolvedValue(undefined);
    updateEmployeeSpy = spyOn(datevConnectClientModule, "updateEmployee").mockResolvedValue(undefined);
  });

  afterEach(() => {
    fetchEmployeesSpy?.mockRestore();
    fetchEmployeeSpy?.mockRestore();
    createEmployeeSpy?.mockRestore();
    updateEmployeeSpy?.mockRestore();
  });

  describe("getAll operation", () => {
    test("fetches employees with parameters", async () => {
      const mockEmployees = [
        { id: "1", name: "Employee 1", email: "emp1@example.com" },
        { id: "2", name: "Employee 2", email: "emp2@example.com" }
      ];
      fetchEmployeesSpy.mockResolvedValueOnce(mockEmployees);

      const context = createMockContext();
      const handler = new EmployeeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchEmployeesSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        select: "id,name,email",
        filter: "status eq active",
      });

      expect(returnData).toHaveLength(2);
      expect(returnData[0].json).toEqual({ id: "1", name: "Employee 1", email: "emp1@example.com" });
      expect(returnData[1].json).toEqual({ id: "2", name: "Employee 2", email: "emp2@example.com" });
    });

    test("handles empty results", async () => {
      fetchEmployeesSpy.mockResolvedValueOnce([]);

      const context = createMockContext();
      const handler = new EmployeeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchEmployeesSpy).toHaveBeenCalled();
      expect(returnData).toHaveLength(0);
    });

    test("handles parameters with default values", async () => {
      const mockEmployees = [{ id: "1", name: "Employee 1" }];
      fetchEmployeesSpy.mockResolvedValueOnce(mockEmployees);

      const context = createMockContext({
        parameters: {
          select: undefined,
          filter: undefined,
        },
      });
      const handler = new EmployeeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchEmployeesSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        select: undefined,
        filter: undefined,
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ id: "1", name: "Employee 1" });
    });
  });

  describe("get operation", () => {
    test("fetches single employee by ID", async () => {
      const mockEmployee = { id: "employee-123", name: "Test Employee", email: "test@example.com" };
      fetchEmployeeSpy.mockResolvedValueOnce(mockEmployee);

      const context = createMockContext();
      const handler = new EmployeeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(fetchEmployeeSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        employeeId: "employee-123",
        select: "id,name,email",
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockEmployee);
    });

    test("handles parameters with default values for get", async () => {
      const mockEmployee = { id: "employee-123", name: "Test Employee" };
      fetchEmployeeSpy.mockResolvedValueOnce(mockEmployee);

      const context = createMockContext({
        parameters: {
          employeeId: "employee-123",
          select: undefined,
        },
      });
      const handler = new EmployeeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(fetchEmployeeSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        employeeId: "employee-123",
        select: undefined,
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockEmployee);
    });
  });

  describe("create operation", () => {
    test("creates employee with data", async () => {
      const mockResponse = { id: "new-employee-456" };
      createEmployeeSpy.mockResolvedValueOnce(mockResponse);

      const context = createMockContext();
      const handler = new EmployeeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createEmployeeSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        employee: { name: "Test Employee", email: "test@example.com" },
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockResponse);
    });

    test("creates employee without response data", async () => {
      createEmployeeSpy.mockResolvedValueOnce(undefined);

      const context = createMockContext();
      const handler = new EmployeeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("create", mockAuthContext, returnData);

      expect(createEmployeeSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        employee: { name: "Test Employee", email: "test@example.com" },
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });
  });

  describe("update operation", () => {
    test("updates employee with data", async () => {
      const mockResponse = { id: "employee-123", updated: true };
      updateEmployeeSpy.mockResolvedValueOnce(mockResponse);

      const context = createMockContext();
      const handler = new EmployeeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("update", mockAuthContext, returnData);

      expect(updateEmployeeSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        employeeId: "employee-123",
        employee: { name: "Test Employee", email: "test@example.com" },
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual(mockResponse);
    });

    test("updates employee without response data", async () => {
      updateEmployeeSpy.mockResolvedValueOnce(undefined);

      const context = createMockContext();
      const handler = new EmployeeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("update", mockAuthContext, returnData);

      expect(updateEmployeeSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        employeeId: "employee-123",
        employee: { name: "Test Employee", email: "test@example.com" },
      });

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ success: true });
    });
  });

  describe("error handling", () => {
    test("throws NodeApiError for unsupported operation", async () => {
      const context = createMockContext();
      const handler = new EmployeeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("unsupportedOp", mockAuthContext, returnData)
      ).rejects.toThrow("The operation \"unsupportedOp\" is not supported for resource \"employee\".");
    });

    test("handles API errors gracefully when continueOnFail is true", async () => {
      fetchEmployeesSpy.mockRejectedValueOnce(new Error("Network timeout"));

      const context = createMockContext({
        context: { continueOnFail: mock(() => true) },
      });
      const handler = new EmployeeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData).toHaveLength(1);
      expect(returnData[0].json).toEqual({ error: "Network timeout" });
      expect(returnData[0].pairedItem).toEqual({ item: 0 });
    });

    test("propagates error when continueOnFail is false", async () => {
      fetchEmployeesSpy.mockRejectedValueOnce(new Error("API Connection Failed"));

      const context = createMockContext({
        context: { continueOnFail: mock(() => false) },
      });
      const handler = new EmployeeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await expect(
        handler.execute("getAll", mockAuthContext, returnData)
      ).rejects.toThrow("API Connection Failed");
    });
  });

  describe("inheritance from BaseResourceHandler", () => {
    test("uses proper authentication context", async () => {
      const mockEmployees = [{ id: "1", name: "Employee 1" }];
      fetchEmployeesSpy.mockResolvedValueOnce(mockEmployees);

      const customAuthContext: AuthContext = {
        host: "https://staging.api.com",
        token: "staging-token",
        clientInstanceId: "staging-instance",
      };

      const context = createMockContext();
      const handler = new EmployeeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", customAuthContext, returnData);

      expect(fetchEmployeesSpy).toHaveBeenCalledWith({
        ...customAuthContext,
        select: "id,name,email",
        filter: "status eq active",
      });
    });

    test("handles metadata properly", async () => {
      const mockEmployees = [{ id: "emp-123", name: "Test Employee" }];
      fetchEmployeesSpy.mockResolvedValueOnce(mockEmployees);

      const context = createMockContext();
      const handler = new EmployeeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      // Verify metadata construction is called  
      expect(context.helpers.constructExecutionMetaData).toHaveBeenCalledWith(
        [{ json: { id: "emp-123", name: "Test Employee" } }],
        { itemData: { item: 0 } }
      );
    });

    test("respects item index in error handling", async () => {
      fetchEmployeesSpy.mockRejectedValueOnce(new Error("Test error"));

      const context = createMockContext({
        context: { continueOnFail: mock(() => true) },
      });
      const handler = new EmployeeResourceHandler(context as any, 2); // different item index
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(returnData[0].pairedItem).toEqual({ item: 2 });
    });
  });

  describe("parameter handling", () => {
    test("correctly retrieves select parameter", async () => {
      fetchEmployeesSpy.mockResolvedValueOnce([]);

      const context = createMockContext({
        parameters: { select: "id,name,status" },
      });
      const handler = new EmployeeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchEmployeesSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        select: "id,name,status",
        filter: "status eq active",
      });
    });

    test("correctly retrieves filter parameter", async () => {
      fetchEmployeesSpy.mockResolvedValueOnce([]);

      const context = createMockContext({
        parameters: { filter: "number gt 1000" },
      });
      const handler = new EmployeeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("getAll", mockAuthContext, returnData);

      expect(fetchEmployeesSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        select: "id,name,email",
        filter: "number gt 1000",
      });
    });

    test("correctly retrieves employeeId parameter", async () => {
      fetchEmployeeSpy.mockResolvedValueOnce({ id: "specific-employee" });

      const context = createMockContext({
        parameters: { employeeId: "specific-employee" },
      });
      const handler = new EmployeeResourceHandler(context as any, 0);
      const returnData: any[] = [];

      await handler.execute("get", mockAuthContext, returnData);

      expect(fetchEmployeeSpy).toHaveBeenCalledWith({
        ...mockAuthContext,
        employeeId: "specific-employee",
        select: "id,name,email",
      });
    });
  });
});