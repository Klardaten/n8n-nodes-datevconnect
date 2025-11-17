const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const nodesRoot = path.join(repoRoot, "nodes");
const distNodesRoot = path.join(repoRoot, "dist", "nodes");

function copyCodexFiles() {
  if (!fs.existsSync(nodesRoot)) {
    return;
  }

  fs.mkdirSync(distNodesRoot, { recursive: true });

  const stack = [nodesRoot];
  let copied = 0;

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
      } else if (entry.isFile() && entry.name.endsWith(".node.json")) {
        const relativePath = path.relative(nodesRoot, absolutePath);
        const destination = path.join(distNodesRoot, relativePath);
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.copyFileSync(absolutePath, destination);
        copied += 1;
      }
    }
  }

  if (copied === 0) {
    console.warn("No codex files found to copy.");
  } else {
    console.log(`Copied ${copied} codex file${copied === 1 ? "" : "s"} to dist.`);
  }
}

copyCodexFiles();
