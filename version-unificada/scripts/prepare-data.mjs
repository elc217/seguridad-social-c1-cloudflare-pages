import { readFile, writeFile, mkdir, readdir, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { createHash } from "node:crypto";
import { buildQuestions } from "../src/questions.js";

const root = new URL("../", import.meta.url);
const original = new URL("../_expo/static/js/web/", root);
const entries = (await readdir(original)).filter(name => /^entry-.*\.js$/u.test(name));
if (entries.length !== 1) throw new Error("Se esperaba un único paquete original de Expo.");
const bundle = await readFile(new URL(entries[0], original), "utf8");
const line = bundle.split("\n").find(value => value.includes("s.exports={schemaVersion:1,contentVersion:") && value.includes("studyUnitIds:"));
if (!line) throw new Error("No se encuentra el corpus de la exportación original.");
let corpus;
// Solo se evalúa el módulo de datos local, aislado y sin require ni acceso a procesos.
vm.runInNewContext(line, {
  __d(fn) {
    const module = { exports: {} };
    fn(null, null, null, null, module, {}, []);
    corpus = module.exports;
  }
}, { timeout: 5000 });
if (!Array.isArray(corpus?.entries) || corpus.studyUnitIds.length !== 470) throw new Error("Corpus inesperado.");
const unitIds = new Set(corpus.studyUnitIds);
const byId = new Map(corpus.entries.map(entry => [entry.id, entry]));
const boeAnchors = JSON.parse(await readFile(new URL("data/boe-anchors.json", root), "utf8"));
const units = corpus.entries.filter(entry => unitIds.has(entry.id)).map(entry => {
  const reference = boeAnchors.entries[entry.id];
  if (!reference?.anchor) throw new Error(`Falta el enlace oficial verificado de ${entry.id}. Ejecuta npm run update-boe-links.`);
  const ancestors = [];
  let parent = byId.get(entry.parentId);
  while (parent) {
    ancestors.unshift({ id: parent.id, label: parent.label, kind: parent.kind });
    parent = byId.get(parent.parentId);
  }
  return {
    id: entry.id, kind: entry.kind, label: entry.label, document: entry.document,
    order: entry.studyOrder, blocks: entry.blocks, ancestors,
    sectionId: entry.document === "rdl" ? "norma-aprobatoria" :
      ancestors.find(item => item.kind === "title")?.id ?? "disposiciones",
    sourceAnchor: reference.anchor,
    sourceUrl: `${corpus.source.boeUrl}#${reference.anchor}`
  };
});
const questions = buildQuestions(units);
const data = {
  contentVersion: corpus.contentVersion,
  source: corpus.source,
  generatedFromSha256: createHash("sha256").update(bundle).digest("hex"),
  boeLinksVerifiedAt: boeAnchors.verifiedAt,
  units, questions,
  scopeNotice: "Se conserva el alcance del original: no incluye el Título III (artículos 262–304). No es un temario oficial C1 validado.",
  editorialNotice: "Los ejercicios literales son automáticos. Las preguntas de comprensión son un borrador editorial limitado a las citas y pendiente de revisión jurídica. No son preguntas oficiales."
};
const dir = new URL("data/", root);
await mkdir(dir, { recursive: true });
await writeFile(new URL("corpus.json", dir), JSON.stringify(data));
const assets = new URL("assets/", root);
await mkdir(assets, { recursive: true });
const originalHtml = await readFile(new URL("../index.html", root), "utf8");
const book = originalHtml.match(/<svg\b[^>]*aria-label="Libro abierto de Seguridad Social C1"[\s\S]*?<\/svg>/u)?.[0];
if (!book) throw new Error("No se encuentra el icono original del libro.");
await writeFile(new URL("libro.svg", assets), book.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '));
await copyFile(new URL("../assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.4e85bc9ebe07e0340c9c4fc2f6c38908.ttf", root),
  new URL("MaterialIcons.ttf", assets));
const counts = units.map(unit => questions.filter(q => q.unitId === unit.id).length);
console.log(`Guardado ${fileURLToPath(new URL("corpus.json", dir))}`);
console.log(JSON.stringify({
  units: units.length, questions: questions.length,
  literal: questions.filter(q => q.kind === "literal").length,
  comprehension: questions.filter(q => q.kind === "comprehension").length,
  minPerUnit: Math.min(...counts), maxPerUnit: Math.max(...counts),
  withoutQuestions: units.filter((_, index) => !counts[index]).map(unit => unit.id)
}, null, 2));
