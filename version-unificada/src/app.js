import {
  STORAGE_KEY, LEGACY_KEY, TEST_LENGTHS, shuffled, createSession, evaluateAnswer,
  sessionSummary, emptyProgress, validateProgress, mergeProgress, unitStatus, resultsMetrics
} from "./domain.js";
import { getGoogleSyncConfig } from "./sync/config.js";
import { connectGoogle, disconnectGoogle, getGoogleAccessToken } from "./sync/google-auth.js";
import { findProgressFile, downloadProgress, syncProgress } from "./sync/google-drive.js";

const app = document.querySelector("#app");
const notice = document.querySelector("#notice");
const statusLabels = { new: "Pendiente", "in-progress": "En estudio", mastered: "Dominada" };
let data, progress, storageBlocked = false, activeTest = null, lastResult = null;
let syncStatus = "disconnected", syncError = "";
let cardIndex = 0, cards = [], revealed = false, cardScope = null;
const library = { query: "", section: "", kind: "", status: "", page: 0 };

function h(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith("on")) element.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === "class") element.className = value;
    else if (key === "checked" || key === "disabled" || key === "hidden") element[key] = value;
    else element.setAttribute(key, value);
  }
  element.append(...children.flat().filter(child => child !== null && child !== undefined));
  return element;
}
const text = (value, cls = "") => h("p", { class: cls }, value);
const heading = value => h("h2", {}, value);
const panel = (...children) => h("section", { class: "panel" }, ...children);
const link = (label, href, secondary = false) => h("a", { href, class: secondary ? "button secondary" : "button" }, label);
const button = (label, action, attrs = {}) => h("button", { type: "button", onClick: action, ...attrs }, label);
const row = (...children) => h("div", { class: "actions" }, ...children);
const unitLink = id => `#unidad?id=${encodeURIComponent(id)}`;
const practiceLink = (route, id) => `#${route}?unidad=${encodeURIComponent(id)}`;
const normalize = value => value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es");

function showError(error) {
  console.error(error);
  notice.hidden = false;
  notice.textContent = error instanceof Error ? error.message : String(error);
}

function save(next) {
  if (storageBlocked) {
    showError(new Error("El progreso está protegido porque no pudo leerse. Exporta una copia antes de restaurarlo; no se sobrescribirá."));
    return false;
  }
  next.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    progress = next;
    return true;
  } catch (error) {
    showError(new Error(`No se pudo guardar el progreso: ${error.message}. Libera espacio o permite almacenamiento local y vuelve a intentarlo.`));
    return false;
  }
}

function markUnit(id, status) {
  if (unitStatus(progress, id) === status) return true;
  const next = structuredClone(progress);
  next.units[id] = { ...next.units[id], status, updatedAt: new Date().toISOString() };
  return save(next);
}

function sections() {
  const map = new Map([["norma-aprobatoria", "Norma aprobatoria"], ["disposiciones", "Disposiciones de la LGSS"]]);
  for (const unit of data.units) {
    const title = unit.ancestors.find(item => item.kind === "title");
    if (title) map.set(title.id, title.label);
  }
  return [...map.entries()].sort((a, b) => {
    const order = id => data.units.findIndex(unit => unit.sectionId === id);
    return order(a[0]) - order(b[0]);
  });
}

function select(label, values, selected, onChange) {
  const input = h("select", { onChange: event => onChange(event.target.value) },
    values.map(([value, title]) => h("option", { value }, title)));
  input.value = selected;
  return h("label", { class: "field" }, h("span", {}, label), input);
}

function scopeSelect(selected, onChange) {
  return select("Parte de la ley", [["", "Toda la LGSS"], ...sections()], selected, onChange);
}

function sourceLink(unit) {
  return h("a", { href: unit.sourceUrl, target: "_blank", rel: "noopener noreferrer", class: "source-link" }, "Abrir este precepto en el BOE ↗");
}

