import type { IExecuteFunctions, IDataObject } from "n8n-workflow";
import * as client from "./datevConnectClient";
import type { JsonValue } from "./datevConnectClient";

interface CredentialsData {
  host: string;
  email: string;
  password: string;
  clientInstanceId: string;
}

async function getAuthenticatedOptions(executeFunctions: IExecuteFunctions) {
  const credentials = await executeFunctions.getCredentials("datevConnectApi") as CredentialsData;

  // Check if we have a cached token or need to authenticate
  const authResponse = await client.authenticate({
    host: credentials.host,
    email: credentials.email,
    password: credentials.password,
  });

  return {
    host: credentials.host,
    token: authResponse.access_token,
    clientInstanceId: credentials.clientInstanceId,
  };
}

export const datevConnectClient = {
  accounting: {
    async getClients(executeFunctions: IExecuteFunctions, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);

      return client.fetchAccountingClients({
        ...options,
        ...queryParams,
      });
    },

    async getClient(executeFunctions: IExecuteFunctions, clientId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchAccountingClient({
        ...options,
        clientId,
        select: queryParams.select as string,
        expand: queryParams.expand as string,
      });
    },

    async getFiscalYears(executeFunctions: IExecuteFunctions, clientId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchFiscalYears({
        ...options,
        clientId,
        select: queryParams.select as string,
        filter: queryParams.filter as string,
        top: queryParams.top as number,
        skip: queryParams.skip as number,
      });
    },

    async getFiscalYear(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchFiscalYear({
        ...options,
        clientId,
        fiscalYearId,
        select: queryParams.select as string,
      });
    },

    async getAccountsReceivable(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchAccountsReceivable({
        ...options,
        clientId,
        fiscalYearId,
        select: queryParams.select as string,
        filter: queryParams.filter as string,
        top: queryParams.top as number,
        skip: queryParams.skip as number,
        expand: queryParams.expand as string,
      });
    },

    async getAccountsReceivableCondensed(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchAccountsReceivableCondensed({
        ...options,
        clientId,
        fiscalYearId,
        select: queryParams.select as string,
        filter: queryParams.filter as string,
        top: queryParams.top as number,
        skip: queryParams.skip as number,
      });
    },

    async getAccountReceivable(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, accountsReceivableId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchAccountReceivable({
        ...options,
        clientId,
        fiscalYearId,
        accountsReceivableId,
        select: queryParams.select as string,
        expand: queryParams.expand as string,
      });
    },

    async getAccountsPayable(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchAccountsPayable({
        ...options,
        clientId,
        fiscalYearId,
        select: queryParams.select as string,
        filter: queryParams.filter as string,
        top: queryParams.top as number,
        skip: queryParams.skip as number,
        expand: queryParams.expand as string,
      });
    },

    async getAccountsPayableCondensed(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchAccountsPayableCondensed({
        ...options,
        clientId,
        fiscalYearId,
        select: queryParams.select as string,
        filter: queryParams.filter as string,
        top: queryParams.top as number,
        skip: queryParams.skip as number,
      });
    },

    async getAccountPayable(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, accountsPayableId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchAccountPayable({
        ...options,
        clientId,
        fiscalYearId,
        accountsPayableId,
        select: queryParams.select as string,
        expand: queryParams.expand as string,
      });
    },

    async getAccountPostings(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchAccountPostings({
        ...options,
        clientId,
        fiscalYearId,
        select: queryParams.select as string,
        filter: queryParams.filter as string,
        top: queryParams.top as number,
        skip: queryParams.skip as number,
      });
    },

    async getAccountPosting(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, accountPostingId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchAccountPosting({
        ...options,
        clientId,
        fiscalYearId,
        accountPostingId,
        select: queryParams.select as string,
      });
    },

    async getAccountingSequences(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchAccountingSequences({
        ...options,
        clientId,
        fiscalYearId,
        select: queryParams.select as string,
        top: queryParams.top as number,
        skip: queryParams.skip as number,
      });
    },

    async getAccountingSequence(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, accountingSequenceId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchAccountingSequence({
        ...options,
        clientId,
        fiscalYearId,
        accountingSequenceId,
        select: queryParams.select as string,
      });
    },

    async createAccountingSequence(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, accountingSequence: JsonValue) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.createAccountingSequence({
        ...options,
        clientId,
        fiscalYearId,
        accountingSequence,
      });
    },

    async getAccountingRecords(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, accountingSequenceId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchAccountingRecords({
        ...options,
        clientId,
        fiscalYearId,
        accountingSequenceId,
        select: queryParams.select as string,
        filter: queryParams.filter as string,
        top: queryParams.top as number,
        skip: queryParams.skip as number,
      });
    },

    async getAccountingRecord(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, accountingSequenceId: string, accountingRecordId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchAccountingRecord({
        ...options,
        clientId,
        fiscalYearId,
        accountingSequenceId,
        accountingRecordId,
        select: queryParams.select as string,
      });
    },

    async getPostingProposalRulesIncoming(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchPostingProposalRulesIncoming({
        ...options,
        clientId,
        fiscalYearId,
        select: queryParams.select as string,
        top: queryParams.top as number,
        skip: queryParams.skip as number,
      });
    },

    async getPostingProposalRulesOutgoing(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchPostingProposalRulesOutgoing({
        ...options,
        clientId,
        fiscalYearId,
        select: queryParams.select as string,
        top: queryParams.top as number,
        skip: queryParams.skip as number,
      });
    },

    async getPostingProposalRulesCashRegister(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchPostingProposalRulesCashRegister({
        ...options,
        clientId,
        fiscalYearId,
        select: queryParams.select as string,
        top: queryParams.top as number,
        skip: queryParams.skip as number,
      });
    },

    async getPostingProposalRuleIncoming(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, ruleId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchPostingProposalRuleIncoming({
        ...options,
        clientId,
        fiscalYearId,
        ruleId,
        select: queryParams.select as string,
      });
    },

    async getPostingProposalRuleOutgoing(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, ruleId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchPostingProposalRuleOutgoing({
        ...options,
        clientId,
        fiscalYearId,
        ruleId,
        select: queryParams.select as string,
      });
    },

    async getPostingProposalRuleCashRegister(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, ruleId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchPostingProposalRuleCashRegister({
        ...options,
        clientId,
        fiscalYearId,
        ruleId,
        select: queryParams.select as string,
      });
    },

    async batchPostingProposalsIncoming(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, postingProposals: JsonValue) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.batchPostingProposalsIncoming({
        ...options,
        clientId,
        fiscalYearId,
        postingProposals,
      });
    },

    async batchPostingProposalsOutgoing(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, postingProposals: JsonValue) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.batchPostingProposalsOutgoing({
        ...options,
        clientId,
        fiscalYearId,
        postingProposals,
      });
    },

    async batchPostingProposalsCashRegister(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, postingProposals: JsonValue) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.batchPostingProposalsCashRegister({
        ...options,
        clientId,
        fiscalYearId,
        postingProposals,
      });
    },

    async getAccountingSumsAndBalances(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchAccountingSumsAndBalances({
        ...options,
        clientId,
        fiscalYearId,
        select: queryParams.select as string,
        filter: queryParams.filter as string,
        top: queryParams.top as number,
        skip: queryParams.skip as number,
      });
    },

    async getAccountingSumsAndBalance(
      executeFunctions: IExecuteFunctions,
      clientId: string,
      fiscalYearId: string,
      accountingSumsAndBalancesId: string,
    ) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchAccountingSumsAndBalance({
        ...options,
        clientId,
        fiscalYearId,
        accountingSumsAndBalancesId,
      });
    },

    async getDebitors(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchDebitors({
        ...options,
        clientId,
        fiscalYearId,
        select: queryParams.select as string,
        filter: queryParams.filter as string,
        top: queryParams.top as number,
        skip: queryParams.skip as number,
        expand: queryParams.expand as string,
      });
    },

    async getDebitor(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, debitorId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchDebitor({
        ...options,
        clientId,
        fiscalYearId,
        debitorId,
        select: queryParams.select as string,
        expand: queryParams.expand as string,
      });
    },

    async createDebitor(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, debitor: JsonValue) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.createDebitor({
        ...options,
        clientId,
        fiscalYearId,
        debitor,
      });
    },

    async updateDebitor(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, debitorId: string, debitor: JsonValue) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.updateDebitor({
        ...options,
        clientId,
        fiscalYearId,
        debitorId,
        debitor,
      });
    },

    async getNextAvailableDebitor(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchNextAvailableDebitor({
        ...options,
        clientId,
        fiscalYearId,
        startAt: queryParams["start-at"] as string,
      });
    },

    async getCreditors(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchCreditors({
        ...options,
        clientId,
        fiscalYearId,
        select: queryParams.select as string,
        filter: queryParams.filter as string,
        top: queryParams.top as number,
        skip: queryParams.skip as number,
        expand: queryParams.expand as string,
      });
    },

    async getCreditor(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, creditorId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchCreditor({
        ...options,
        clientId,
        fiscalYearId,
        creditorId,
        select: queryParams.select as string,
        expand: queryParams.expand as string,
      });
    },

    async createCreditor(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, creditor: JsonValue) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.createCreditor({
        ...options,
        clientId,
        fiscalYearId,
        creditor,
      });
    },

    async updateCreditor(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, creditorId: string, creditor: JsonValue) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.updateCreditor({
        ...options,
        clientId,
        fiscalYearId,
        creditorId,
        creditor,
      });
    },

    async getNextAvailableCreditor(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchNextAvailableCreditor({
        ...options,
        clientId,
        fiscalYearId,
        startAt: queryParams["start-at"] as string,
      });
    },

    async getGeneralLedgerAccounts(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchGeneralLedgerAccounts({
        ...options,
        clientId,
        fiscalYearId,
        select: queryParams.select as string,
        filter: queryParams.filter as string,
        top: queryParams.top as number,
        skip: queryParams.skip as number,
      });
    },

    async getGeneralLedgerAccount(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, generalLedgerAccountId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchGeneralLedgerAccount({
        ...options,
        clientId,
        fiscalYearId,
        generalLedgerAccountId,
        select: queryParams.select as string,
      });
    },

    async getUtilizedGeneralLedgerAccounts(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchUtilizedGeneralLedgerAccounts({
        ...options,
        clientId,
        fiscalYearId,
        select: queryParams.select as string,
        top: queryParams.top as number,
        skip: queryParams.skip as number,
      });
    },

    // Terms of Payment methods
    async getTermsOfPayment(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchTermsOfPayment({
        ...options,
        clientId,
        fiscalYearId,
        select: queryParams.select as string,
        filter: queryParams.filter as string,
        skip: queryParams.skip as number,
        top: queryParams.top as number,
      });
    },

    async getTermOfPayment(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, termOfPaymentId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchTermOfPayment({
        ...options,
        clientId,
        fiscalYearId,
        termOfPaymentId,
        select: queryParams.select as string,
      });
    },

    async createTermOfPayment(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, termOfPaymentData: JsonValue) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.createTermOfPayment({
        ...options,
        clientId,
        fiscalYearId,
        termOfPaymentData,
      });
    },

    async updateTermOfPayment(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, termOfPaymentId: string, termOfPaymentData: JsonValue) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.updateTermOfPayment({
        ...options,
        clientId,
        fiscalYearId,
        termOfPaymentId,
        termOfPaymentData,
      });
    },

    // Stocktaking Data methods
    async getStocktakingData(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchStocktakingData({
        ...options,
        clientId,
        fiscalYearId,
        filter: queryParams.filter as string,
        select: queryParams.select as string,
        skip: queryParams.skip as number,
        top: queryParams.top as number,
      });
    },

    async getStocktakingDataByAsset(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, assetId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchStocktakingDataByAsset({
        ...options,
        clientId,
        fiscalYearId,
        assetId,
        select: queryParams.select as string,
        skip: queryParams.skip as number,
        top: queryParams.top as number,
      });
    },

    async updateStocktakingData(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, assetId: string, stocktakingData: JsonValue) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.updateStocktakingData({
        ...options,
        clientId,
        fiscalYearId,
        assetId,
        stocktakingData,
      });
    },

    // Cost Systems methods
    async getCostSystems(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchCostSystems({
        ...options,
        clientId,
        fiscalYearId,
        select: queryParams.select as string,
        skip: queryParams.skip as number,
        top: queryParams.top as number,
      });
    },

    async getCostSystem(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, costSystemId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchCostSystem({
        ...options,
        clientId,
        fiscalYearId,
        costSystemId,
        select: queryParams.select as string,
      });
    },

    // Cost Centers methods
    async getCostCenters(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, costSystemId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchCostCenters({
        ...options,
        clientId,
        fiscalYearId,
        costSystemId,
        select: queryParams.select as string,
        top: queryParams.top as number,
        skip: queryParams.skip as number,
      });
    },

    async getCostCenter(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, costSystemId: string, costCenterId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchCostCenter({
        ...options,
        clientId,
        fiscalYearId,
        costSystemId,
        costCenterId,
        select: queryParams.select as string,
      });
    },

    // Cost Center Properties methods
    async getCostCenterProperties(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, costSystemId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchCostCenterProperties({
        ...options,
        clientId,
        fiscalYearId,
        costSystemId,
        select: queryParams.select as string,
        skip: queryParams.skip as number,
        top: queryParams.top as number,
      });
    },

    async getCostCenterProperty(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, costSystemId: string, costCenterPropertyId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchCostCenterProperty({
        ...options,
        clientId,
        fiscalYearId,
        costSystemId,
        costCenterPropertyId,
        select: queryParams.select as string,
      });
    },

    // Internal Cost Services methods
    async createInternalCostService(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, costSystemId: string, internalCostServiceData: JsonValue) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.createInternalCostService({
        ...options,
        clientId,
        fiscalYearId,
        costSystemId,
        internalCostServiceData,
      });
    },

    // Cost Sequences methods
    async getCostSequences(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, costSystemId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchCostSequences({
        ...options,
        clientId,
        fiscalYearId,
        costSystemId,
        select: queryParams.select as string,
        skip: queryParams.skip as number,
        top: queryParams.top as number,
      });
    },

    async getCostSequence(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, costSystemId: string, costSequenceId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchCostSequence({
        ...options,
        clientId,
        fiscalYearId,
        costSystemId,
        costSequenceId,
        select: queryParams.select as string,
      });
    },

    async createCostSequence(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, costSystemId: string, costSequenceId: string, costSequenceData: JsonValue) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.createCostSequence({
        ...options,
        clientId,
        fiscalYearId,
        costSystemId,
        costSequenceId,
        costSequenceData,
      });
    },

    async getCostAccountingRecords(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, costSystemId: string, costSequenceId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchCostAccountingRecords({
        ...options,
        clientId,
        fiscalYearId,
        costSystemId,
        costSequenceId,
        select: queryParams.select as string,
        skip: queryParams.skip as number,
        top: queryParams.top as number,
      });
    },

    // Accounting Statistics methods
    async getAccountingStatistics(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchAccountingStatistics({
        ...options,
        clientId,
        fiscalYearId,
        select: queryParams.select as string,
        filter: queryParams.filter as string,
        skip: queryParams.skip as number,
        top: queryParams.top as number,
      });
    },

    // Accounting Transaction Keys methods
    async getAccountingTransactionKeys(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchAccountingTransactionKeys({
        ...options,
        clientId,
        fiscalYearId,
        select: queryParams.select as string,
        skip: queryParams.skip as number,
        top: queryParams.top as number,
      });
    },

    async getAccountingTransactionKey(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, accountingTransactionKeyId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchAccountingTransactionKey({
        ...options,
        clientId,
        fiscalYearId,
        accountingTransactionKeyId,
        select: queryParams.select as string,
        filter: queryParams.filter as string,
        skip: queryParams.skip as number,
        top: queryParams.top as number,
      });
    },

    // Various Addresses methods
    async getVariousAddresses(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchVariousAddresses({
        ...options,
        clientId,
        fiscalYearId,
        select: queryParams.select as string,
        skip: queryParams.skip as number,
        top: queryParams.top as number,
        expand: queryParams.expand as string,
      });
    },

    async getVariousAddress(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, variousAddressId: string, queryParams: IDataObject = {}) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.fetchVariousAddress({
        ...options,
        clientId,
        fiscalYearId,
        variousAddressId,
        select: queryParams.select as string,
        skip: queryParams.skip as number,
        top: queryParams.top as number,
        expand: queryParams.expand as string,
      });
    },

    async createVariousAddress(executeFunctions: IExecuteFunctions, clientId: string, fiscalYearId: string, variousAddressData: JsonValue) {
      const options = await getAuthenticatedOptions(executeFunctions);
      return client.createVariousAddress({
        ...options,
        clientId,
        fiscalYearId,
        variousAddressData,
      });
    },
  },
};
