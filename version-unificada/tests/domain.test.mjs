import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  createSession, evaluateAnswer, sessionSummary, emptyProgress, validateProgress,
  mergeProgress, shuffled, resultsMetrics
} from "../src/domain.js";
import { buildQuestions, sourceFragments } from "../src/questions.js";
import { matchBoeAnchors } from "../src/boe.js";

const data = JSON.parse(await readFile(new URL("../data/corpus.json", import.meta.url), "utf8"));
const unitIds = new Set(data.units.map(unit => unit.id));

test("470 unidades originales, identificadores estables y máximo de 8 preguntas", () => {
  assert.equal(unitIds.size, 470);
  assert.equal(new Set(data.questions.map(q => q.id)).size, data.questions.length);
  assert.ok(data.questions.length > 470);
  assert.ok(data.questions.some(q => q.kind === "literal"));
  assert.ok(data.questions.some(q => q.kind === "comprehension"));
  for (const unit of data.units) {
    const questions = data.questions.filter(q => q.unitId === unit.id);
    assert.ok(questions.length <= 8, unit.id);
    const literal = questions.filter(q => q.kind === "literal");
    assert.equal(new Set(literal.map(q => q.evidenceQuote)).size, literal.length, unit.id);
  }
});

test("todas las preguntas tienen evidencia exacta en su unidad y respuestas válidas", () => {
  for (const q of data.questions) {
    assert.ok(unitIds.has(q.unitId));
    const unit = data.units.find(item => item.id === q.unitId);
    assert.ok(unit.blocks.some(block => block.type === "paragraph" && block.text.includes(q.evidenceQuote)), q.id);
    if (q.kind === "literal") {
      assert.ok(q.answer.trim().length > 0);
      assert.equal(q.clozeText.replace("_____", q.answer), q.evidenceQuote, q.id);
      assert.equal(evaluateAnswer(q, q.answer), true);
      assert.equal(evaluateAnswer(q, "respuesta deliberadamente incorrecta"), false);
    } else {
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options).size, 4);
      assert.ok(Number.isInteger(q.correctOptionIndex) && q.correctOptionIndex >= 0 && q.correctOptionIndex < 4);
      assert.equal(evaluateAnswer(q, q.correctOptionIndex), true);
      assert.equal(evaluateAnswer(q, (q.correctOptionIndex + 1) % 4), false);
      assert.equal(q.editorialStatus, "draft-unreviewed");
    }
  }
});

test("se conserva todo el texto legal sin cambios y no se altera el paquete original", async () => {
  const vm = await import("node:vm");
  const original = await readFile(new URL("../../_expo/static/js/web/entry-2246e415c87966c377f36a446e60c8b2.js", import.meta.url), "utf8");
  assert.equal(createHash("sha256").update(original).digest("hex"), data.generatedFromSha256);
  let corpus;
  const line = original.split("\n").find(value => value.includes("s.exports={schemaVersion:1,contentVersion:") && value.includes("studyUnitIds:"));
  vm.runInNewContext(line, { __d(fn) { const module = { exports: {} }; fn(null, null, null, null, module, {}, []); corpus = module.exports; } }, { timeout: 5000 });
  assert.deepEqual([...unitIds], Array.from(corpus.studyUnitIds));
  for (const unit of data.units) {
    const originalUnit = corpus.entries.find(entry => entry.id === unit.id);
    assert.equal(JSON.stringify(unit.blocks), JSON.stringify(originalUnit.blocks));
    assert.equal(unit.label, originalUnit.label);
  }
});

test("el banco se regenera de forma determinista y no genera preguntas de unidades derogadas", () => {
  assert.deepEqual(buildQuestions(data.units), data.questions);
  const withoutQuestions = data.units.filter(unit => !data.questions.some(q => q.unitId === unit.id));
  assert.equal(withoutQuestions.length, 8);
  for (const unit of withoutQuestions) {
    assert.match(unit.blocks.filter(b => b.type === "paragraph").map(b => b.text).join(" "), /Derogad|Suprimid/u);
    assert.deepEqual(sourceFragments(unit), []);
  }
});

for (const length of [12, 25, 50]) {
  test(`test de ${length}: tamaño exacto, preguntas únicas y distribución entre unidades`, () => {
    const session = createSession(data.questions, length);
    assert.equal(session.questions.length, length);
    assert.equal(new Set(session.questions.map(q => q.id)).size, length);
    assert.equal(new Set(session.questions.map(q => q.unitId)).size, length);
    assert.equal(session.requestedLength, length);
  });
}

test("filtros pequeños se reducen al disponible, no se repiten ni se inventan preguntas", () => {
  const pool = data.questions.filter(q => q.unitId === "lgss:art:001");
  const session = createSession([...pool, ...pool], 50);
  assert.equal(session.questions.length, pool.length);
  assert.ok(pool.length < 8);
  assert.throws(() => createSession([], 12), /No hay preguntas/u);
  assert.throws(() => createSession(data.questions, 20), /12, 25 o 50/u);
});

test("se evalúan tildes, puntuación y espacios según la regla mostrada", () => {
  const question = { kind: "literal", answer: "acción protectora" };
  assert.equal(evaluateAnswer(question, "  ACCIÓN   PROTECTORA  "), true);
  assert.equal(evaluateAnswer(question, "accio\u0301n protectora"), true);
  assert.equal(evaluateAnswer(question, "accion protectora"), false);
  assert.equal(evaluateAnswer(question, "acción protectora."), false);
});