function intro(title, subtitle) {
  return h("div", { class: "intro" }, text("UNA LEY · UNA BIBLIOTECA", "eyebrow"), h("h1", {}, title), text(subtitle, "muted"));
}

function home() {
  const mastered = data.units.filter(unit => unitStatus(progress, unit.id) === "mastered").length;
  const comprehension = data.questions.filter(q => q.kind === "comprehension").length;
  const next = data.units.find(unit => unitStatus(progress, unit.id) !== "mastered") ?? data.units[0];
  const continuation = panel(
    h("div", { class: "continue-top" }, text("CONTINÚA TU ESTUDIO", "eyebrow"), h("span", { class: "storage-badge" }, "Guardado en este dispositivo")),
    heading(next.label),
    text(`Fuente BOE consolidada: modificación visible ${data.source.consolidatedCut}.`),
    row(link("Abrir siguiente precepto", unitLink(next.id))));
  continuation.classList.add("continue-panel");
  app.append(
    continuation,
    h("div", { class: "stats" },
      panel(h("strong", {}, String(data.units.length)), text("Unidades de estudio")),
      panel(h("strong", {}, data.questions.length.toLocaleString("es")), text("Preguntas disponibles")),
      panel(h("strong", {}, "12 / 25 / 50"), text("Preguntas por test"))),
    panel(heading("Tu avance"), h("progress", { max: data.units.length, value: mastered, "aria-label": "Unidades dominadas" }),
      text(`${mastered} de ${data.units.length} unidades dominadas. El progreso de esta versión se guarda por separado.`),
      link("Ver progreso y copias", "#progreso", true)),
    panel(heading("Una ley, un solo recorrido"),
      text("Ley General de la Seguridad Social: texto refundido aprobado por el Real Decreto Legislativo 8/2015. La norma aprobatoria es un apartado de la misma biblioteca, no otra ley entre la que debas elegir."),
      row(link("Abrir Biblioteca", "#biblioteca"), link("Practicar un test", "#test", true))),
    panel(heading("Mapa modular"),
      text("Elige una división para empezar desde la biblioteca. Los títulos de la ley conservan su jerarquía."),
      h("div", { class: "section-grid" }, sections().map(([id, label]) => link(label, `#biblioteca?seccion=${encodeURIComponent(id)}`, true)))),
    panel(heading("Hasta 8 preguntas útiles por unidad"),
      text("No se fuerzan ocho ejercicios en preceptos cortos o sin contenido. Las preguntas literales utilizan fragmentos distintos del texto, con respuesta escrita para evitar opciones absurdas."),
      text(`Hay ${comprehension} preguntas de comprensión de lectura jurídica en esta primera entrega editorial. Son un borrador pendiente de revisión jurídica, no un banco completo de supuestos prácticos.`, "warning"),
      text(data.scopeNotice, "muted"))
  );
}

