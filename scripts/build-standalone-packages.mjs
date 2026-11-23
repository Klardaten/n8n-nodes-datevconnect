import {
  copyFileSync,
  cpSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const commonServices = ["datevConnectClient", "shared", "httpHelpers"];
const additionalServices = {
  Accounting: ["accountingClient"],
  DocumentManagement: ["documentManagementClient"],
  IdentityAndAccessManagement: ["identityAndAccessManagementClient"],
  MasterData: [],
  OrderManagement: ["orderManagementClient"],
};

for (const workspace of readdirSync("packages")) {
  const workspacePath = path.join("packages", workspace);
  const manifest = JSON.parse(
    readFileSync(path.join(workspacePath, "package.json"), "utf8"),
  );
  const [nodeEntry] = manifest.n8n.nodes;
  const nodeClass = path.basename(nodeEntry, ".node.js");
  const nodeDirectory = path.dirname(nodeEntry);
  const targetNodeDirectory = path.join(workspacePath, nodeDirectory);
  const targetDist = path.join(workspacePath, "dist");

  rmSync(targetDist, { recursive: true, force: true });
  for (const directory of [
    nodeDirectory,
    "dist/nodes/common",
    "dist/credentials",
  ]) {
    cpSync(directory, path.join(workspacePath, directory), {
      recursive: true,
      filter: (source) => !source.endsWith(".d.ts") && !source.endsWith(".map"),
    });
  }

  copyFileSync(
    "dist/nodes/klardaten.svg",
    path.join(targetDist, "nodes", "klardaten.svg"),
  );

  const targetServices = path.join(targetDist, "src/services");
  mkdirSync(targetServices, { recursive: true });
  for (const service of [...commonServices, ...additionalServices[nodeClass]]) {
    copyFileSync(
      path.join("dist/src/services", `${service}.js`),
      path.join(targetServices, `${service}.js`),
    );
  }

  const codexFile = `${nodeClass}.node.json`;
  const codex = JSON.parse(
    readFileSync(path.join("nodes", nodeClass, codexFile), "utf8"),
  );
  const nodeName = codex.node.split(".").at(-1);
  codex.node = `${manifest.name}.${nodeName}`;
  writeFileSync(
    path.join(targetNodeDirectory, codexFile),
    JSON.stringify(codex, null, 2) + "\n",
  );
}
