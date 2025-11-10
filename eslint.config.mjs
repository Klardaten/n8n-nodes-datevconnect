import { config } from "@n8n/node-cli/eslint";

const customConfig = [
  ...config,
  {
    ignores: ["tests/**/*"],
  },
];

export default customConfig;
