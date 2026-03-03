import type {
  Icon,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from "n8n-workflow";

export class DatevConnectApi implements ICredentialType {
  name = "datevConnectApi";

  displayName = "DATEVconnect API";
  icon = "file:../nodes/klardaten.svg" as Icon;
  documentationUrl = "https://api.klardaten.com/docs/gateway";

  properties: INodeProperties[] = [
    {
      displayName: "Host",
      name: "host",
      type: "string",
      default: "https://api.klardaten.com",
      required: true,
      description:
        "Base URL of the Klardaten DATEVconnect service, e.g. https://api.klardaten.com",
    },
    {
      displayName: "Email",
      name: "email",
      type: "string",
      default: "",
      required: false,
      description: "Klardaten user login",
    },
    {
      displayName: "Password",
      name: "password",
      type: "string",
      default: "",
      required: false,
      typeOptions: {
        password: true,
      },
      description: "Klardaten user password",
    },
    {
      displayName: "User API Key",
      name: "apiKey",
      type: "string",
      default: "",
      required: false,
      typeOptions: {
        password: true,
      },
      description:
        "User API key (uk-...). If set, email and password are not required.",
    },
    {
      displayName: "Client Instance ID",
      name: "clientInstanceId",
      type: "string",
      default: "",
      required: true,
      description: "Klardaten client instance identifier",
    },
  ];

  test: ICredentialTestRequest = {
    request: {
      baseURL: "={{ $credentials.host }}",
      url: "={{ ($credentials.apiKey && String($credentials.apiKey).trim()) ? '/api/users/me' : '/api/auth/login' }}",
      method:
        "={{ ($credentials.apiKey && String($credentials.apiKey).trim()) ? 'GET' : 'POST' }}" as import("n8n-workflow").IHttpRequestMethods,
      headers:
        "={{ ($credentials.apiKey && String($credentials.apiKey).trim()) ? { Authorization: 'Bearer ' + String($credentials.apiKey).trim() } : {} }}" as unknown as import("n8n-workflow").IDataObject,
      json: true,
      body: "={{ ($credentials.apiKey && String($credentials.apiKey).trim()) ? undefined : { email: $credentials.email, password: $credentials.password } }}",
    },
    rules: [
      {
        type: "responseCode",
        properties: {
          value: 200,
          message: "Request must return 200 OK.",
        },
      },
    ],
  };
}
