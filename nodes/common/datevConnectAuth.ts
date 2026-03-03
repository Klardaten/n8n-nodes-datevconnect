import {
  NodeApiError,
  NodeOperationError,
  type IExecuteFunctions,
} from "n8n-workflow";
import {
  getDatevConnectAuthContext,
  type DatevConnectAuthContext,
} from "../../src/services/datevConnectClient";

export type { DatevConnectAuthContext };

export interface DatevConnectCredentials {
  host: string;
  email?: string;
  password?: string;
  apiKey?: string;
  clientInstanceId: string;
}

const CREDENTIAL_TYPE = "datevConnectApi";

/**
 * Loads datevConnectApi credentials from the execution context, validates them,
 * resolves the token (API key or email/password login), and returns the auth context.
 * Throws NodeOperationError for missing/invalid credentials, NodeApiError for auth failures.
 *
 * Usage in a node: const auth = await getDatevConnectAuthContextForNode(this);
 */
export async function getDatevConnectAuthContextForNode(
  context: IExecuteFunctions,
): Promise<DatevConnectAuthContext> {
  const credentials = (await context.getCredentials(CREDENTIAL_TYPE)) as Record<
    string,
    unknown
  > | null;
  try {
    return await getDatevConnectAuthContext(credentials, {
      httpHelper: context.helpers.httpRequest,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("DATEVconnect credentials are missing") ||
      message.includes("Provide either")
    ) {
      throw new NodeOperationError(context.getNode(), message);
    }
    throw new NodeApiError(context.getNode(), { message });
  }
}
