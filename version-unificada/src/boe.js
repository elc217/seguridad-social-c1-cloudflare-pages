function plainText(html) {
  return html.replace(/<[^>]+>/gu, "")
    .replace(/&#x([a-f0-9]+);/giu, (_, value) => String.fromCodePoint(parseInt(value, 16)))
    .replace(/&#(\d+);/gu, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/&nbsp;/gu, " ").replace(/&amp;/gu, "&").replace(/&quot;/gu, '"')
    .replace(/\s+/gu, " ").trim();
}

function preceptKey(title) {
  const normalized = plainText(title).normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es");
  return normalized.match(/^(articulo [^.]+|disposicion (?:adicional|transitoria|derogatoria|final) [^.]+)\./u)?.[1];
}

export function matchBoeAnchors(html, units) {
  const official = new Map();
  const blocks = html.matchAll(/<div class="bloque" id="([^"]+)">([\s\S]*?)(?=<div class="bloque"|$)/gu);
  for (const block of blocks) {
    const title = block[2].match(/<h5 class="articulo">([\s\S]*?)<\/h5>/u)?.[1];
    if (!title) continue;
    const key = preceptKey(title);
    if (!key) continue;
    if (official.has(key)) throw new Error(`Precepto ambiguo en el BOE: ${key}.`);
    official.set(key, { anchor: block[1], heading: plainText(title) });
  }
  const entries = {};
  for (const unit of units) {
    const match = official.get(preceptKey(unit.label));
    if (!match) throw new Error(`No se encuentra el marcador BOE de ${unit.id}: ${unit.label}`);
    entries[unit.id] = match;
  }
  return entries;
}