function libraryView(params) {
  if (params.has("seccion")) library.section = params.get("seccion");
  const search = h("input", { type: "search", placeholder: "Artículo, disposición o texto…", value: library.query });
  let list;
  const update = () => {
    const query = normalize(library.query);
    const filtered = data.units.filter(unit =>
      (!query || normalize(unit.label + " " + unit.blocks.map(block => block.text ?? "").join(" ")).includes(query)) &&
      (!library.section || unit.sectionId === library.section) &&
      (!library.kind || unit.kind === library.kind) &&
      (!library.status || unitStatus(progress, unit.id) === library.status));
    const pages = Math.max(1, Math.ceil(filtered.length / 40));
    library.page = Math.min(library.page, pages - 1);
    list.replaceChildren(text(`${filtered.length} de ${data.units.length} unidades · Página ${library.page + 1} de ${pages}`, "muted"));
    const visible = filtered.slice(library.page * 40, (library.page + 1) * 40);
    let section = "";
    for (const unit of visible) {
      if (section !== unit.sectionId) {
        section = unit.sectionId;
        list.append(heading(sections().find(([id]) => id === section)?.[1] ?? "LGSS"));
      }
      list.append(h("a", { class: "unit-row", href: unitLink(unit.id) },
        h("span", {}, h("strong", {}, unit.label), h("small", {}, `${data.questions.filter(q => q.unitId === unit.id).length} preguntas`)),
        h("span", { class: `badge ${unitStatus(progress, unit.id)}` }, statusLabels[unitStatus(progress, unit.id)])));
    }
    if (!visible.length) list.append(text("No hay unidades con estos filtros."));
    if (pages > 1) list.append(row(
      button("Anterior", () => { library.page--; update(); }, { disabled: library.page === 0, class: "secondary" }),
      button("Siguiente", () => { library.page++; update(); }, { disabled: library.page >= pages - 1 })));
  };
  const change = (key, value) => { library[key] = value; library.page = 0; update(); };
  search.addEventListener("input", event => change("query", event.target.value));
  list = h("section", { class: "unit-list", "aria-label": "Unidades de estudio" });
  app.append(intro("Biblioteca", "Artículos, disposiciones y norma aprobatoria en un único lugar."),
    panel(h("label", { class: "field" }, h("span", {}, "Buscar en la biblioteca"), search),
      h("div", { class: "filters" }, scopeSelect(library.section, value => change("section", value)),
        select("Contenido", [["", "Artículos y disposiciones"], ["article", "Artículos"], ["disposition", "Disposiciones"]], library.kind, value => change("kind", value)),
        select("Estado", [["", "Todos"], ...Object.entries(statusLabels)], library.status, value => change("status", value)))),
    text(data.scopeNotice, "muted"), list);
  update();
}

function unitView(params) {
  const unit = data.units.find(item => item.id === params.get("id"));
  if (!unit) { app.append(intro("Unidad no encontrada", "El identificador no corresponde a esta biblioteca."), link("Volver a Biblioteca", "#biblioteca")); return; }
  if (unitStatus(progress, unit.id) === "new") markUnit(unit.id, "in-progress");
  app.append(link("← Biblioteca", "#biblioteca", true), intro(unit.label, sections().find(([id]) => id === unit.sectionId)?.[1] ?? "LGSS"));
  const content = panel(heading("Texto de la instantánea"));
  for (const block of unit.blocks) {
    if (block.type === "heading") continue;
    if (typeof block.text === "string") content.append(text(block.text, "legal-text"));
  }
  content.append(sourceLink(unit), text(`El enlace abre este precepto en el texto consolidado oficial (marcador #${unit.sourceAnchor}). La redacción vigente puede diferir de esta instantánea.`, "muted"));
  app.append(content,
    panel(heading("Practicar esta unidad"),
      text(`${data.questions.filter(q => q.unitId === unit.id).length} preguntas disponibles; nunca se repite una pregunta dentro de la sesión.`),
      row(link("Tarjetas de esta unidad", practiceLink("tarjetas", unit.id)), link("Test de esta unidad", practiceLink("test", unit.id), true))),
    panel(heading("Progreso local"),
      text(`Estado: ${statusLabels[unitStatus(progress, unit.id)]}`),
      button(unitStatus(progress, unit.id) === "mastered" ? "Volver a marcar en estudio" : "Marcar unidad como dominada", () => {
        if (markUnit(unit.id, unitStatus(progress, unit.id) === "mastered" ? "in-progress" : "mastered")) render();
      })));
}

function recordCard(question, reveal = false) {
  const id = `${question.id}:card`;
  const next = structuredClone(progress);
  if (!next.openedCardIds.includes(id)) next.openedCardIds.push(id);
  if (reveal && !next.revealedCardIds.includes(id)) next.revealedCardIds.push(id);
  if (unitStatus(next, question.unitId) === "new") next.units[question.unitId] = { status: "in-progress", updatedAt: new Date().toISOString() };
  if (JSON.stringify(next) !== JSON.stringify(progress)) save(next);
}

