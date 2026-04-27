import { existsSync } from "node:fs";

const nested = ["server/node_modules"];
const found = nested.filter((path) => existsSync(path));

if (found.length) {
  console.error(`Remove stale nested dependency folders before starting: ${found.join(", ")}`);
  console.error("Run: rm -rf server/node_modules && npm install");
  process.exit(1);
}

