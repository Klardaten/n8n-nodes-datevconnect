import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import { NodeOperationError } from "n8n-workflow";
import { BaseResourceHandler } from "./BaseResourceHandler";
import { datevConnectClient } from "../../../src/services/accountingClient";
import type { JsonValue } from "../../../src/services/datevConnectClient";
import type { RequestContext } from "../types";

type BusinessPartnersOperation =
  | "getDebitors"
  | "getDebitor"
  | "createDebitor"
  | "updateDebitor"
  | "getNextAvailableDebitor"
  | "getCreditors"
  | "getCreditor"
  | "createCreditor"
  | "updateCreditor"
  | "getNextAvailableCreditor";

/**
 * Handler for Business Partners operations
 * Manages operations related to debitors (customers) and creditors (suppliers)
 */
export class BusinessPartnersResourceHandler extends BaseResourceHandler {
  constructor(context: IExecuteFunctions, itemIndex: number) {
    super(context, itemIndex);
  }

  private validateRequiredParameters(requestContext: RequestContext): void {
    if (!requestContext.clientId || !requestContext.fiscalYearId) {
      throw new NodeOperationError(
        this.context.getNode(),
        "Client ID and Fiscal Year ID are required for business partner operations",
        {
          itemIndex: this.itemIndex,
        },
      );
    }
  }

  async execute(
    operation: BusinessPartnersOperation,
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    switch (operation) {
      case "getDebitors":
        await this.handleGetDebitors(requestContext, returnData);
        break;
      case "getDebitor":
        await this.handleGetDebitor(requestContext, returnData);
        break;
      case "createDebitor":
        await this.handleCreateDebitor(requestContext, returnData);
        break;
      case "updateDebitor":
        await this.handleUpdateDebitor(requestContext, returnData);
        break;
      case "getNextAvailableDebitor":
        await this.handleGetNextAvailableDebitor(requestContext, returnData);
        break;
      case "getCreditors":
        await this.handleGetCreditors(requestContext, returnData);
        break;
      case "getCreditor":
        await this.handleGetCreditor(requestContext, returnData);
        break;
      case "createCreditor":
        await this.handleCreateCreditor(requestContext, returnData);
        break;
      case "updateCreditor":
        await this.handleUpdateCreditor(requestContext, returnData);
        break;
      case "getNextAvailableCreditor":
        await this.handleGetNextAvailableCreditor(requestContext, returnData);
        break;
      default:
        throw new NodeOperationError(
          this.context.getNode(),
          `Unknown operation: ${operation}`,
          {
            itemIndex: this.itemIndex,
          },
        );
    }
  }

  // New handle methods for the converted pattern
  private async handleGetDebitors(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    this.validateRequiredParameters(requestContext);
    try {
      if (!requestContext.clientId || !requestContext.fiscalYearId) {
        throw new NodeOperationError(
          this.context.getNode(),
          "Client ID and Fiscal Year ID are required for this operation",
          {
            itemIndex: this.itemIndex,
          },
        );
      }

      const queryParams = this.buildQueryParams();
      const debitors = await datevConnectClient.accounting.getDebitors(
        this.context,
        requestContext.clientId!,
        requestContext.fiscalYearId!,
        queryParams,
      );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(debitors);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGetDebitor(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    this.validateRequiredParameters(requestContext);
    try {
      const id = this.context.getNodeParameter(
        "debitorId",
        this.itemIndex,
      ) as string;
      const queryParams = this.buildQueryParams();
      const debitor = await datevConnectClient.accounting.getDebitor(
        this.context,
        requestContext.clientId!,
        requestContext.fiscalYearId!,
        id,
        queryParams,
      );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(debitor);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleCreateDebitor(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    this.validateRequiredParameters(requestContext);
    try {
      const debitorDataRaw = this.context.getNodeParameter(
        "debitorData",
        this.itemIndex,
      );
      const debitorData = this.parseJsonParameter(
        debitorDataRaw,
        "debitorData",
      );
      if (debitorData === undefined) {
        throw new Error("debitorData is required for creating debitor");
      }

      const result = await datevConnectClient.accounting.createDebitor(
        this.context,
        requestContext.clientId!,
        requestContext.fiscalYearId!,
        debitorData as JsonValue,
      );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(result);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleUpdateDebitor(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    this.validateRequiredParameters(requestContext);
    try {
      const debitorId = this.getRequiredString("debitorId");
      const debitorDataRaw = this.context.getNodeParameter(
        "debitorData",
        this.itemIndex,
      );
      const debitorData = this.parseJsonParameter(
        debitorDataRaw,
        "debitorData",
      );
      if (debitorData === undefined) {
        throw new Error("debitorData is required for updating debitor");
      }

      const result = await datevConnectClient.accounting.updateDebitor(
        this.context,
        requestContext.clientId!,
        requestContext.fiscalYearId!,
        debitorId,
        debitorData as JsonValue,
      );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(result);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGetNextAvailableDebitor(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    this.validateRequiredParameters(requestContext);
    try {
      const queryParams = this.buildQueryParams();
      const nextAvailable =
        await datevConnectClient.accounting.getNextAvailableDebitor(
          this.context,
          requestContext.clientId!,
          requestContext.fiscalYearId!,
          queryParams,
        );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(nextAvailable);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGetCreditors(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    this.validateRequiredParameters(requestContext);
    try {
      const queryParams = this.buildQueryParams();
      const creditors = await datevConnectClient.accounting.getCreditors(
        this.context,
        requestContext.clientId!,
        requestContext.fiscalYearId!,
        queryParams,
      );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(creditors);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGetCreditor(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    this.validateRequiredParameters(requestContext);
    try {
      const creditorId = this.getRequiredString("creditorId");
      const queryParams = this.buildQueryParams();
      const creditor = await datevConnectClient.accounting.getCreditor(
        this.context,
        requestContext.clientId!,
        requestContext.fiscalYearId!,
        creditorId,
        queryParams,
      );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(creditor);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleCreateCreditor(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    this.validateRequiredParameters(requestContext);
    try {
      const creditorDataRaw = this.context.getNodeParameter(
        "creditorData",
        this.itemIndex,
      );
      const creditorData = this.parseJsonParameter(
        creditorDataRaw,
        "creditorData",
      );
      if (creditorData === undefined) {
        throw new Error("creditorData is required for creating creditor");
      }

      const result = await datevConnectClient.accounting.createCreditor(
        this.context,
        requestContext.clientId!,
        requestContext.fiscalYearId!,
        creditorData as JsonValue,
      );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(result);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleUpdateCreditor(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    this.validateRequiredParameters(requestContext);
    try {
      const creditorId = this.getRequiredString("creditorId");
      const creditorDataRaw = this.context.getNodeParameter(
        "creditorData",
        this.itemIndex,
      );
      const creditorData = this.parseJsonParameter(
        creditorDataRaw,
        "creditorData",
      );
      if (creditorData === undefined) {
        throw new Error("creditorData is required for updating creditor");
      }

      const result = await datevConnectClient.accounting.updateCreditor(
        this.context,
        requestContext.clientId!,
        requestContext.fiscalYearId!,
        creditorId,
        creditorData as JsonValue,
      );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(result);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGetNextAvailableCreditor(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    this.validateRequiredParameters(requestContext);
    try {
      const queryParams = this.buildQueryParams();
      const nextAvailable =
        await datevConnectClient.accounting.getNextAvailableCreditor(
          this.context,
          requestContext.clientId!,
          requestContext.fiscalYearId!,
          queryParams,
        );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(nextAvailable);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }
}