function cardsView(params) {
  const scope = params.get("unidad") ?? "";
  if (cardScope !== scope) {
    cardScope = scope; cardIndex = 0; revealed = false;
    cards = data.questions.filter(q => q.kind === "literal" && (!scope || q.unitId === scope));
  }
  app.append(intro("Tarjetas", "Completa el fragmento y revela la respuesta exacta."),
    row(link("Todas las tarjetas", "#tarjetas", true), button("Mezclar tarjetas", () => {
      cards = shuffled(cards); cardIndex = 0; revealed = false; render();
    }, { class: "secondary", disabled: !cards.length })));
  const question = cards[cardIndex];
  if (!question) { app.append(panel(text("Esta unidad no dispone de fragmentos aptos para tarjetas.")), link("Abrir Biblioteca", "#biblioteca")); return; }
  recordCard(question);
  const unit = data.units.find(item => item.id === question.unitId);
  app.append(text(`Tarjeta ${cardIndex + 1} de ${cards.length}`, "eyebrow"),
    panel(heading(unit.label), text(question.clozeText, "quote"),
      revealed ? h("div", { class: "feedback" }, heading(question.answer), text(question.evidenceQuote), sourceLink(unit)) :
        button("Mostrar respuesta", () => { recordCard(question, true); revealed = true; render(); }),
      row(link("Ver unidad", unitLink(unit.id), true), button("Marcar dominada", () => { if (markUnit(unit.id, "mastered")) render(); }, { class: "secondary" }))),
    row(button("Anterior", () => { cardIndex--; revealed = false; render(); }, { disabled: cardIndex === 0, class: "secondary" }),
      button("Siguiente", () => { cardIndex++; revealed = false; render(); }, { disabled: cardIndex >= cards.length - 1 })));
}

function testSetup(params) {
  const unitId = params.get("unidad");
  const unit = data.units.find(item => item.id === unitId);
  let scope = "", kind = "", length = 12;
  const countText = text("", "muted");
  const start = button("Empezar test", () => {
    try {
      activeTest = createSession(pool(), length);
      activeTest.questions = activeTest.questions.map(q => {
        if (q.kind !== "comprehension") return q;
        const order = shuffled(q.options.map((_, index) => index));
        return { ...q, options: order.map(i => q.options[i]), correctOptionIndex: order.indexOf(q.correctOptionIndex) };
      });
      lastResult = null;
      render();
    } catch (error) { showError(error); }
  });
  function pool() {
    const ids = new Set(data.units.filter(item => (!unitId || item.id === unitId) && (!scope || item.sectionId === scope)).map(item => item.id));
    return data.questions.filter(q => ids.has(q.unitId) && (!kind || q.kind === kind));
  }
  function update() {
    const available = pool().length;
    countText.textContent = `${available} preguntas disponibles. La sesión tendrá ${Math.min(length, available)} de las ${length} solicitadas, sin repeticiones.`;
    start.disabled = available === 0;
  }
  app.append(panel(heading(unit ? `Test: ${unit.label}` : "Configura tu sesión"),
    unitId ? link("Quitar filtro de unidad", "#test", true) : scopeSelect(scope, value => { scope = value; update(); }),
    h("div", { class: "filters" },
      select("Tipo de preguntas", [["", "Mezcla de las disponibles"], ["literal", "Literalidad · respuesta escrita"], ["comprehension", "Comprensión · borrador editorial"]], kind, value => { kind = value; update(); }),
      select("Preguntas por test", TEST_LENGTHS.map(n => [String(n), String(n)]), String(length), value => { length = Number(value); update(); })),
    countText, start));
  update();
}

function finishTest(status) {
  const result = sessionSummary(activeTest, status);
  const next = structuredClone(progress);
  next.sessions.push(result);
  if (save(next)) {
    lastResult = { ...result, questions: activeTest.questions };
    activeTest = null;
    render();
  }
}

