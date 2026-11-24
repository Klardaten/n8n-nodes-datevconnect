import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { packPackages, readPackedJson } from "./tarballs.mjs";

const bundleName = "@klardaten/n8n-nodes-datevconnect";
const credentialFile = "dist/credentials/DatevConnectApi.credentials.js";
const credentialSourcePath = "credentials/DatevConnectApi.credentials.ts";
const credentialSource = readFileSync(credentialSourcePath, "utf8");
const nodeTypes = {
  accounting: "accounting",
  "document-management": "documentManagement",
  "identity-and-access-management": "identityAndAccessManagement",
  "master-data": "masterData",
  "order-management": "orderManagement",
};

const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
assert.equal(
  lock.version,
  version,
  "The lockfile must match the bundle version",
);

const directory = mkdtempSync(path.join(os.tmpdir(), "datevconnect-tarballs-"));
try {
  const packages = packPackages(directory);
  assert.deepEqual(
    packages.map(({ name }) => name).sort(),
    [
      bundleName,
      ...Object.keys(nodeTypes).map((suffix) => `${bundleName}-${suffix}`),
    ].sort(),
  );

  for (const { name, tarball, files } of packages) {
    const manifest = readPackedJson(tarball, "package.json");
    assert.equal(manifest.name, name);
    assert.equal(
      manifest.version,
      version,
      `${name} must match the bundle version`,
    );
    const lockPath = name === bundleName ? "" : manifest.repository.directory;
    assert.equal(
      lock.packages[lockPath].version,
      version,
      `${name} must match the lockfile version`,
    );
    assert.deepEqual(manifest.n8n.credentials, [credentialFile]);
    assert.ok(files.includes(credentialFile));
    assert.ok(files.includes("dist/nodes/klardaten.svg"));
    assert.ok(files.includes("README.md"));
    assert.ok(!files.some((file) => file.startsWith("dist/packages/")));

    const { nodes } = manifest.n8n;
    assert.deepEqual(
      files.filter((file) => file.endsWith(".node.js")).sort(),
      [...nodes].sort(),
    );
    assert.ok(!files.some((file) => file.endsWith(".config.js")));

    if (name === bundleName) {
      assert.equal(nodes.length, 5);
      assert.ok(files.includes("dist/index.js"));
      assert.ok(files.includes("dist/index.d.ts"));
    } else {
      const workspaceCredentialPath = path.join(lockPath, credentialSourcePath);
      assert.equal(
        readFileSync(workspaceCredentialPath, "utf8"),
        credentialSource,
        `${workspaceCredentialPath} must match the shared credential source. Run npm run sync:standalone-credentials.`,
      );
      assert.equal(nodes.length, 1);
      assert.deepEqual(manifest.dependencies ?? {}, {});
      const codex = readPackedJson(tarball, nodes[0].replace(/\.js$/, ".json"));
      const suffix = name.slice(bundleName.length + 1);
      assert.equal(codex.node, `${name}.${nodeTypes[suffix]}`);
    }
    console.log(`Checked ${name}`);
  }
} finally {
  rmSync(directory, { recursive: true, force: true });
}
