import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { matchBoeAnchors } from "../src/boe.js";

const sourceUrl = "https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724";
const input = process.argv[2];
let html;
if (input) {
  html = await readFile(input, "utf8");
} else {
  const response = await fetch(sourceUrl);
  if (!response.ok) throw new Error(`No se pudo consultar el BOE: HTTP ${response.status}`);
  html = await response.text();
}
const corpus = JSON.parse(await readFile(new URL("../data/corpus.json", import.meta.url), "utf8"));
const entries = matchBoeAnchors(html, corpus.units);
const mapping = {
  sourceUrl,
  verifiedAt: new Date().toISOString(),
  officialHtmlSha256: createHash("sha256").update(html).digest("hex"),
  entries
};
await writeFile(new URL("../data/boe-anchors.json", import.meta.url), JSON.stringify(mapping, null, 2));
console.log(`${Object.keys(entries).length} enlaces contrastados con el HTML oficial del BOE, sin inferir marcadores.`);
