import { NodeOperationError, type INodeExecutionData } from "n8n-workflow";
import {
  type JsonValue,
  fetchCorporateStructures,
  fetchCorporateStructure,
  fetchEstablishment,
} from "../../../src/services/datevConnectClient";
import type { AuthContext, CorporateStructureOperation } from "../types";
import { BaseResourceHandler } from "./BaseResourceHandler";

/**
 * Handler for all corporate structure-related operations
 */
export class CorporateStructureResourceHandler extends BaseResourceHandler {
  async execute(
    operation: string,
    authContext: AuthContext,
    returnData: INodeExecutionData[],
  ): Promise<void> {
    const sendSuccess = this.createSendSuccess(returnData);

    try {
      let response: JsonValue | undefined;

      switch (operation as CorporateStructureOperation) {
        case "getAll":
          response = await this.handleGetAll(authContext);
          break;
        case "get":
          response = await this.handleGet(authContext);
          break;
        case "getEstablishment":
          response = await this.handleGetEstablishment(authContext);
          break;
        default:
          throw new NodeOperationError(
            this.context.getNode(),
            `The operation "${operation}" is not supported for resource "corporateStructure".`,
            { itemIndex: this.itemIndex },
          );
      }

      sendSuccess(response);
    } catch (error) {
      this.handleError(error, returnData);
    }
  }

  private async handleGetAll(authContext: AuthContext): Promise<JsonValue> {
    const top = this.getNumberParameter("top", 100);
    const skip = this.getNumberParameter("skip", 0);
    const select = this.getOptionalString("select");
    const filter = this.getOptionalString("filter");

    return await fetchCorporateStructures({
      ...authContext,
      top,
      skip,
      select,
      filter,
    });
  }

  private async handleGet(authContext: AuthContext): Promise<JsonValue> {
    const organizationId = this.getRequiredString("organizationId");
    const select = this.getOptionalString("select");

    return await fetchCorporateStructure({
      ...authContext,
      organizationId,
      select,
    });
  }

  private async handleGetEstablishment(
    authContext: AuthContext,
  ): Promise<JsonValue> {
    const organizationId = this.getRequiredString("organizationId");
    const establishmentId = this.getRequiredString("establishmentId");
    const select = this.getOptionalString("select");

    return await fetchEstablishment({
      ...authContext,
      organizationId,
      establishmentId,
      select,
    });
  }
}
