import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import type { JsonValue } from "../../../src/services/datevConnectClient";
import { datevConnectClient } from "../../../src/services/accountingClient";
import type { RequestContext, PostingProposalOperation } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

/**
 * Handler for Posting Proposals operations
 * Manages posting proposal rules and batch operations for invoices and cash register data
 */
export class PostingProposalsResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    requestContext: RequestContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      let response: JsonValue | undefined;

      switch (operation as PostingProposalOperation) {
        case "getRulesIncoming":
          response = await this.handleGetRulesIncoming(requestContext);
          break;
        case "getRulesOutgoing":
          response = await this.handleGetRulesOutgoing(requestContext);
          break;
        case "getRulesCashRegister":
          response = await this.handleGetRulesCashRegister(requestContext);
          break;
        case "getRuleIncoming":
          response = await this.handleGetRuleIncoming(requestContext);
          break;
        case "getRuleOutgoing":
          response = await this.handleGetRuleOutgoing(requestContext);
          break;
        case "getRuleCashRegister":
          response = await this.handleGetRuleCashRegister(requestContext);
          break;
        case "batchIncoming":
          response = await this.handleBatchIncoming(requestContext);
          break;
        case "batchOutgoing":
          response = await this.handleBatchOutgoing(requestContext);
          break;
        case "batchCashRegister":
          response = await this.handleBatchCashRegister(requestContext);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for resource "postingProposals".`,
            { itemIndex: this.itemIndex },
          );
      }

      sendSuccess(response);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  // New handle methods for the converted pattern

  // New handle methods for the converted pattern
  private async handleGetRulesIncoming(
    requestContext: RequestContext,
  ): Promise<JsonValue> {
    const queryParams = this.buildQueryParams();
    return await datevConnectClient.accounting.getPostingProposalRulesIncoming(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      queryParams,
    );
  }

  private async handleGetRulesOutgoing(
    requestContext: RequestContext,
  ): Promise<JsonValue> {
    const queryParams = this.buildQueryParams();
    return await datevConnectClient.accounting.getPostingProposalRulesOutgoing(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      queryParams,
    );
  }

  private async handleGetRulesCashRegister(
    requestContext: RequestContext,
  ): Promise<JsonValue> {
    const queryParams = this.buildQueryParams();
    return await datevConnectClient.accounting.getPostingProposalRulesCashRegister(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      queryParams,
    );
  }

  private async handleGetRuleIncoming(
    requestContext: RequestContext,
  ): Promise<JsonValue> {
    const ruleId = this.getRequiredString("ruleId");
    const queryParams = this.buildQueryParams();
    return await datevConnectClient.accounting.getPostingProposalRuleIncoming(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      ruleId,
      queryParams,
    );
  }

  private async handleGetRuleOutgoing(
    requestContext: RequestContext,
  ): Promise<JsonValue> {
    const ruleId = this.getRequiredString("ruleId");
    const queryParams = this.buildQueryParams();
    return await datevConnectClient.accounting.getPostingProposalRuleOutgoing(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      ruleId,
      queryParams,
    );
  }

  private async handleGetRuleCashRegister(
    requestContext: RequestContext,
  ): Promise<JsonValue> {
    const ruleId = this.getRequiredString("ruleId");
    const queryParams = this.buildQueryParams();
    return await datevConnectClient.accounting.getPostingProposalRuleCashRegister(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      ruleId,
      queryParams,
    );
  }

  private async handleBatchIncoming(
    requestContext: RequestContext,
  ): Promise<JsonValue | undefined> {
    const batchDataRaw = this.context.getNodeParameter(
      "batchData",
      this.itemIndex,
    );
    const batchData: JsonValue = this.parseJsonParameter(
      batchDataRaw,
      "batchData",
    );
    return await datevConnectClient.accounting.batchPostingProposalsIncoming(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      batchData,
    );
  }

  private async handleBatchOutgoing(
    requestContext: RequestContext,
  ): Promise<JsonValue | undefined> {
    const batchDataRaw = this.context.getNodeParameter(
      "batchData",
      this.itemIndex,
    );
    const batchData: JsonValue = this.parseJsonParameter(
      batchDataRaw,
      "batchData",
    );
    return await datevConnectClient.accounting.batchPostingProposalsOutgoing(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      batchData,
    );
  }

  private async handleBatchCashRegister(
    requestContext: RequestContext,
  ): Promise<JsonValue | undefined> {
    const batchDataRaw = this.context.getNodeParameter(
      "batchData",
      this.itemIndex,
    );
    const batchData: JsonValue = this.parseJsonParameter(
      batchDataRaw,
      "batchData",
    );
    return await datevConnectClient.accounting.batchPostingProposalsCashRegister(
      this.context,
      requestContext.clientId!,
      requestContext.fiscalYearId!,
      batchData,
    );
  }
}
