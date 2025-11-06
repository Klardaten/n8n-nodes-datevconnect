import { NodeOperationError } from 'n8n-workflow';
import { DocumentManagementClient } from '../../../src/services/documentManagementClient';
import type { AuthContext, SendSuccessFunction } from '../types';
import { BaseResourceHandler } from './BaseResourceHandler';

/**
 * Handler for property template operations
 */
export class PropertyTemplateResourceHandler extends BaseResourceHandler {
	protected async executeOperation(
		operation: string,
		authContext: AuthContext,
		sendSuccess: SendSuccessFunction,
	): Promise<void> {
		this.validateRequestContext(authContext);

		switch (operation) {
			case 'getAll':
				await this.getPropertyTemplates(authContext, sendSuccess);
				break;
			default:
				throw new NodeOperationError(this.context.getNode(), `Unsupported operation: ${operation}`, {
					itemIndex: this.itemIndex,
				});
		}
	}

	private async getPropertyTemplates(authContext: AuthContext, sendSuccess: SendSuccessFunction): Promise<void> {
		const filter = this.getOptionalString('filter');

		const response = await DocumentManagementClient.fetchPropertyTemplates({
			host: authContext.host,
			token: authContext.token,
			clientInstanceId: authContext.clientInstanceId,
			filter,
		});

		sendSuccess(response);
	}
}