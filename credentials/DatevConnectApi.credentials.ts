import type {
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class DatevConnectApi implements ICredentialType {
	name = 'datevConnectApi';

	displayName = 'DATEVconnect API';
	icon = 'file:../nodes/klardaten.svg' as Icon;
	documentationUrl = 'https://api.klardaten.com/docs/gateway';

	properties: INodeProperties[] = [
		{
			displayName: 'Host',
			name: 'host',
			type: 'string',
			default: 'https://api.klardaten.com',
			required: true,
			description: 'Base URL of the Klardaten DATEVconnect service, e.g. https://api.klardaten.com',
		},
		{
			displayName: 'Email',
			name: 'email',
			type: 'string',
			default: '',
			required: true,
			description: 'Klardaten user login',
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
			description: 'Klardaten user password',
		},
		{
			displayName: 'Client Instance ID',
			name: 'clientInstanceId',
			type: 'string',
			default: '',
			required: true,
			description: 'Klardaten client instance identifier',
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
			},
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					key: 'access_token',
					value: undefined,
					message: 'Login successful response must include a access_token.',
				},
			},
		],
	};
}
