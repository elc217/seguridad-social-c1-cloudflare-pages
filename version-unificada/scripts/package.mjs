import { access, unlink, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = fileURLToPath(new URL("../", import.meta.url));
const archive = fileURLToPath(new URL("../lgss-c1-cloudflare.zip", import.meta.url));
const files = [
  "index.html", "styles.css", "_headers", "src/app.js", "src/domain.js",
  "data/corpus.json", "assets/libro.svg", "assets/MaterialIcons.ttf",
  "assets/MaterialIcons-LICENSE.txt"
];
for (const file of files) await access(new URL(`../${file}`, import.meta.url));
try {
  await unlink(archive);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
execFileSync("zip", ["-q", "-X", archive, ...files], { cwd: root, stdio: "inherit" });
execFileSync("unzip", ["-t", archive], { stdio: "inherit" });
const entries = execFileSync("unzip", ["-Z1", archive], { encoding: "utf8" }).trim().split("\n");
if (entries.length !== files.length || !files.every(file => entries.includes(file))) {
  throw new Error("El ZIP no contiene exactamente los archivos de publicación esperados.");
}
console.log(`ZIP listo para Cloudflare Pages: ${archive} (${Math.round((await stat(archive)).size / 1024)} KiB)`);
