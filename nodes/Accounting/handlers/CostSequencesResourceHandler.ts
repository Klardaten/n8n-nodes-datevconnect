import type { IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import type { RequestContext } from "../types";
import { NodeOperationError } from "n8n-workflow";
import { BaseResourceHandler } from "./BaseResourceHandler";
import { datevConnectClient } from "../../../src/services/accountingClient";

type CostSequencesOperation =
  | "getAll"
  | "get"
  | "create"
  | "getCostAccountingRecords";

/**
 * Handler for Cost Sequences operations
 * Manages operations related to cost accounting sequences
 */
export class CostSequencesResourceHandler extends BaseResourceHandler {
  constructor(context: IExecuteFunctions, itemIndex: number) {
    super(context, itemIndex);
  }

  async execute(
    operation: CostSequencesOperation,
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    switch (operation) {
      case "getAll":
        await this.handleGetAll(requestContext, returnData);
        break;
      case "get":
        await this.handleGet(requestContext, returnData);
        break;
      case "create":
        await this.handleCreate(requestContext, returnData);
        break;
      case "getCostAccountingRecords":
        await this.handleGetCostAccountingRecords(requestContext, returnData);
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

  private async handleGetAll(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    try {
      const costSystemId = this.getRequiredString("costSystemId");
      const queryParams = this.buildQueryParams();
      const costSequences =
        await datevConnectClient.accounting.getCostSequences(
          this.context,
          requestContext.clientId!,
          requestContext.fiscalYearId!,
          costSystemId,
          queryParams,
        );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(costSequences);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGet(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    try {
      const costSystemId = this.getRequiredString("costSystemId");
      const costSequenceId = this.getRequiredString("costSequenceId");
      const queryParams = this.buildQueryParams();
      const costSequence = await datevConnectClient.accounting.getCostSequence(
        this.context,
        requestContext.clientId!,
        requestContext.fiscalYearId!,
        costSystemId,
        costSequenceId,
        queryParams,
      );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(costSequence);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleCreate(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    try {
      const costSystemId = this.getRequiredString("costSystemId");
      const costSequenceId = this.getRequiredString("costSequenceId");
      const costSequenceDataRaw = this.context.getNodeParameter(
        "costSequenceData",
        this.itemIndex,
      );
      const costSequenceData = this.parseJsonParameter(
        costSequenceDataRaw,
        "costSequenceData",
      );

      const result = await datevConnectClient.accounting.createCostSequence(
        this.context,
        requestContext.clientId!,
        requestContext.fiscalYearId!,
        costSystemId,
        costSequenceId,
        costSequenceData,
      );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(result);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGetCostAccountingRecords(
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    try {
      const costSystemId = this.getRequiredString("costSystemId");
      const costSequenceId = this.getRequiredString("costSequenceId");
      const queryParams = this.buildQueryParams();
      const costAccountingRecords =
        await datevConnectClient.accounting.getCostAccountingRecords(
          this.context,
          requestContext.clientId!,
          requestContext.fiscalYearId!,
          costSystemId,
          costSequenceId,
          queryParams,
        );

      const sendSuccess = this.createSendSuccess(returnData);
      sendSuccess(costAccountingRecords);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }
}