test("la puntuación usa el tamaño de la sesión y las abandonadas no alteran los completados", () => {
  const session = createSession(data.questions, 12);
  session.answers = Array.from({ length: 12 }, (_, i) => ({ questionId: session.questions[i].id, isCorrect: i < 9 }));
  const completed = sessionSummary(session);
  assert.equal(completed.score, 75);
  const abandoned = sessionSummary(session, "abandoned");
  assert.deepEqual(resultsMetrics([completed, abandoned]), { completed: 1, answered: 12, correct: 9, percent: 75 });
});

test("importar progreso conserva dominio, tarjetas, sesiones y unidades antiguas sin modificar la entrada", () => {
  const current = emptyProgress(data.contentVersion);
  current.units["lgss:art:001"] = { status: "mastered" };
  current.openedCardIds = ["card-1"];
  current.sessions = [{ id: "session-1", status: "completed", answers: [] }];
  const incoming = emptyProgress("version-anterior");
  incoming.units["lgss:art:001"] = { status: "in-progress" };
  incoming.units["lgss:art:002"] = { status: "mastered" };
  incoming.units["unidad-antigua"] = { status: "mastered" };
  incoming.openedCardIds = ["card-1", "card-2"];
  incoming.revealedCardIds = ["card-1"];
  incoming.sessions = [{ id: "session-1", status: "completed", answers: [] }, { id: "session-2", status: "abandoned", answers: [] }];
  const before = JSON.stringify(current);
  const next = mergeProgress(current, incoming, unitIds);
  assert.equal(next.units["lgss:art:001"].status, "mastered");
  assert.equal(next.units["lgss:art:002"].status, "mastered");
  assert.equal(next.orphanedUnits["unidad-antigua"].status, "mastered");
  assert.deepEqual(next.openedCardIds, ["card-1", "card-2"]);
  assert.equal(next.sessions.length, 2);
  assert.equal(next.contentVersion, data.contentVersion);
  assert.equal(JSON.stringify(current), before);
  assert.deepEqual(mergeProgress(next, incoming, unitIds), next);
});

test("se rechaza progreso incompatible o dañado de forma explícita", () => {
  assert.throws(() => validateProgress({}), /compatible/u);
  const value = emptyProgress(data.contentVersion);
  value.units["lgss:art:001"] = { status: "inventado" };
  assert.throws(() => validateProgress(value), /inválidos/u);
  value.units = {};
  value.openedCardIds = [12];
  assert.throws(() => validateProgress(value), /dañado/u);
});

test("barajar no muta el banco original ni pierde elementos", () => {
  const original = [1, 2, 3, 4];
  const copy = shuffled(original, () => 0.2);
  assert.deepEqual(original, [1, 2, 3, 4]);
  assert.deepEqual([...copy].sort(), original);
  assert.notDeepEqual(copy, original);
});

test("el libro y la fuente de iconos son copias independientes de los originales", async () => {
  const svg = await readFile(new URL("../assets/libro.svg", import.meta.url), "utf8");
  const originalHtml = await readFile(new URL("../../index.html", import.meta.url), "utf8");
  assert.ok(originalHtml.includes(svg.replace(' xmlns="http://www.w3.org/2000/svg"', "")));
  const originalFont = await readFile(new URL("../../assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.4e85bc9ebe07e0340c9c4fc2f6c38908.ttf", import.meta.url));
  const copiedFont = await readFile(new URL("../assets/MaterialIcons.ttf", import.meta.url));
  assert.deepEqual(copiedFont, originalFont);
  const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
  for (const code of ["e88a", "ea19", "e41d", "f04c", "e26b"]) assert.ok(index.includes(`&#x${code};`));
});

test("las 470 unidades llevan al marcador BOE contrastado, incluidos bis y disposiciones", async () => {
  const mapping = JSON.parse(await readFile(new URL("../data/boe-anchors.json", import.meta.url), "utf8"));
  assert.equal(Object.keys(mapping.entries).length, 470);
  assert.equal(new Set(data.units.map(unit => unit.sourceAnchor)).size, 470);
  for (const unit of data.units) {
    assert.equal(unit.sourceAnchor, mapping.entries[unit.id].anchor);
    assert.equal(unit.sourceUrl, `${mapping.sourceUrl}#${unit.sourceAnchor}`);
    assert.ok(!unit.sourceUrl.includes("#conso-"));
  }
  const anchor = id => data.units.find(unit => unit.id === id).sourceAnchor;
  assert.equal(anchor("lgss:art:001"), "a1");
  assert.equal(anchor("rdl8-2015:art:unico"), "aunico");
  assert.equal(anchor("lgss:art:153-bis"), "a1-2");
  assert.equal(anchor("lgss:disp-adicional:cuarta"), "dacuaa");
  assert.equal(anchor("lgss:disp-final:sexta"), "dfsexta");
});

test("los marcadores se extraen por el precepto y fallan si faltan o son ambiguos", () => {
  const html = '<div class="bloque" id="a1"><h5 class="articulo">Artículo 1. Derecho de los <a href="#">españoles</a>.</h5></div><div class="bloque" id="a1-2"><h5 class="articulo">Artículo 153 bis. Cotización.</h5></div>';
  assert.deepEqual(matchBoeAnchors(html, [{ id: "first", label: "Artículo 1. Otro título." }]),
    { first: { anchor: "a1", heading: "Artículo 1. Derecho de los españoles." } });
  assert.throws(() => matchBoeAnchors(html, [{ id: "missing", label: "Artículo 2. Otro." }]), /No se encuentra/u);
  assert.throws(() => matchBoeAnchors(html + html, []), /ambiguo/u);
});
