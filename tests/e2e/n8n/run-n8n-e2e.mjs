#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const workflowsDir = path.join(repoRoot, "tests/e2e/n8n/workflows");

const DEFAULT_N8N_VERSION = "2.30.6";
const DEFAULT_DATEV_HOST = "https://api.klardaten-sandbox.com";
const CREDENTIAL_ID = "d4b2b595-7b23-4f4a-87d8-6ca1d06022df";
const CREDENTIAL_NAME = "DATEVconnect E2E";
const ENCRYPTION_KEY = "datevconnect-e2e-local-encryption-key";
const ORDER_MANAGEMENT_SELF_CLIENTS_WORKFLOW =
  "E2E DATEV Order Management self clients";
const ORDER_MANAGEMENT_MISSING_PLUGIN_MARKERS = [
  "DATEV Order Management request failed (404 Not Found)",
  "order-management",
  "Version 'v1'",
  "geladenen PlugIns",
];

const DATEV_NODE_TYPES = [
  "@klardaten/n8n-nodes-datevconnect.masterData",
  "@klardaten/n8n-nodes-datevconnect.accounting",
  "@klardaten/n8n-nodes-datevconnect.documentManagement",
  "@klardaten/n8n-nodes-datevconnect.identityAndAccessManagement",
  "@klardaten/n8n-nodes-datevconnect.orderManagement",
];

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return undefined;
  }

  const withoutExport = trimmed.startsWith("export ")
    ? trimmed.slice("export ".length).trim()
    : trimmed;
  const equalsIndex = withoutExport.indexOf("=");
  if (equalsIndex === -1) {
    return undefined;
  }

  const key = withoutExport.slice(0, equalsIndex).trim();
  let value = withoutExport.slice(equalsIndex + 1).trim();

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
    return undefined;
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

async function loadDotenvIfPresent(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = await readFile(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (parsed && process.env[parsed.key] === undefined) {
      process.env[parsed.key] = parsed.value;
    }
  }
}

function readRequiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function readOptionalEnv(name) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readConfig() {
  const apiKey = readOptionalEnv("DATEV_E2E_API_KEY");
  const email = readOptionalEnv("DATEV_E2E_EMAIL");
  const password = readOptionalEnv("DATEV_E2E_PASSWORD");

  if (!apiKey && (!email || !password)) {
    throw new Error(
      "Provide DATEV_E2E_API_KEY or both DATEV_E2E_EMAIL and DATEV_E2E_PASSWORD.",
    );
  }

  return {
    host: readOptionalEnv("DATEV_E2E_HOST") ?? DEFAULT_DATEV_HOST,
    clientInstanceId: readRequiredEnv("DATEV_E2E_CLIENT_INSTANCE_ID"),
    profileId: readRequiredEnv("DATEV_E2E_PROFILE_ID"),
    apiKey,
    email,
    password,
    n8nVersion: readOptionalEnv("N8N_E2E_VERSION") ?? DEFAULT_N8N_VERSION,
  };
}

export function getCredentialScenarios(config) {
  const scenarios = [];

  if (config.apiKey) {
    scenarios.push({
      id: "api-key",
      label: "API key",
      data: {
        host: config.host,
        email: "",
        password: "",
        apiKey: config.apiKey,
        clientInstanceId: config.clientInstanceId,
        profileId: config.profileId,
      },
    });
  }

  if (config.email && config.password) {
    scenarios.push({
      id: "email-password",
      label: "email/password",
      data: {
        host: config.host,
        email: config.email,
        password: config.password,
        apiKey: "",
        clientInstanceId: config.clientInstanceId,
        profileId: config.profileId,
      },
    });
  }

  if (scenarios.length === 0) {
    throw new Error(
      "Provide DATEV_E2E_API_KEY or both DATEV_E2E_EMAIL and DATEV_E2E_PASSWORD.",
    );
  }

  return scenarios;
}