function testView(params) {
  app.append(intro("Test", "Sesiones de 12, 25 o 50 preguntas, con corrección y evidencia de cada respuesta."),
    text(data.editorialNotice, "warning"));
  if (!activeTest && lastResult) { resultsView(); return; }
  if (!activeTest) { testSetup(params); return; }
  const index = activeTest.answers.length;
  if (index === activeTest.questions.length) {
    app.append(panel(heading("Todas las respuestas están evaluadas"), button("Guardar resultado", () => finishTest("completed"))));
    return;
  }
  const question = activeTest.questions[index];
  const unit = data.units.find(item => item.id === question.unitId);
  const answerArea = h("div");
  app.append(text(`Pregunta ${index + 1} de ${activeTest.questions.length} · ${question.kind === "literal" ? "Literalidad" : "Comprensión"}`, "eyebrow"),
    panel(heading(unit.label), text(question.prompt), question.clozeText ? text(question.clozeText, "quote") : null, answerArea),
    row(link("Consultar unidad (conserva el test)", unitLink(unit.id), true),
      button("Abandonar test", () => {
        if (confirm("¿Abandonar la sesión? Se guardará como abandonada, no como test completado.")) finishTest("abandoned");
      }, { class: "secondary" })));
  const submit = answer => {
    const isCorrect = evaluateAnswer(question, answer);
    activeTest.answers.push({ questionId: question.id, unitId: question.unitId, answer, isCorrect });
    const correctAnswer = question.kind === "literal" ? question.answer : question.options[question.correctOptionIndex];
    answerArea.replaceChildren(h("div", { class: isCorrect ? "feedback" : "feedback incorrect", role: "status" },
      heading(isCorrect ? "Respuesta correcta" : "Respuesta incorrecta"),
      text(`Respuesta: ${correctAnswer}`), text(question.explanation),
      h("blockquote", {}, question.evidenceQuote), sourceLink(unit),
      button(index + 1 === activeTest.questions.length ? "Terminar y guardar resultado" : "Siguiente pregunta", () => {
        if (activeTest.answers.length === activeTest.questions.length) finishTest("completed");
        else render();
      })));
  };
  if (question.kind === "literal") {
    const input = h("input", { type: "text", required: "", autocomplete: "off", spellcheck: "false", placeholder: "Escribe las palabras que faltan…" });
    answerArea.append(h("form", { onSubmit: event => { event.preventDefault(); submit(input.value); } },
      h("label", { class: "field" }, h("span", {}, "Tu respuesta literal"), input),
      text("Respeta las tildes y la puntuación. No se distingue entre mayúsculas y minúsculas.", "muted"),
      h("button", { type: "submit" }, "Comprobar respuesta")));
  } else {
    const fieldset = h("fieldset", {}, h("legend", {}, "Elige una respuesta"));
    const form = h("form", { onSubmit: event => {
      event.preventDefault();
      const chosen = new FormData(form).get("answer");
      if (chosen !== null) submit(Number(chosen));
    } }, fieldset, h("button", { type: "submit" }, "Comprobar respuesta"));
    question.options.forEach((option, optionIndex) => fieldset.append(h("label", { class: "option" },
      h("input", { type: "radio", name: "answer", value: String(optionIndex), required: "" }), option)));
    answerArea.append(form);
  }
}

function resultsView() {
  const result = lastResult;
  app.append(panel(heading(result.status === "completed" ? "Test completado" : "Test abandonado"),
    text(`${result.correct} aciertos · ${result.answered} respuestas evaluadas · ${result.total} preguntas en la sesión`),
    result.status === "completed" ? text(`${result.score}% de acierto`, "score") : text("No cuenta como test completado."),
    row(button("Preparar otro test", () => { lastResult = null; render(); }), link("Ver progreso", "#progreso", true))));
  for (const answer of result.answers) {
    const q = result.questions.find(item => item.id === answer.questionId);
    app.append(h("details", { class: "panel" },
      h("summary", {}, `${answer.isCorrect ? "✓" : "✗"} ${data.units.find(unit => unit.id === q.unitId).label}`),
      text(q.clozeText ?? q.prompt), text(`Tu respuesta: ${typeof answer.answer === "number" ? q.options[answer.answer] : answer.answer}`),
      text(`Respuesta correcta: ${q.kind === "literal" ? q.answer : q.options[q.correctOptionIndex]}`), text(q.explanation), h("blockquote", {}, q.evidenceQuote)));
  }
}

