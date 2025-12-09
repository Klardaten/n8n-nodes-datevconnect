import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import {
  fetchChargeRates,
  fetchEmployeeCapacities,
  fetchEmployeeCostRates,
  fetchEmployeeQualifications,
  fetchEmployeesWithGroup,
} from "../../../src/services/orderManagementClient";
import type { AuthContext, EmployeeOperation, SendSuccessFunction } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

export class EmployeeResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      switch (operation as EmployeeOperation) {
        case "getCapacities":
          await this.handleGetCapacities(authContext, sendSuccess);
          break;
        case "getWithGroup":
          await this.handleGetWithGroup(authContext, sendSuccess);
          break;
        case "getQualifications":
          await this.handleGetQualifications(authContext, sendSuccess);
          break;
        case "getCostRates":
          await this.handleGetCostRates(authContext, sendSuccess);
          break;
        case "getChargeRates":
          await this.handleGetChargeRates(authContext, sendSuccess);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for employees.`,
            { itemIndex: this.itemIndex },
          );
      }
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGetCapacities(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const select = this.getOptionalString("select");
    const filter = this.getOptionalString("filter");
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);

    const response = await fetchEmployeeCapacities({
      ...authContext,
      select,
      filter,
      top: top || undefined,
      skip: skip || undefined,
    });

    sendSuccess(response);
  }

  private async handleGetWithGroup(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const select = this.getOptionalString("select");
    const filter = this.getOptionalString("filter");
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);

    const response = await fetchEmployeesWithGroup({
      ...authContext,
      select,
      filter,
      top: top || undefined,
      skip: skip || undefined,
    });

    sendSuccess(response);
  }

  private async handleGetQualifications(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const select = this.getOptionalString("select");
    const filter = this.getOptionalString("filter");
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);

    const response = await fetchEmployeeQualifications({
      ...authContext,
      select,
      filter,
      top: top || undefined,
      skip: skip || undefined,
    });

    sendSuccess(response);
  }

  private async handleGetCostRates(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const select = this.getOptionalString("select");
    const filter = this.getOptionalString("filter");
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);

    const response = await fetchEmployeeCostRates({
      ...authContext,
      select,
      filter,
      top: top || undefined,
      skip: skip || undefined,
    });

    sendSuccess(response);
  }

  private async handleGetChargeRates(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const select = this.getOptionalString("select");
    const filter = this.getOptionalString("filter");
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);

    const response = await fetchChargeRates({
      ...authContext,
      select,
      filter,
      top: top || undefined,
      skip: skip || undefined,
    });

    sendSuccess(response);
  }
}
