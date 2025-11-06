import { NodeOperationError } from 'n8n-workflow';
import { DocumentManagementClient } from '../../../src/services/documentManagementClient';
import type { AuthContext, SendSuccessFunction } from '../types';
import { BaseResourceHandler } from './BaseResourceHandler';

/**
 * Handler for individual references 1 operations
 */
export class IndividualReference1ResourceHandler extends BaseResourceHandler {
	protected async executeOperation(
		operation: string,
		authContext: AuthContext,
		sendSuccess: SendSuccessFunction,
	): Promise<void> {
		this.validateRequestContext(authContext);

		switch (operation) {
			case 'getAll':
				await this.getIndividualReferences1(authContext, sendSuccess);
				break;
			case 'create':
				await this.createIndividualReference1(authContext, sendSuccess);
				break;
			default:
				throw new NodeOperationError(this.context.getNode(), `Unsupported operation: ${operation}`, {
					itemIndex: this.itemIndex,
				});
		}
	}

	private async getIndividualReferences1(authContext: AuthContext, sendSuccess: SendSuccessFunction): Promise<void> {
		const top = this.getNumberParameter('top', 0);
		const skip = this.getNumberParameter('skip', 0);

		const response = await DocumentManagementClient.fetchIndividualReferences1({
			host: authContext.host,
			token: authContext.token,
			clientInstanceId: authContext.clientInstanceId,
			top: top || undefined,
			skip: skip || undefined,
		});

		sendSuccess(response);
	}

	private async createIndividualReference1(authContext: AuthContext, sendSuccess: SendSuccessFunction): Promise<void> {
		const individualReferenceData = this.getRequiredJsonData('individualReferenceData');

		const response = await DocumentManagementClient.createIndividualReference1({
			host: authContext.host,
			token: authContext.token,
			clientInstanceId: authContext.clientInstanceId,
			individualReference: individualReferenceData,
		});

		sendSuccess(response);
	}
}