function download(value, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
  const anchor = h("a", { href: url, download: filename });
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importProgress(value) {
  const next = mergeProgress(progress, value, new Set(data.units.map(unit => unit.id)));
  if (save(next)) render();
}

async function syncGoogleDrive() {
  syncStatus = "syncing";
  syncError = "";
  render();
  try {
    const accessToken = await connectGoogle();
    const file = await findProgressFile(accessToken);
    const incoming = file ? await downloadProgress(accessToken, file.id) : null;
    const result = await syncProgress({
      accessToken,
      localProgress: progress,
      incomingProgress: incoming,
      contentVersion: data.contentVersion,
      unitIds: new Set(data.units.map(unit => unit.id))
    });
    if (!save(result.progress)) throw new Error("No se pudo guardar el progreso combinado en este dispositivo.");
    syncStatus = "connected";
    render();
  } catch (error) {
    syncStatus = "error";
    syncError = error instanceof Error ? error.message : String(error);
    showError(error);
    render();
  }
}

function syncPanel() {
  const config = getGoogleSyncConfig();
  const status = syncStatus === "connected" ? "Conectado" : syncStatus === "syncing" ? "Sincronizando…" : syncStatus === "error" ? `Error: ${syncError}` : "No conectado";
  return panel(heading("Sincronización entre dispositivos"),
    text(`Estado: ${status}`),
    text("Solo se sincroniza tu progreso en el espacio privado de la aplicación de tu Google Drive. La biblioteca y las preguntas no se suben."),
    text(config.enabled
      ? "Google solicitará permiso únicamente cuando pulses el botón."
      : "Google Drive no está configurado; el progreso permanece solo en este dispositivo.", "muted"),
    row(button(syncStatus === "connected" ? "Sincronizar ahora" : "Conectar con Google Drive", syncGoogleDrive, { disabled: !config.enabled || syncStatus === "syncing" }),
      syncStatus === "connected" ? button("Desconectar", () => { disconnectGoogle(); syncStatus = "disconnected"; render(); }, { class: "secondary" }) : null,
      button("Exportar copia JSON", () => download(progress, "lgss-progreso-unificado.json"), { class: "secondary" })));
}

function progressView() {
  const metrics = resultsMetrics(progress.sessions);
  const mastered = data.units.filter(unit => unitStatus(progress, unit.id) === "mastered").length;
  const studying = data.units.filter(unit => unitStatus(progress, unit.id) === "in-progress").length;
  app.append(intro("Progreso", "Una sola biblioteca. Historial local independiente de la versión original."),
    h("div", { class: "stats" }, panel(h("strong", {}, String(mastered)), text("Dominadas")),
      panel(h("strong", {}, String(studying)), text("En estudio")),
      panel(h("strong", {}, String(data.units.length - mastered - studying)), text("Pendientes"))),
    panel(heading("Avance por partes de la ley"),
      sections().map(([id, label]) => {
        const units = data.units.filter(unit => unit.sectionId === id);
        const done = units.filter(unit => unitStatus(progress, unit.id) === "mastered").length;
        return h("div", { class: "progress-row" }, h("label", {}, label,
          h("progress", { max: units.length, value: done, "aria-label": label })),
        text(`${done} de ${units.length} dominadas`, "muted"));
      })),
    syncPanel(),
    panel(heading("Resultados de práctica"),
      text(`${metrics.completed} tests completados · ${metrics.correct} aciertos en ${metrics.answered} respuestas · ${metrics.percent}%`),
      text(`${progress.openedCardIds.length} tarjetas abiertas · ${progress.revealedCardIds.length} respuestas reveladas`),
      text("Las sesiones abandonadas no cuentan como tests completados ni en el porcentaje de acierto.", "muted")),
    panel(heading("Copias y progreso anterior"),
      text("Esta versión no modifica el almacén original. Puedes importar una copia JSON y exportar tu progreso. La importación conserva el estado más avanzado y evita duplicar sesiones."),
      row(button("Exportar progreso", () => download(progress, "lgss-progreso-unificado.json")),
        button("Importar progreso del original en este origen", () => {
          try {
            const raw = localStorage.getItem(LEGACY_KEY);
            if (raw === null) throw new Error("No se encontró progreso original en este origen. Usa una copia JSON si está en otro puerto, dominio o dispositivo.");
            importProgress(JSON.parse(raw));
          } catch (error) { showError(error); }
        }, { class: "secondary" })),
      h("label", { class: "field" }, h("span", {}, "Importar copia JSON"),
        h("input", { type: "file", accept: ".json,application/json", onChange: async event => {
          try {
            const file = event.target.files[0];
            if (file) importProgress(JSON.parse(await file.text()));
          } catch (error) { showError(error); }
        } }))),
    panel(heading("Actividad reciente"),
      progress.sessions.length ? progress.sessions.slice(-10).reverse().map(session => text(
        `${session.completedAt ?? session.updatedAt ?? session.startedAt ?? "Fecha no disponible"} · ${session.status === "completed" ? "Completado" : "Abandonado"} · ${(session.answers ?? []).filter(a => a.isCorrect).length}/${(session.answers ?? []).length} aciertos`
      )) : text("Aún no hay sesiones guardadas.")),
    text("No hay cuenta ni sincronización. Si borras los datos del navegador sin exportar una copia, se perderán.", "muted"));
}

function render() {
  if (!data) return;
  const [route, query = ""] = (location.hash.slice(1) || "inicio").split("?");
  const params = new URLSearchParams(query);
  document.body.dataset.route = route;
  app.replaceChildren();
  document.querySelectorAll("nav a").forEach(anchor => {
    if (anchor.hash === `#${route}` || (route === "unidad" && anchor.hash === "#biblioteca")) anchor.setAttribute("aria-current", "page");
    else anchor.removeAttribute("aria-current");
  });
  if (activeTest && route !== "test") app.append(h("aside", { class: "resume" }, "Tienes un test en curso. ", link("Continuar test", "#test", true)));
  const views = { inicio: home, biblioteca: libraryView, unidad: unitView, tarjetas: cardsView, test: testView, progreso: progressView };
  if (views[route]) views[route](params);
  else app.append(intro("Página no encontrada", "Usa la navegación para volver a estudiar."), link("Ir a Inicio", "#inicio"));
  app.append(text(`Instantánea importada del BOE: ${data.source.consolidatedCut}. Verifica siempre la legislación vigente. No es un temario oficial validado.`, "muted"));
  document.title = `${route === "inicio" ? "Inicio" : route.charAt(0).toUpperCase() + route.slice(1)} · LGSS C1`;
}

async function init() {
  try {
    const response = await fetch(new URL("../data/corpus.json", import.meta.url));
    if (!response.ok) throw new Error(`No se puede cargar la biblioteca (HTTP ${response.status}). Ejecuta npm run prepare-data si falta el archivo de datos.`);
    data = await response.json();
    progress = emptyProgress(data.contentVersion);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) progress = validateProgress(JSON.parse(raw));
    } catch (error) {
      storageBlocked = true;
      showError(new Error(`No se pudo leer el progreso. El archivo original se conserva sin sobrescribir: ${error.message}`));
    }
    render();
    window.addEventListener("hashchange", () => { render(); app.focus(); window.scrollTo(0, 0); });
  } catch (error) {
    showError(error);
    app.replaceChildren(intro("No se pudo iniciar la aplicación", "Comprueba que el archivo de datos está disponible y vuelve a cargar."),
      button("Reintentar", () => location.reload()));
  }
}

window.addEventListener("beforeunload", event => {
  if (activeTest) { event.preventDefault(); event.returnValue = ""; }
});
init();
