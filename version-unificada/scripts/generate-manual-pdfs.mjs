import { writeFile, unlink } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../../", import.meta.url));
const outDir = root;
const esc = value => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const wrap = (value, width = 105) => {
  const words = String(value).split(/\s+/u);
  const lines = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > width && line) { lines.push(line); line = word; }
    else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  return lines;
};

function makeSvg(title, subtitle, sections) {
  let y = 80;
  const parts = [
    `<rect width="100%" height="100%" fill="#f5f9fc"/>`,
    `<rect x="0" y="0" width="794" height="145" fill="#125b95"/>`,
    `<image href="version-unificada/assets/libro.svg" x="38" y="28" width="75" height="75" preserveAspectRatio="xMidYMid meet"/>`,
    `<image href="version-unificada/assets/ecap-logo.png" x="620" y="38" width="135" height="38" preserveAspectRatio="xMidYMid meet"/>`,
    `<text x="135" y="62" font-family="Arial" font-size="25" font-weight="bold" fill="white">${esc(title)}</text>`,
    `<text x="135" y="94" font-family="Arial" font-size="15" fill="#dcecf7">${esc(subtitle)}</text>`
  ];
  y = 185;
  for (const section of sections) {
    parts.push(`<rect x="32" y="${y - 28}" width="730" height="38" rx="7" fill="#dcecf7"/>`);
    parts.push(`<text x="48" y="${y}" font-family="Arial" font-size="19" font-weight="bold" fill="#0d4775">${esc(section.heading)}</text>`);
    y += 38;
    for (const item of section.items) {
      if (item.type === "diagram") {
        const boxW = 155;
        item.labels.forEach((label, index) => {
          const x = 42 + index * 178;
          parts.push(`<rect x="${x}" y="${y}" width="${boxW}" height="62" rx="8" fill="#fff" stroke="#738ca2"/>`);
          parts.push(`<text x="${x + boxW / 2}" y="${y + 27}" text-anchor="middle" font-family="Arial" font-size="13" font-weight="bold" fill="#125b95">${esc(label[0])}</text>`);
          parts.push(`<text x="${x + boxW / 2}" y="${y + 46}" text-anchor="middle" font-family="Arial" font-size="10" fill="#4b6175">${esc(label[1])}</text>`);
          if (index < item.labels.length - 1) parts.push(`<text x="${x + 160}" y="${y + 38}" font-family="Arial" font-size="22" fill="#125b95">→</text>`);
        });
        y += 88;
        continue;
      }
      if (item.type === "table") {
        parts.push(`<rect x="42" y="${y}" width="710" height="${item.rows.length * 34 + 32}" fill="white" stroke="#9abbd2"/>`);
        parts.push(`<rect x="42" y="${y}" width="710" height="32" fill="#eaf3fa"/>`);
        parts.push(`<text x="55" y="${y + 21}" font-family="Arial" font-size="12" font-weight="bold" fill="#12304a">${esc(item.header)}</text>`);
        item.rows.forEach((row, i) => parts.push(`<text x="55" y="${y + 54 + i * 34}" font-family="Arial" font-size="11" fill="#12304a">${esc(row)}</text>`));
        y += item.rows.length * 34 + 52;
        continue;
      }
      const lines = wrap(item.text, item.type === "bullet" ? 100 : 112);
      for (const line of lines) {
        parts.push(`<text x="${item.type === "bullet" ? 58 : 48}" y="${y}" font-family="Arial" font-size="12" fill="#12304a">${item.type === "bullet" ? "• " : ""}${esc(line)}</text>`);
        y += 21;
      }
      y += 7;
    }
    y += 17;
  }
  parts.push(`<rect x="32" y="${y + 8}" width="730" height="75" rx="8" fill="#eaf3fa" stroke="#125b95"/>`);
  parts.push(`<text x="48" y="${y + 35}" font-family="Arial" font-size="12" font-weight="bold" fill="#0d4775">Autoría institucional</text>`);
  parts.push(`<text x="48" y="${y + 57}" font-family="Arial" font-size="11" fill="#12304a">Luis Enrique Algueró Martín · Comunidad de Alumnos de «Escuela Ciudadana de Administración Pública» (ECAP) · 2026</text>`);
  const height = y + 110;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="794" height="${height}" viewBox="0 0 794 ${height}">${parts.join("")}</svg>`;
}

const userSections = [
  { heading: "1. Recorrido de estudio", items: [{ type: "diagram", labels: [["Consultar", "Biblioteca y BOE"], ["Practicar", "Tarjetas y tests"], ["Medir", "Progreso y resultados"]] }, { text: "La aplicación contiene 470 unidades, tarjetas, preguntas, citas legales y estadísticas. Funciona localmente y Google Drive es opcional." }] },
  { heading: "2. Biblioteca", items: [{ text: "Abre Biblioteca, busca por artículo, disposición o texto y aplica filtros por parte de la ley, tipo de contenido y estado." }, { type: "bullet", text: "Al abrir una unidad pendiente pasa a En estudio." }, { type: "bullet", text: "Puedes marcarla como Dominada o devolverla a En estudio." }, { type: "bullet", text: "El enlace al BOE permite contrastar la fuente oficial." }] },
  { heading: "3. Tarjetas", items: [{ text: "Las tarjetas muestran fragmentos con palabras ocultas. Intenta recordar la redacción, pulsa Mostrar respuesta y revisa la cita exacta." }, { type: "diagram", labels: [["Leer", "Fragmento"], ["Recordar", "Respuesta"], ["Revelar", "Cita y BOE"]] }, { type: "bullet", text: "Usa Anterior, Siguiente y Mezclar tarjetas." }, { type: "bullet", text: "Las tarjetas abiertas y reveladas se registran en Progreso." }] },
  { heading: "4. Tests", items: [{ text: "Configura 12, 25 o 50 preguntas y filtra por unidad, parte de la ley o tipo de pregunta." }, { type: "diagram", labels: [["Configurar", "Filtro y tamaño"], ["Responder", "Pregunta a pregunta"], ["Corregir", "Explicación y evidencia"]] }, { type: "bullet", text: "Cada corrección muestra acierto, respuesta, explicación, cita y enlace al BOE." }, { type: "bullet", text: "Los tests abandonados se guardan, pero no cuentan como completados." }] },
  { heading: "5. Progreso y estadísticas", items: [{ text: "Consulta unidades dominadas, en estudio y pendientes; avance por partes; tests completados; aciertos; respuestas evaluadas; porcentaje; tarjetas y actividad reciente." }, { type: "table", header: "Indicadores principales", rows: ["Dominadas · En estudio · Pendientes", "Tests completados · Aciertos · Porcentaje", "Tarjetas abiertas · Respuestas reveladas"] }] },
  { heading: "6. Copias y Google Drive", items: [{ text: "Exporta un JSON antes de borrar los datos o desinstalar. La sincronización se activa solo al pulsar Conectar con Google Drive." }, { type: "diagram", labels: [["Conectar", "Cuenta Google"], ["Autorizar", "Permiso appDataFolder"], ["Combinar", "Local + remoto"], ["Sincronizar", "Drive privado"]] }, { type: "bullet", text: "Solo se sube el progreso: no se suben la legislación ni las preguntas." }, { type: "bullet", text: "Desconectar no borra el progreso local." }, { type: "bullet", text: "Si la cuenta está en pruebas, debe figurar como usuario de prueba en Google Cloud." }] },
  { heading: "7. Uso sin conexión y aviso legal", items: [{ text: "Biblioteca, tarjetas y tests funcionan sin conexión después de cargar los recursos. Google Drive necesita internet." }, { text: "La aplicación es una herramienta de estudio. Comprueba siempre la legislación vigente en el BOE; no constituye un temario oficial validado." }] }
];
const installSections = [
  { heading: "1. Opciones de distribución", items: [{ type: "diagram", labels: [["PWA", "Cloudflare Pages"], ["Android / iOS", "APK / IPA"], ["Escritorio", "EXE / DMG"]] }, { text: "Todas las versiones incluyen la biblioteca, las tarjetas, los tests y el seguimiento local." }] },
  { heading: "2. PWA local y Cloudflare", items: [{ text: "Desde version-unificada ejecuta npm install y npm start. Abre http://127.0.0.1:8766." }, { text: "Para publicar, ejecuta npm run package y sube lgss-c1-cloudflare.zip mediante Direct Upload. No uses comando de build." }] },
  { heading: "3. macOS Intel y Apple Silicon", items: [{ type: "bullet", text: "Intel: LGSS Seguridad Social C1-1.0.0.dmg." }, { type: "bullet", text: "Apple Silicon: LGSS Seguridad Social C1-1.0.0-arm64.dmg." }, { text: "Abre el DMG, arrastra a Applications y, si aparece una advertencia de firma, usa Ctrl+clic y Abrir." }] },
  { heading: "4. Windows", items: [{ text: "Descarga el artifact windows-installer, descomprímelo y ejecuta LGSS Seguridad Social C1 Setup 1.0.0.exe. El blockmap acompaña al instalador y no se ejecuta." }] },
  { heading: "5. Android", items: [{ text: "Descarga android-apk, descomprímelo y abre app-debug.apk. Autoriza temporalmente la instalación desde esa fuente si Android lo solicita." }, { text: "Es un APK de depuración para pruebas y distribución directa; no es un paquete publicado en Google Play." }] },
  { heading: "6. iOS", items: [{ text: "Descarga ios-ipa y descomprímelo. El IPA de CI compila sin firma de distribución; para un iPhone físico debe firmarse con una cuenta Apple válida." }] },
  { heading: "7. GitHub Actions", items: [{ type: "table", header: "Workflow y resultado", rows: ["Build Android APK → android-apk → app-debug.apk", "Build iOS IPA → ios-ipa → App-Debug.ipa", "Build Windows EXE → windows-installer → Setup 1.0.0.exe"] }, { text: "Los workflows están en .github/workflows y se ejecutan desde la pestaña Actions." }] },
  { heading: "8. Google Drive y validación", items: [{ text: "Google Drive usa drive.appdata, el espacio privado de cada usuario. No se debe distribuir ningún client_secret." }, { text: "Antes de distribuir, ejecuta npm test y npm run package; después prueba navegación, tarjetas, tests, exportación, importación y sincronización." }] }
];

for (const [filename, title, subtitle, sections] of [["MANUAL-USUARIO", "LGSS Seguridad Social C1", "Manual de usuario", userSections], ["MANUAL-INSTALACION", "LGSS Seguridad Social C1", "Manual de instalación y distribución", installSections]]) {
  const svg = join(outDir, `${filename}.svg`);
  const pdf = join(outDir, `${filename}.pdf`);
  await writeFile(svg, makeSvg(title, subtitle, sections));
  execFileSync("sips", ["-s", "format", "pdf", svg, "--out", pdf], { stdio: "inherit" });
  await unlink(svg);
}
console.log("Manuales PDF generados en la raíz del proyecto.");
