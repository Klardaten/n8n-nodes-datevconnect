import { execFileSync } from "node:child_process";
import path from "node:path";

export function packPackages(directory) {
  const output = execFileSync(
    "npm",
    [
      "pack",
      "--json",
      "--workspaces",
      "--include-workspace-root",
      "--pack-destination",
      directory,
    ],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        npm_config_cache: path.join(directory, "npm-cache"),
      },
    },
  );
  return JSON.parse(output).map(({ name, filename, files }) => ({
    name,
    tarball: path.join(directory, filename),
    files: files.map(({ path: file }) => file),
  }));
}

export function readPackedJson(tarball, file) {
  return JSON.parse(
    execFileSync("tar", ["-xOf", tarball, `package/${file}`], {
      encoding: "utf8",
    }),
  );
}
