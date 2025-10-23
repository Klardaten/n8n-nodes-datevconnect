# n8n DATEV Connect Master Data

This repository provides custom n8n nodes for integrating with the DATEVconnect Master Data API. The nodes allow you to automate the retrieval and synchronization of master data between DATEV and other systems through n8n workflows.

## Project Overview

The project contains the following key components:

- **Credentials** – n8n credential types used to store DATEV API keys and connection details securely.
- **Nodes** – custom n8n nodes for listing and retrieving DATEV master data resources.
- **Tests** – integration-style tests that exercise the nodes against mocked responses.
- **Development tooling** – Bun-based project configuration, TypeScript sources, and testing utilities under `src/`.

## Available Nodes

| Node | Description |
| ---- | ----------- |
| `DATEVMasterData` | Fetches master data entities from DATEV using the configured credentials. |

Refer to the node descriptions inside the n8n editor for input parameters and output structure.

## Configuration

1. **Install dependencies**
   ```bash
   bun install
   ```
2. **Build TypeScript** (optional during development; n8n compiles on the fly)
   ```bash
   bun run build
   ```
3. **Link the nodes into n8n**
   - Copy or symlink the contents of the `nodes/` and `credentials/` directories into your n8n custom directory (e.g., `~/.n8n/custom/`).
   - Restart the n8n instance so it detects the new nodes.

## Required Credentials

DATEV provides separate credentials for the **sandbox** and **production** environments. You must obtain the following values from the DATEV developer portal and store them in the custom credential type inside n8n:

- `clientId`
- `clientSecret`
- `partnerId`
- `redirectUri`
- `baseUrl` (use the sandbox or production endpoint)

### Endpoints

| Environment | Base URL |
|-------------|----------|
| Sandbox     | `https://sandbox.accounts.datev.de` |
| Production  | `https://accounts.datev.de` |

Ensure that the redirect URI configured in DATEV matches the value provided in the credential.

## Running Tests

Use the Bun test runner to execute the automated tests:

```bash
bun test
```

## Usage in n8n

1. Create a new workflow in n8n.
2. Add the **DATEV Master Data** node and choose the credential you configured.
3. Select the desired operation (e.g., list master data entries) and configure any filters.
4. Execute the workflow or schedule it as part of a larger automation.

The node will authenticate using the stored credentials and interact with the DATEVconnect API to retrieve the requested master data.

## Additional Notes

- Sandbox access may require DATEV to enable the API for your partner account.
- Production access typically requires additional approval and live credentials.
- Review DATEV's API rate limits and adjust workflow scheduling accordingly.

