# n8n DATEVConnect

This repository provides custom n8n nodes for integrating with the DATEVconnect APIs. It requires the [Klardaten DATEVconnect Gateway](https://klardaten.com/products/datevconnect-gateway) to be set up.

## Available Nodes

| Node                           | Description                                                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `Accounting`                   | Access DATEV Accounting API for clients, fiscal years, accounts receivable, account postings, and accounting sequences. |
| `MasterData`                   | Fetches master data entities from DATEV using the configured credentials.                                               |
| `Document Management`          | Access DATEV Document Management or DMS for documents, structure items, property templates.                             |
| `Identity & Access Management` | Manage SCIM-based DATEV IAM resources such as service configuration, schemas, users, and groups.                        |

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

You need a Klardaten account and an instance id (of the DATEV instance you want to access).

- `email`
- `password`
- `clientInstanceId`

## Running Tests

Use the Bun test runner to execute the automated tests:

```bash
bun test
```

## Usage in n8n

1. Create a new workflow in n8n.
2. Add the **Klardaten DATEVconnect: Master Data** or **Accounting** node and choose the credential you configured.
3. Select the desired operation (e.g., list client entries) and configure any filters.
4. Execute the workflow or schedule it as part of a larger automation.

All nodes authenticate using the stored credentials and interact with their respective DATEVconnect APIs.

## Additional Notes

DATEV provides endpoint reference details under

- [Accounting](https://developer.datev.de/en/product-detail/accounting/1.7.4/reference)
- [Client Master Data](https://developer.datev.de/en/product-detail/client-master-data/1.7.0/reference).
- [Document Management](https://developer.datev.de/en/product-detail/document-management/2.3.0/reference)
- [Identity & Access Management – User Administration](https://developer.datev.de/en/product-detail/identity-and-access-management-user-administration/1.1.2/reference)
