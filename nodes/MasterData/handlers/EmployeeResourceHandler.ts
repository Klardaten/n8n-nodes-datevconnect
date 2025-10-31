import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import {
  type JsonValue,
  fetchEmployees,
  fetchEmployee,
  createEmployee,
  updateEmployee,
} from "../../../src/services/datevConnectClient";
import type { AuthContext, EmployeeOperation } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

/**
 * Handler for all employee-related operations
 */
export class EmployeeResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      let response: JsonValue | undefined;

      switch (operation as EmployeeOperation) {
        case "getAll":
          response = await this.handleGetAll(authContext);
          break;
        case "get":
          response = await this.handleGet(authContext);
          break;
        case "create":
          response = await this.handleCreate(authContext);
          break;
        case "update":
          response = await this.handleUpdate(authContext);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for resource "employee".`,
            { itemIndex: this.itemIndex },
          );
      }

      sendSuccess(response);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGetAll(authContext: AuthContext): Promise<JsonValue> {
    const select = this.getOptionalString("select");
    const filter = this.getOptionalString("filter");

    return await fetchEmployees({
      ...authContext,
      select,
      filter,
    });
  }

  private async handleGet(authContext: AuthContext): Promise<JsonValue> {
    const employeeId = this.getRequiredString("employeeId");
    const select = this.getOptionalString("select");

    return await fetchEmployee({
      ...authContext,
      employeeId,
      select,
    });
  }

  private async handleCreate(authContext: AuthContext): Promise<JsonValue | undefined> {
    const rawEmployee = this.context.getNodeParameter("employeeData", this.itemIndex);
    const employeePayload = this.parseJsonParameter(rawEmployee, "Employee Data");

    return await createEmployee({
      ...authContext,
      employee: employeePayload,
    });
  }

  private async handleUpdate(authContext: AuthContext): Promise<JsonValue | undefined> {
    const employeeId = this.getRequiredString("employeeId");
    const rawEmployee = this.context.getNodeParameter("employeeData", this.itemIndex);
    const employeePayload = this.parseJsonParameter(rawEmployee, "Employee Data");

    return await updateEmployee({
      ...authContext,
      employeeId,
      employee: employeePayload,
    });
  }
}