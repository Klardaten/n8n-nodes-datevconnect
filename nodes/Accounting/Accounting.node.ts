import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";
import { NodeOperationError, NodeApiError } from "n8n-workflow";
import { authenticate } from "../../src/services/datevConnectClient";

import { accountingNodeDescription } from "./Accounting.config";
import type { BaseResourceHandler } from "./handlers";
import type { RequestContext } from "./types";
import {
  ClientResourceHandler,
  FiscalYearResourceHandler,
  AccountsReceivableResourceHandler,
  AccountsPayableResourceHandler,
  AccountPostingResourceHandler,
  AccountingSequenceResourceHandler,
  PostingProposalsResourceHandler,
  AccountingSumsAndBalancesResourceHandler,
  BusinessPartnersResourceHandler,
  GeneralLedgerAccountsResourceHandler,
  TermsOfPaymentResourceHandler,
  StocktakingDataResourceHandler,
  CostSystemsResourceHandler,
  CostCentersUnitsResourceHandler,
  CostCenterPropertiesResourceHandler,
  InternalCostServicesResourceHandler,
  CostSequencesResourceHandler,
  AccountingStatisticsResourceHandler,
  AccountingTransactionKeysResourceHandler,
  VariousAddressesResourceHandler,
} from "./handlers";

/**
 * DATEV Accounting node for n8n
 * 
 * This node provides access to DATEV Accounting API endpoints including:
 * - Clients management
 * - Fiscal years
 * - Accounts receivable
 * - Accounts payable
 * - Account postings
 * - Accounting sequences
 * - Posting proposals
 * - Accounting sums and balances
 * - Business partners (debitors/creditors)
 * - General ledger accounts
 * - Terms of payment
 * - Stocktaking data
 * - Cost systems
 * - Cost centers/units
 * - Cost center properties
 * - Internal cost services
 * - Cost sequences
 * - Accounting statistics
 * - Accounting transaction keys
 * - Various addresses
 */
export class Accounting implements INodeType {
  description: INodeTypeDescription = {
    ...accountingNodeDescription,
    icon: accountingNodeDescription.icon ?? "file:../klardaten.svg",
    usableAsTool: true,
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Get and validate credentials
    const credentials = (await this.getCredentials("datevConnectApi")) as
      | {
        host: string;
        email: string;
        password: string;
        clientInstanceId: string;
      }
      | null;

    if (!credentials) {
      throw new NodeOperationError(this.getNode(), "DATEVconnect credentials are missing");
    }

    const { host, email, password, clientInstanceId } = credentials;

    if (!host || !email || !password || !clientInstanceId) {
      throw new NodeOperationError(
        this.getNode(),
        "All DATEVconnect credential fields must be provided"
      );
    }

    // Authenticate once for all items
    let token: string;
    try {
      const authResponse = await authenticate({
        host,
        email,
        password,
      });
      token = authResponse.access_token;
    } catch (error) {
      throw new NodeApiError(this.getNode(), {
        message: error instanceof Error ? error.message : String(error)
      });
    }

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        // Get resource and operation from node parameters
        const resource = this.getNodeParameter("resource", itemIndex) as string;
        const operation = this.getNodeParameter("operation", itemIndex) as string;

        // Create request context with auth data and operation parameters
        const requestContext: RequestContext = { host, token, clientInstanceId };

        // Add clientId if needed (all operations except /clients getAll)
        if (!(resource === "client" && operation === "getAll")) {
          const clientId = this.getNodeParameter("clientId", itemIndex) as string;
          if (!clientId) {
            throw new NodeOperationError(
              this.getNode(),
              "clientId is required for this operation",
              { itemIndex }
            );
          }
          requestContext.clientId = clientId;
        }

        // Add fiscalYearId if needed (only for operations that require both client and fiscal year)
        // Note: fiscalYear resource needs clientId but not fiscalYearId for getAll operation
        if (resource !== "client" && !(resource === "fiscalYear" && operation === "getAll")) {
          const fiscalYearId = this.getNodeParameter("fiscalYearId", itemIndex) as string;
          if (!fiscalYearId) {
            throw new NodeOperationError(
              this.getNode(),
              "fiscalYearId is required for this operation",
              { itemIndex }
            );
          }
          requestContext.fiscalYearId = fiscalYearId;
        }

        // Get the appropriate handler for this resource
        let handler: BaseResourceHandler;
        switch (resource) {
          case "client":
            handler = new ClientResourceHandler(this, itemIndex);
            break;
          case "fiscalYear":
            handler = new FiscalYearResourceHandler(this, itemIndex);
            break;
          case "accountsReceivable":
            handler = new AccountsReceivableResourceHandler(this, itemIndex);
            break;
          case "accountsPayable":
            handler = new AccountsPayableResourceHandler(this, itemIndex);
            break;
          case "accountPosting":
            handler = new AccountPostingResourceHandler(this, itemIndex);
            break;
          case "accountingSequence":
            handler = new AccountingSequenceResourceHandler(this, itemIndex);
            break;
          case "postingProposals":
            handler = new PostingProposalsResourceHandler(this, itemIndex);
            break;
          case "accountingSumsAndBalances":
            handler = new AccountingSumsAndBalancesResourceHandler(this, itemIndex);
            break;
          case "businessPartners":
            handler = new BusinessPartnersResourceHandler(this, itemIndex);
            break;
          case "generalLedgerAccounts":
            handler = new GeneralLedgerAccountsResourceHandler(this, itemIndex);
            break;
          case "termsOfPayment":
            handler = new TermsOfPaymentResourceHandler(this, itemIndex);
            break;
          case "stocktakingData":
            handler = new StocktakingDataResourceHandler(this, itemIndex);
            break;
          case "costSystems":
            handler = new CostSystemsResourceHandler(this, itemIndex);
            break;
          case "costCentersUnits":
            handler = new CostCentersUnitsResourceHandler(this, itemIndex);
            break;
          case "costCenterProperties":
            handler = new CostCenterPropertiesResourceHandler(this, itemIndex);
            break;
          case "internalCostServices":
            handler = new InternalCostServicesResourceHandler(this, itemIndex);
            break;
          case "costSequences":
            handler = new CostSequencesResourceHandler(this, itemIndex);
            break;
          case "accountingStatistics":
            handler = new AccountingStatisticsResourceHandler(this, itemIndex);
            break;
          case "accountingTransactionKeys":
            handler = new AccountingTransactionKeysResourceHandler(this, itemIndex);
            break;
          case "variousAddresses":
            handler = new VariousAddressesResourceHandler(this, itemIndex);
            break;
          default:
            throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, {
              itemIndex,
            });
        }

        // Execute the handler and get results
        await handler.execute(operation, requestContext, returnData);

      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error instanceof Error ? error.message : "Unknown error occurred",
            },
            pairedItem: { item: itemIndex },
          });
        } else {
          throw error;
        }
      }
    }

    return [returnData];
  }
}
