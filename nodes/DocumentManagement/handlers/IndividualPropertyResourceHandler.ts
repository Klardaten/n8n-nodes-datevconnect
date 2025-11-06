import { NodeOperationError } from 'n8n-workflow';
import { DocumentManagementClient } from '../../../src/services/documentManagementClient';
import type { AuthContext, SendSuccessFunction } from '../types';
import { BaseResourceHandler } from './BaseResourceHandler';

/**
 * Handler for individual property operations
 */
export class IndividualPropertyResourceHandler extends BaseResourceHandler {
	protected async executeOperation(
		operation: string,
		authContext: AuthContext,
		sendSuccess: SendSuccessFunction,
	): Promise<void> {
		this.validateRequestContext(authContext);

		switch (operation) {
			case 'getAll':
				await this.getIndividualProperties(authContext, sendSuccess);
				break;
			default:
				throw new NodeOperationError(this.context.getNode(), `Unsupported operation: ${operation}`, {
					itemIndex: this.itemIndex,
				});
		}
	}

	private async getIndividualProperties(authContext: AuthContext, sendSuccess: SendSuccessFunction): Promise<void> {
		const response = await DocumentManagementClient.fetchIndividualProperties({
			host: authContext.host,
			token: authContext.token,
			clientInstanceId: authContext.clientInstanceId,
		});

		sendSuccess(response);
	}
}