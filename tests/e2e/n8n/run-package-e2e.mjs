import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { packPackages, readPackedJson } from "../../packaging/tarballs.mjs";
import {
  DEFAULT_N8N_VERSION,
  getCredentialScenarios,
  runCredentialScenario,
} from "./run-n8n-e2e.mjs";

const bundleName = "@klardaten/n8n-nodes-datevconnect";
const cases = [
  {
    suffix: "master-data",
    fixture: "master-data-country-codes",
    endpoint: "/datevconnect/master-data/v1/country-codes",
    response: [{ id: "DE" }],
  },
  {
    suffix: "accounting",
    fixture: "accounting-client-list",
    endpoint: "/datevconnect/accounting/v1/clients",
    response: [{ id: "mock-client" }],
  },
  {
    suffix: "document-management",
    fixture: "document-management-info",
    endpoint: "/datevconnect/dms/v2/info",
    response: { version: "2" },
  },
  {
    suffix: "order-management",
    fixture: "order-management-self-clients",
    endpoint: "/datevconnect/order-management/v1/selfclients",
    response: [{ id: "mock-self-client" }],
  },
  {
    suffix: "identity-and-access-management",
    fixture: "iam-current-user",
    endpoint: "/datevconnect/iam/v1/Users/me",
    response: { id: "mock-user" },
  },
];
const apiKey = `uk-${"x".repeat(61)}`;
const clientInstanceId = "mock-instance";
const profileId = "mock-profile";

async function main() {
  const tempRoot = await mkdtemp(
    path.join(os.tmpdir(), "datevconnect-package-e2e-"),
  );
  const responses = new Map(
    cases.map(({ endpoint, response }) => [endpoint, response]),
  );
  const hits = new Map(cases.map(({ endpoint }) => [endpoint, 0]));
  const gateway = createServer((request, response) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    if (
      request.method !== "GET" ||
      !responses.has(pathname) ||
      request.headers.authorization !== `Bearer ${apiKey}` ||
      request.headers["x-client-instance-id"] !== clientInstanceId ||
      request.headers["x-profile-id"] !== profileId
    ) {
      response
        .writeHead(400)
        .end(`Unexpected mock Gateway request: ${request.method} ${pathname}`);
      return;
    }
    hits.set(pathname, hits.get(pathname) + 1);
    response
      .writeHead(200, { "content-type": "application/json" })
      .end(JSON.stringify(responses.get(pathname)));
  });

  try {
    gateway.listen({ host: "127.0.0.1", port: 0 });
    await once(gateway, "listening");

    const config = {
      host: `http://127.0.0.1:${gateway.address().port}`,
      clientInstanceId,
      profileId,
      apiKey,
      n8nVersion: process.env.N8N_E2E_VERSION || DEFAULT_N8N_VERSION,
    };
    const [credential] = getCredentialScenarios(config);
    const tarballs = new Map(
      packPackages(tempRoot).map(({ name, tarball }) => [name, tarball]),
    );
    const workflows = new Map();

    for (const { suffix, fixture } of cases) {
      const packageName = `${bundleName}-${suffix}`;
      const tarball = tarballs.get(packageName);
      const manifest = readPackedJson(tarball, "package.json");
      const codex = readPackedJson(
        tarball,
        manifest.n8n.nodes[0].replace(/\.js$/, ".json"),
      );
      const bundled = JSON.parse(
        await readFile(
          new URL(`workflows/${fixture}.json`, import.meta.url),
          "utf8",
        ),
      );
      const standalone = structuredClone(bundled);
      standalone.name += " (standalone)";
      const node = standalone.nodes.find(({ type }) =>
        type.startsWith(`${bundleName}.`),
      );
      node.type = codex.node;
      workflows.set(suffix, { tarball, bundled, standalone });
    }

    async function checkInstallation(id, tarballPaths, fixtureWorkflows) {
      const fixtureDirectory = path.join(tempRoot, id, "workflows");
      await mkdir(fixtureDirectory, { recursive: true });
      for (const [index, workflow] of fixtureWorkflows.entries()) {
        await writeFile(
          path.join(fixtureDirectory, `${index}.json`),
          JSON.stringify(workflow),
        );
      }
      await runCredentialScenario({
        config,
        fixtureWorkflowNames: fixtureWorkflows.map(({ name }) => name),
        npmEnv: { npm_config_prefer_offline: "true" },
        scenario: { ...credential, id, label: id },
        tarballPaths,
        tempRoot,
        fixtureDirectory,
        allowMissingOrderManagement: false,
      });
    }

    for (const [suffix, { tarball, standalone }] of workflows) {
      await checkInstallation(suffix, [tarball], [standalone]);
    }

    const mixedWorkflows = [...workflows.values()].flatMap(
      ({ bundled, standalone }) => [bundled, standalone],
    );
    await checkInstallation("mixed", [...tarballs.values()], mixedWorkflows);

    for (const [endpoint, count] of hits) {
      assert.equal(
        count,
        3,
        `Expected one standalone and two mixed requests to ${endpoint}`,
      );
    }
    console.log("All standalone and mixed DATEVconnect workflows completed.");
  } finally {
    gateway.close();
    await rm(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message);
  if (error.stdout) console.error(error.stdout);
  if (error.stderr) console.error(error.stderr);
  process.exitCode = 1;
});