function buildCredential(scenario) {
  const timestamp = new Date().toISOString();

  return [
    {
      id: CREDENTIAL_ID,
      name: CREDENTIAL_NAME,
      type: "datevConnectApi",
      data: scenario.data,
      nodesAccess: DATEV_NODE_TYPES.map((nodeType) => ({
        nodeType,
        date: timestamp,
      })),
    },
  ];
}

function run(command, args, options = {}) {
  const {
    cwd = repoRoot,
    env = {},
    capture = false,
    printCommand = true,
  } = options;

  if (printCommand) {
    console.log(`$ ${[command, ...args].join(" ")}`);
  }

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });

    const stdoutChunks = [];
    const stderrChunks = [];

    if (capture) {
      child.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
      child.stderr.on("data", (chunk) => stderrChunks.push(chunk));
    }

    child.on("error", reject);
    child.on("close", (code, signal) => {
      const stdout = Buffer.concat(stdoutChunks).toString("utf8");
      const stderr = Buffer.concat(stderrChunks).toString("utf8");

      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const suffix = signal ? ` (signal: ${signal})` : "";
      const error = new Error(
        `${command} ${args.join(" ")} exited with code ${code}${suffix}`,
      );
      error.stdout = stdout;
      error.stderr = stderr;
      reject(error);
    });
  });
}

async function packPackage(tempDir, npmEnv) {
  const { stdout } = await run(
    "npm",
    ["pack", "--json", "--pack-destination", tempDir],
    { capture: true, env: npmEnv },
  );
  const packResult = JSON.parse(stdout);
  const filename = packResult?.[0]?.filename;

  if (!filename) {
    throw new Error("npm pack did not return a tarball filename.");
  }

  return path.join(tempDir, filename);
}

async function readFixtureWorkflowNames() {
  const fileNames = (await readdir(workflowsDir))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();

  const names = [];
  for (const fileName of fileNames) {
    const raw = await readFile(path.join(workflowsDir, fileName), "utf8");
    const workflow = JSON.parse(raw);
    if (!workflow.name) {
      throw new Error(`${fileName} is missing a workflow name.`);
    }
    names.push(workflow.name);
  }

  return names;
}

function createN8nEnv(tempHome) {
  return {
    HOME: tempHome,
    N8N_USER_FOLDER: tempHome,
    N8N_ENCRYPTION_KEY: ENCRYPTION_KEY,
    N8N_COMMUNITY_PACKAGES_ENABLED: "true",
    N8N_COMMUNITY_PACKAGES_PREVENT_LOADING: "false",
    N8N_UNVERIFIED_PACKAGES_ENABLED: "true",
    N8N_PYTHON_ENABLED: "false",
    N8N_DIAGNOSTICS_ENABLED: "false",
    N8N_VERSION_NOTIFICATIONS_ENABLED: "false",
    N8N_TEMPLATES_ENABLED: "false",
    N8N_PERSONALIZATION_ENABLED: "false",
    N8N_HIRING_BANNER_ENABLED: "false",
    N8N_LOG_LEVEL: "warn",
    N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: "false",
    DB_SQLITE_POOL_SIZE: "1",
  };
}

function createN8nRunner(config, n8nEnv) {
  return (args, options = {}) =>
    run("npx", ["-y", `n8n@${config.n8nVersion}`, ...args], {
      env: n8nEnv,
      ...options,
    });
}

function commandOutput(error) {
  return [error.message, error.stdout, error.stderr].filter(Boolean).join("\n");
}

export function isAcceptedWorkflowFailure(workflowName, error) {
  if (workflowName !== ORDER_MANAGEMENT_SELF_CLIENTS_WORKFLOW) {
    return false;
  }

  const output = commandOutput(error);
  return ORDER_MANAGEMENT_MISSING_PLUGIN_MARKERS.every((marker) =>
    output.includes(marker),
  );
}

