import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import {
  createExpensePosting,
  fetchExpensePostings,
  fetchOrder,
  fetchOrderCostItems,
  fetchOrderExpensePostings,
  fetchOrderMonthlyValues,
  fetchOrders,
  fetchOrdersCostItems,
  fetchOrdersMonthlyValues,
  fetchOrdersStateWork,
  fetchSubordersStateBilling,
  fetchSubordersStateBillingAll,
  fetchOrderStateWork,
  updateOrder,
  updateSuborder,
} from "../../../src/services/orderManagementClient";
import type { AuthContext, OrderOperation, SendSuccessFunction } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

export class OrderResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      switch (operation as OrderOperation) {
        case "getAll":
          await this.handleGetAll(authContext, sendSuccess);
          break;
        case "get":
          await this.handleGet(authContext, sendSuccess);
          break;
        case "update":
          await this.handleUpdate(authContext, sendSuccess);
          break;
        case "getMonthlyValuesForOrder":
          await this.handleGetMonthlyValuesForOrder(authContext, sendSuccess);
          break;
        case "getMonthlyValuesAll":
          await this.handleGetMonthlyValuesAll(authContext, sendSuccess);
          break;
        case "getCostItemsForOrder":
          await this.handleGetCostItemsForOrder(authContext, sendSuccess);
          break;
        case "getCostItemsAll":
          await this.handleGetCostItemsAll(authContext, sendSuccess);
          break;
        case "getStateWork":
          await this.handleGetStateWork(authContext, sendSuccess);
          break;
        case "getStateWorkAll":
          await this.handleGetStateWorkAll(authContext, sendSuccess);
          break;
        case "getSubordersStateBilling":
          await this.handleGetSubordersStateBilling(authContext, sendSuccess);
          break;
        case "getSubordersStateBillingAll":
          await this.handleGetSubordersStateBillingAll(authContext, sendSuccess);
          break;
        case "getExpensePostingsForOrder":
          await this.handleGetExpensePostingsForOrder(authContext, sendSuccess);
          break;
        case "getExpensePostingsAll":
          await this.handleGetExpensePostingsAll(authContext, sendSuccess);
          break;
        case "updateSuborder":
          await this.handleUpdateSuborder(authContext, sendSuccess);
          break;
        case "createExpensePosting":
          await this.handleCreateExpensePosting(authContext, sendSuccess);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for orders.`,
            { itemIndex: this.itemIndex },
          );
      }
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGetAll(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const select = this.getOptionalString("select");
    const filter = this.getOptionalString("filter");
    const costRate = this.getOptionalCostRate();
    const expand = this.getOptionalString("expand");
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);

    this.ensureOrdersCostRateIsValid(costRate, expand);

    const response = await fetchOrders({
      ...authContext,
      select,
      filter,
      costRate,
      expand,
      top: top || undefined,
      skip: skip || undefined,
    });

    sendSuccess(response);
  }

  private async handleGet(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const orderId = this.getRequiredNumber("orderId");
    const select = this.getOptionalString("select");
    const costRate = this.getOptionalCostRate();
    const expand = this.getOptionalString("expand");

    this.ensureOrdersCostRateIsValid(costRate, expand);

    const response = await fetchOrder({
      ...authContext,
      orderId,
      select,
      costRate,
      expand,
    });

    sendSuccess(response);
  }

  private async handleUpdate(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const orderId = this.getRequiredNumber("orderId");
    const rawOrder = this.context.getNodeParameter("orderData", this.itemIndex);
    const orderPayload = this.parseJsonParameter(rawOrder, "Order Data");

    const response = await updateOrder({
      ...authContext,
      orderId,
      order: orderPayload,
    });

    sendSuccess(response ?? { success: true, orderId });
  }

  private async handleGetMonthlyValuesForOrder(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const orderId = this.getRequiredNumber("orderId");
    const select = this.getOptionalString("select");
    const costRate = this.getOptionalCostRate();

    const response = await fetchOrderMonthlyValues({
      ...authContext,
      orderId,
      select,
      costRate,
    });

    sendSuccess(response);
  }

  private async handleGetMonthlyValuesAll(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const select = this.getOptionalString("select");
    const filter = this.getOptionalString("filter");
    const costRate = this.getOptionalCostRate();
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);

    const response = await fetchOrdersMonthlyValues({
      ...authContext,
      select,
      filter,
      costRate,
      top: top || undefined,
      skip: skip || undefined,
    });

    sendSuccess(response);
  }

  private async handleGetCostItemsForOrder(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const orderId = this.getRequiredNumber("orderId");
    const select = this.getOptionalString("select");

    const response = await fetchOrderCostItems({
      ...authContext,
      orderId,
      select,
    });

    sendSuccess(response);
  }

  private async handleGetCostItemsAll(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const select = this.getOptionalString("select");
    const filter = this.getOptionalString("filter");
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);

    const response = await fetchOrdersCostItems({
      ...authContext,
      select,
      filter,
      top: top || undefined,
      skip: skip || undefined,
    });

    sendSuccess(response);
  }

  private async handleGetStateWork(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const orderId = this.getRequiredNumber("orderId");
    const select = this.getOptionalString("select");

    const response = await fetchOrderStateWork({
      ...authContext,
      orderId,
      select,
    });

    sendSuccess(response);
  }

  private async handleGetStateWorkAll(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const select = this.getOptionalString("select");
    const filter = this.getOptionalString("filter");
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);

    const response = await fetchOrdersStateWork({
      ...authContext,
      select,
      filter,
      top: top || undefined,
      skip: skip || undefined,
    });

    sendSuccess(response);
  }

  private async handleGetSubordersStateBilling(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const orderId = this.getRequiredNumber("orderId");
    const select = this.getOptionalString("select");

    const response = await fetchSubordersStateBilling({
      ...authContext,
      orderId,
      select,
    });

    sendSuccess(response);
  }

  private async handleGetSubordersStateBillingAll(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const select = this.getOptionalString("select");
    const filter = this.getOptionalString("filter");
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);

    const response = await fetchSubordersStateBillingAll({
      ...authContext,
      select,
      filter,
      top: top || undefined,
      skip: skip || undefined,
    });

    sendSuccess(response);
  }

  private async handleGetExpensePostingsForOrder(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const orderId = this.getRequiredNumber("orderId");
    const select = this.getOptionalString("select");

    const response = await fetchOrderExpensePostings({
      ...authContext,
      orderId,
      select,
    });

    sendSuccess(response);
  }

  private async handleGetExpensePostingsAll(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const select = this.getOptionalString("select");
    const filter = this.getOptionalString("filter");
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);

    const response = await fetchExpensePostings({
      ...authContext,
      select,
      filter,
      top: top || undefined,
      skip: skip || undefined,
    });

    sendSuccess(response);
  }

  private async handleUpdateSuborder(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const orderId = this.getRequiredNumber("orderId");
    const suborderId = this.getRequiredNumber("suborderId");
    const rawSuborder = this.context.getNodeParameter("suborderData", this.itemIndex);
    const suborder = this.parseJsonParameter(rawSuborder, "Suborder Data");

    const response = await updateSuborder({
      ...authContext,
      orderId,
      suborderId,
      suborder,
    });

    sendSuccess(response ?? { success: true, orderId, suborderId });
  }

  private async handleCreateExpensePosting(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const orderId = this.getRequiredNumber("orderId");
    const suborderId = this.getRequiredNumber("suborderId");
    const automaticIntegration = this.context.getNodeParameter("automaticIntegration", this.itemIndex, false) as boolean;
    const deleteMassdataOnFailure = this.context.getNodeParameter("deleteMassdataOnFailure", this.itemIndex, false) as boolean;
    const rawPosting = this.context.getNodeParameter("expensePostingData", this.itemIndex);
    const expensePosting = this.parseJsonParameter(rawPosting, "Expense Posting Data");

    const response = await createExpensePosting({
      ...authContext,
      orderId,
      suborderId,
      automaticIntegration,
      deleteMassdataOnFailure,
      expensePosting,
    });

    sendSuccess(response ?? { success: true, orderId, suborderId });
  }

  private getOptionalCostRate(): number | undefined {
    const value = this.context.getNodeParameter("costRate", this.itemIndex, undefined) as number | undefined;
    if (typeof value !== "number" || Number.isNaN(value) || value === 0) {
      return undefined;
    }
    if (value < 1 || value > 9) {
      throw new NodeOperationError(
        this.context.getNode(),
        'Cost Rate must be between 1 and 9 when provided.',
        { itemIndex: this.itemIndex },
      );
    }
    return value;
  }

  private ensureOrdersCostRateIsValid(costRate?: number, expand?: string): void {
    if (costRate === undefined || costRate === null) {
      return;
    }

    const expandParts = expand
      ?.split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean);

    if (expandParts?.includes("suborders")) {
      return;
    }

    throw new NodeOperationError(
      this.context.getNode(),
      'When using "Cost Rate" for orders, you must also expand "suborders" (expand=suborders) or use the monthly values operations.',
      { itemIndex: this.itemIndex },
    );
  }
}
