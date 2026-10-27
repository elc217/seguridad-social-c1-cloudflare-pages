import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const webDir = join(root, "www");
const files = ["index.html", "styles.css", "manifest.json", "sw.js"];

await rm(webDir, { recursive: true, force: true });
await mkdir(webDir, { recursive: true });
for (const file of files) await cp(join(root, file), join(webDir, file));
for (const directory of ["assets", "data", "src"]) {
  await cp(join(root, directory), join(webDir, directory), { recursive: true });
}
console.log(`Recursos web preparados en ${webDir}`);
