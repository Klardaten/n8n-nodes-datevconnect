# n8n DATEVConnect

This repository provides custom n8n nodes for integrating with the DATEVconnect APIs. It requires the [Klardaten DATEVconnect Gateway](https://klardaten.com/products/datevconnect-gateway) to be set up.

## Available Nodes

| Node                           | Description                                                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `Accounting`                   | Access DATEV Accounting API for clients, fiscal years, accounts receivable, account postings, and accounting sequences. |
| `MasterData`                   | Fetches master data entities from DATEV using the configured credentials.                                               |
| `Document Management`          | Access DATEV Document Management or DMS for documents, structure items, property templates.                             |
| `Order Management`             | Read and manage orders, suborders, invoices, fees, and related employee data.                                           |
| `Identity & Access Management` | Manage SCIM-based DATEV IAM resources such as service configuration, schemas, users, and groups.                        |

Refer to the node descriptions inside the n8n editor for input parameters and output structure.

## Installation

### Through the n8n UI

1. Navigate to **Settings → Community Nodes → Install** inside your n8n instance.
2. Enter `@klardaten/n8n-nodes-datevconnect` as the package name.
3. Confirm the warning prompt and restart n8n so the nodes are registered.

### Manual (filesystem) installation

```bash
cd ~/.n8n
npm install @klardaten/n8n-nodes-datevconnect
```

Copy or symlink the contents of the installed `node_modules/@klardaten/n8n-nodes-datevconnect/dist/{nodes,credentials}` directories into your `~/.n8n/custom/` folder if you prefer the legacy custom-nodes workflow, then restart n8n.

## Development

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Build** (optional during development; n8n compiles on the fly)
   ```bash
   npm run dev
   ```

## Required Credentials

You need a Klardaten account and an instance id (of the DATEV instance you want to access).

- `email`
- `password`
- `clientInstanceId`
- `profileId` (optional)

## Running Tests

Use the npm test runner to execute the automated tests:

```bash
npm test
```

## Releasing

Releases are prepared locally and published to npm from GitHub Actions with npm provenance.
Do not run `npm publish` locally.

1. Ensure the npm Trusted Publisher for `@klardaten/n8n-nodes-datevconnect` points to the `Klardaten/n8n-nodes-datevconnect` repository and the `publish.yml` workflow.
2. Start from an up-to-date `main` branch.
   ```bash
   git switch main
   git pull
   ```
3. Run the release command and follow the prompts.
   ```bash
   npm run release
   ```

The local release command updates the version and changelog, creates the release commit and tag, pushes them, and creates the GitHub release. It does not publish to npm locally. The pushed version tag triggers the `Publish` workflow, which publishes the tagged package version to npm with the `latest` dist-tag and provenance.

## Usage in n8n

1. Create a new workflow in n8n.
2. Add the **Klardaten DATEVconnect: Master Data** or **Accounting** etc. node and choose the credential you configured.
3. Select the desired operation (e.g., list client entries) and configure any filters.
4. Execute the workflow or schedule it as part of a larger automation.

All nodes authenticate using the stored credentials and interact with their respective DATEVconnect APIs.

### Profile Selection

DATEVconnect profiles are managed in Klardaten. You can optionally set a Profile ID on the credential to use it as the default for all nodes using that credential. Each node also has an optional Profile ID field; if set, the node value overrides the credential value for that execution.

If no Profile ID is configured, Klardaten resolves the default profile for the user and client instance. The effective fallback order is: node Profile ID -> credential Profile ID -> Klardaten backend default profile.

## Additional Notes

DATEV provides endpoint reference details under

- [Accounting](https://developer.datev.de/en/product-detail/accounting/1.7.4/reference)
- [Client Master Data](https://developer.datev.de/en/product-detail/client-master-data/1.7.0/reference).
- [Document Management](https://developer.datev.de/en/product-detail/document-management/2.3.0/reference)
- [Order Management](https://developer.datev.de/en/product-detail/order-management/1.4.7/reference)
- [Identity & Access Management – User Administration](https://developer.datev.de/en/product-detail/identity-and-access-management-user-administration/1.1.2/reference)
