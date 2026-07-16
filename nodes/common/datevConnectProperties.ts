import type { INodeProperties } from "n8n-workflow";

export const datevConnectExecutionProperties: INodeProperties[] = [
  {
    displayName: "Client Instance ID",
    name: "clientInstanceId",
    type: "string",
    default: "",
    description:
      "Override the Client Instance ID from credentials. If provided, this value takes precedence over the credential value.",
  },
  {
    displayName: "Profile ID",
    name: "profileId",
    type: "string",
    default: "",
    description:
      "Optional DATEVconnect profile ID for this node execution. Overrides the credential profile ID. Leave empty to use the credential or backend default profile.",
  },
];
