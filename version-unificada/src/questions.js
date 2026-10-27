import { editorialQuestions } from "./editorial.js";

const segmenter = new Intl.Segmenter("es", { granularity: "sentence" });
const excludedText = /^(?:\(?derogad[oa]s?\)?[.\s]*|\(?suprimid[oa]s?\)?[.\s]*|\(?sin contenido\)?[.\s]*|este documento es de carácter informativo.*)$/iu;
const stopWords = new Set("a al ante bajo con contra de del desde durante el ella ellas ello ellos en entre es esta estas este estos ha han hasta la las le les lo los más no o para por que se sin sobre su sus un una unas unos y".split(" "));
const keyTerms = [
  /\b\d+(?:[.,]\d+)?\s*(?:por ciento|%|años|meses|días|semanas|euros|horas)/giu,
  /\b(?:dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|doce|quince|veinte|treinta|sesenta|noventa|ciento ochenta)(?: y \w+)? (?:años|meses|días|semanas|euros|horas)/giu,
  /\b(?:Instituto Nacional de la Seguridad Social|Tesorería General de la Seguridad Social|Inspección de Trabajo y Seguridad Social|Ley General de la Seguridad Social|Ministerio de Empleo y Seguridad Social|Gobierno|Estado)\b/gu,
  /\b(?:base reguladora|bases? de cotización|prestaciones? (?:contributivas?|no contributivas?)|incapacidad (?:temporal|permanente)|jubilación (?:anticipada|parcial)|trabajadores? (?:por cuenta propia|por cuenta ajena)|nulo todo pacto|universalidad, unidad, solidaridad e igualdad)\b/giu
];

function hash(value) {
  let result = 2166136261;
  for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 16777619);
  return (result >>> 0).toString(36);
}

export function sourceFragments(unit) {
  const fragments = [];
  for (const block of unit.blocks) {
    if (block.type !== "paragraph" || excludedText.test(block.text.trim())) continue;
    for (const { segment } of segmenter.segment(block.text)) {
      const text = segment.trim();
      if (text.length >= 55 && text.length <= 950 && text.split(/\s+/u).length >= 10) fragments.push(text);
    }
  }
  return [...new Set(fragments)];
}

function makeLiteral(unit, text) {
  const tokens = [...text.matchAll(/\S+/gu)];
  const terms = keyTerms.flatMap(pattern => [...text.matchAll(pattern)]);
  let offset, answer;
  if (terms.length) {
    const match = terms[parseInt(hash(text), 36) % terms.length];
    offset = match.index;
    answer = match[0];
  } else {
    // El tramo alternativo debe contener contenido, nunca solo artículos y preposiciones.
    const candidates = [];
    for (let i = 1; i < tokens.length - 3; i++) {
      const words = tokens.slice(i, i + 4);
      const meaningful = words.filter(word => !stopWords.has(word[0].toLocaleLowerCase("es").replace(/[.,;:()]/gu, "")));
      if (meaningful.length >= 2 && meaningful.some(word => word[0].length >= 6)) candidates.push(words);
    }
    const words = candidates.length ? candidates[parseInt(hash(text), 36) % candidates.length] : tokens.slice(1, 5);
    offset = words[0].index;
    const last = words.at(-1);
    answer = text.slice(offset, last.index + last[0].length);
  }
  return {
    id: `${unit.id}:q:literal:${hash(text)}`, unitId: unit.id, kind: "literal",
    prompt: "Completa el fragmento con las palabras exactas de la fuente.",
    clozeText: `${text.slice(0, offset)}_____${text.slice(offset + answer.length)}`,
    answer, evidenceQuote: text,
    explanation: "Se evalúa recuerdo literal. Se ignoran mayúsculas y espacios repetidos, pero se conservan tildes y puntuación.",
    editorialStatus: "automatic-literal"
  };
}

export function buildQuestions(units) {
  const result = [];
  for (const unit of units) {
    const comprehension = editorialQuestions.filter(q => q.unitId === unit.id).map((q, index) => {
      const evidence = unit.blocks.find(b => b.type === "paragraph" && b.text.includes(q.evidenceIncludes));
      if (!evidence) throw new Error(`Falta evidencia para la pregunta editorial ${unit.id} / ${index}.`);
      return {
        id: `${unit.id}:q:comprehension:${index + 1}`, unitId: unit.id, kind: "comprehension",
        prompt: q.prompt, options: q.options, correctOptionIndex: q.correctOptionIndex,
        evidenceQuote: evidence.text, explanation: q.explanation, editorialStatus: "draft-unreviewed"
      };
    });
    const fragments = sourceFragments(unit);
    const available = 8 - comprehension.length;
    // Distribución a lo largo del precepto, en lugar de tomar solo su comienzo.
    const count = Math.min(available, fragments.length);
    const literal = Array.from({ length: count }, (_, i) => makeLiteral(unit, fragments[Math.floor(i * fragments.length / count)]));
    result.push(...comprehension, ...literal);
  }
  return result;
}
