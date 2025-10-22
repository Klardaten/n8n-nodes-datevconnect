import type {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class DatevConnectApi implements ICredentialType {
	name = 'datevConnectApi';

	displayName = 'DATEVconnect API';

	properties: INodeProperties[] = [
		{
			displayName: 'Host',
			name: 'host',
			type: 'string',
			default: '',
			required: true,
			description: 'Base URL of the DATEVconnect service, e.g. https://example.datev.de',
		},
		{
			displayName: 'Email',
			name: 'email',
			type: 'string',
			default: '',
			required: true,
			description: 'Account email for DATEVconnect login',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			default: '',
			required: true,
			typeOptions: {
				password: true,
			},
			description: 'Account password for DATEVconnect login',
		},
		{
			displayName: 'Client Instance ID',
			name: 'clientInstanceId',
			type: 'string',
			default: '',
			required: true,
			description: 'DATEV client instance identifier used for authentication',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ $credentials.host }}',
			url: '/api/auth/login',
			method: 'POST',
			json: true,
			body: {
				email: '={{ $credentials.email }}',
				password: '={{ $credentials.password }}',
				clientInstanceId: '={{ $credentials.clientInstanceId }}',
			},
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					key: 'token',
					value: undefined,
					message: 'Login successful response must include a token.',
				},
			},
		],
	};
}
