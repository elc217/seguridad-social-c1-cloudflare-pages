export const STORAGE_KEY = "lgss.c1.unified.progress.v1";
export const LEGACY_KEY = "lgss.c1.study.progress.v1";
export const TEST_LENGTHS = [12, 25, 50];

export function shuffled(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function normalizeAnswer(value) {
  return value.normalize("NFC").trim().replace(/\s+/gu, " ").toLocaleLowerCase("es");
}

export function createSession(questions, length, random = Math.random) {
  if (!TEST_LENGTHS.includes(length)) throw new Error("Elige un test de 12, 25 o 50 preguntas.");
  const unique = [...new Map(questions.map(q => [q.id, q])).values()];
  if (!unique.length) throw new Error("No hay preguntas disponibles para este filtro.");
  // Reparte primero por unidades para no llenar el test con un solo artículo largo.
  const groups = new Map();
  for (const q of shuffled(unique, random)) {
    if (!groups.has(q.unitId)) groups.set(q.unitId, []);
    groups.get(q.unitId).push(q);
  }
  const queue = shuffled([...groups.values()], random);
  const selected = [];
  while (queue.length && selected.length < length) {
    const group = queue.shift();
    selected.push(group.pop());
    if (group.length) queue.push(group);
  }
  return {
    id: globalThis.crypto.randomUUID(),
    requestedLength: length,
    questions: selected,
    answers: [],
    startedAt: new Date().toISOString()
  };
}

export function evaluateAnswer(question, answer) {
  if (question.kind === "literal") return normalizeAnswer(answer) === normalizeAnswer(question.answer);
  if (question.kind === "comprehension") return answer === question.correctOptionIndex;
  throw new Error("Tipo de pregunta desconocido.");
}

export function sessionSummary(session, status = "completed") {
  const correct = session.answers.filter(a => a.isCorrect).length;
  return {
    id: session.id,
    status,
    total: session.questions.length,
    answered: session.answers.length,
    correct,
    score: session.questions.length ? Math.round(100 * correct / session.questions.length) : 0,
    startedAt: session.startedAt,
    completedAt: new Date().toISOString(),
    answers: session.answers
  };
}

export function emptyProgress(contentVersion) {
  return {
    schemaVersion: 1, contentVersion, units: {}, openedCardIds: [],
    revealedCardIds: [], sessions: [], orphanedUnits: {},
    updatedAt: new Date().toISOString()
  };
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function validateProgress(value) {
  if (!isObject(value) || value.schemaVersion !== 1 || !isObject(value.units) ||
      !Array.isArray(value.openedCardIds) || !Array.isArray(value.revealedCardIds) ||
      !Array.isArray(value.sessions)) {
    throw new Error("El archivo de progreso no es compatible. No se ha sobrescrito nada.");
  }
  for (const unit of Object.values(value.units)) {
    if (!isObject(unit) || !["new", "in-progress", "mastered"].includes(unit.status)) {
      throw new Error("Hay estados de unidad inválidos. No se ha sobrescrito nada.");
    }
  }
  if (![...value.openedCardIds, ...value.revealedCardIds].every(id => typeof id === "string") ||
      !value.sessions.every(isObject) ||
      (value.orphanedUnits !== undefined && !isObject(value.orphanedUnits))) {
    throw new Error("El historial de progreso está dañado. No se ha sobrescrito nada.");
  }
  return value;
}

export function mergeProgress(current, incoming, unitIds) {
  validateProgress(current);
  validateProgress(incoming);
  const merged = structuredClone(current);
  const rank = { new: 0, "in-progress": 1, mastered: 2 };
  for (const [id, value] of Object.entries(incoming.units)) {
    if (!unitIds.has(id)) {
      merged.orphanedUnits[id] = value;
    } else if (!merged.units[id] || rank[value.status] > rank[merged.units[id].status]) {
      merged.units[id] = value;
    }
  }
  merged.openedCardIds = [...new Set([...current.openedCardIds, ...incoming.openedCardIds])];
  merged.revealedCardIds = [...new Set([...current.revealedCardIds, ...incoming.revealedCardIds])];
  const sessions = new Map(current.sessions.map(s => [s.id ?? JSON.stringify(s), s]));
  for (const s of incoming.sessions) {
    const key = s.id ?? JSON.stringify(s);
    if (!sessions.has(key)) sessions.set(key, s);
  }
  merged.sessions = [...sessions.values()];
  merged.orphanedUnits = { ...incoming.orphanedUnits, ...merged.orphanedUnits };
  return merged;
}

export function unitStatus(progress, id) {
  return progress.units[id]?.status ?? "new";
}

export function isCompletedSession(session) {
  return session.status === "completed";
}

export function resultsMetrics(sessions) {
  const completed = sessions.filter(isCompletedSession);
  let correct = 0;
  let answered = 0;
  for (const session of completed) {
    if (Array.isArray(session.answers)) {
      answered += session.answers.length;
      correct += session.answers.filter(answer => answer.isCorrect).length;
    }
  }
  return { completed: completed.length, answered, correct, percent: answered ? Math.round(100 * correct / answered) : 0 };
}
