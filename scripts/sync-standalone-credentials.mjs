import { copyFileSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

const credential = "credentials/DatevConnectApi.credentials.ts";

for (const workspace of readdirSync("packages")) {
  const target = path.join("packages", workspace, credential);
  mkdirSync(path.dirname(target), { recursive: true });
  copyFileSync(credential, target);
}