async function executeWorkflow(n8n, workflowName, workflowId) {
  try {
    await n8n(["execute", "--id", workflowId], { capture: true });
  } catch (error) {
    if (isAcceptedWorkflowFailure(workflowName, error)) {
      console.log(
        `Accepted expected sandbox response for workflow: ${workflowName}`,
      );
      return;
    }

    throw error;
  }
}

async function runCredentialScenario({
  config,
  fixtureWorkflowNames,
  npmEnv,
  scenario,
  tarballPath,
  tempRoot,
}) {
  const scenarioDir = path.join(tempRoot, scenario.id);
  const tempHome = path.join(scenarioDir, "home");
  const n8nUserFolder = path.join(tempHome, ".n8n");
  const communityNodesDir = path.join(n8nUserFolder, "nodes");
  const credentialsFile = path.join(scenarioDir, "datev-credentials.json");
  const exportedWorkflowsFile = path.join(scenarioDir, "workflows-export.json");
  const n8nEnv = createN8nEnv(tempHome);
  const n8n = createN8nRunner(config, n8nEnv);

  console.log(`Running credential scenario: ${scenario.label}`);
  await mkdir(scenarioDir, { recursive: true });
  await mkdir(communityNodesDir, { recursive: true });
  await writeFile(
    credentialsFile,
    JSON.stringify(buildCredential(scenario), null, 2),
    "utf8",
  );

  await run(
    "npm",
    [
      "install",
      "--omit=dev",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      tarballPath,
    ],
    { cwd: communityNodesDir, env: npmEnv },
  );

  await n8n(["import:credentials", "--input", credentialsFile]);
  await n8n(["import:workflow", "--separate", "--input", workflowsDir]);
  await n8n(["export:workflow", "--all", "--output", exportedWorkflowsFile]);

  const exportedWorkflows = JSON.parse(
    await readFile(exportedWorkflowsFile, "utf8"),
  );
  const workflowsByName = new Map(
    exportedWorkflows.map((workflow) => [workflow.name, workflow]),
  );

  for (const workflowName of fixtureWorkflowNames) {
    const workflow = workflowsByName.get(workflowName);
    if (!workflow?.id) {
      throw new Error(`Imported workflow not found: ${workflowName}`);
    }

    console.log(`Executing workflow: ${workflowName}`);
    await executeWorkflow(n8n, workflowName, workflow.id);
  }
}

async function main() {
  await loadDotenvIfPresent(path.join(repoRoot, ".env.e2e"));
  const config = readConfig();
  const credentialScenarios = getCredentialScenarios(config);
  const fixtureWorkflowNames = await readFixtureWorkflowNames();

  const tempRoot = await mkdtemp(
    path.join(os.tmpdir(), "datevconnect-n8n-e2e-"),
  );
  const npmEnv = { npm_config_cache: path.join(tempRoot, "npm-cache") };

  try {
    console.log(`Using n8n ${config.n8nVersion}`);
    console.log(`Using DATEV E2E host ${config.host}`);
    console.log(
      `Using credential scenarios: ${credentialScenarios
        .map((scenario) => scenario.label)
        .join(", ")}`,
    );

    await run("npm", ["run", "build"]);
    const tarballPath = await packPackage(tempRoot, npmEnv);

    for (const scenario of credentialScenarios) {
      await runCredentialScenario({
        config,
        fixtureWorkflowNames,
        npmEnv,
        scenario,
        tarballPath,
        tempRoot,
      });
    }

    console.log("n8n E2E workflows completed successfully.");
  } finally {
    if (process.env.N8N_E2E_KEEP_TEMP !== "true") {
      await rm(tempRoot, { recursive: true, force: true });
    } else {
      console.log(`Kept E2E temp directory: ${tempRoot}`);
    }
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error.message);
    if (error.stdout) {
      console.error(error.stdout);
    }
    if (error.stderr) {
      console.error(error.stderr);
    }
    process.exitCode = 1;
  });
}
