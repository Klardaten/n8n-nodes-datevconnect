import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import {
  fetchInvoice,
  fetchInvoices,
} from "../../../src/services/orderManagementClient";
import type {
  AuthContext,
  InvoiceOperation,
  SendSuccessFunction,
} from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

export class InvoiceResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      switch (operation as InvoiceOperation) {
        case "getAll":
          await this.handleGetAll(authContext, sendSuccess);
          break;
        case "get":
          await this.handleGet(authContext, sendSuccess);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for invoices.`,
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
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);

    const response = await fetchInvoices({
      ...authContext,
      select,
      filter,
      top: top || undefined,
      skip: skip || undefined,
    });

    sendSuccess(response);
  }

  private async handleGet(
    authContext: AuthContext,
    sendSuccess: SendSuccessFunction,
  ): Promise<void> {
    const invoiceId = this.getRequiredNumber("invoiceId");
    const response = await fetchInvoice({
      ...authContext,
      invoiceId,
    });

    sendSuccess(response);
  }
}
