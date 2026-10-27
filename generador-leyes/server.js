import express from 'express';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Configurar multer para uploads
const upload = multer({
  dest: 'temp/uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API para procesar PDF
app.post('/api/upload-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo' });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);

    // Extraer texto y dividir en unidades basado en títulos/encabezados
    const text = data.text;
    const units = parseTextToUnits(text);

    // Limpiar archivo temporal
    fs.unlinkSync(req.file.path);

    res.json({ units, totalPages: data.numpages });
  } catch (error) {
    console.error('Error procesando PDF:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Error al procesar el PDF: ' + error.message });
  }
});

// API para procesar EPUB
app.post('/api/upload-epub', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ningún archivo' });
    }

    // Usar una implementación más simple para EPUB
    // Leer el archivo como texto y parsear
    const data = fs.readFileSync(req.file.path, 'utf8');
    
    // Extraer texto básico del EPUB (implementación simplificada)
    const units = parseTextToUnits(data);

    // Limpiar archivo temporal
    fs.unlinkSync(req.file.path);

    res.json({
      units,
      title: 'EPUB Importado',
      author: 'Desconocido'
    });
  } catch (error) {
    console.error('Error procesando EPUB:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Error al procesar el EPUB: ' + error.message });
  }
});

// Función para parsear texto a unidades
function parseTextToUnits(text) {
  const units = [];
  const lines = text.split('\n').filter(line => line.trim());

  let currentUnit = null;
  let unitCounter = 1;

  // Patrones comunes para detectar títulos/secciones
  const titlePatterns = [
    /^(Título|TÍTULO|CAPÍTULO|Capítulo|Libro|LIBRO|Sección|SECCIÓN|Artículo|ARTÍCULO)\s+[IVXLCDM\d]+/i,
    /^(Título|TÍTULO|CAPÍTULO|Capítulo)\s+[A-ZÁÉÍÓÚÑ]/i,
    /^\d+\.\s+[A-ZÁÉÍÓÚÑ]/,
    /^(ART\.\s*\d+)/i,
    /^Cap\s+\d+/i
  ];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Verificar si es un título
    const isTitle = titlePatterns.some(pattern => pattern.test(trimmedLine));

    if (isTitle) {
      // Guardar unidad anterior si existe
      if (currentUnit && currentUnit.content) {
        units.push(currentUnit);
      }

      // Crear nueva unidad
      currentUnit = {
        id: unitCounter.toString(),
        label: trimmedLine.substring(0, 100), // Limitar longitud
        content: '',
        sections: []
      };
      unitCounter++;
    } else if (currentUnit) {
      // Añadir contenido a la unidad actual
      if (currentUnit.content) {
        currentUnit.content += ' ' + trimmedLine;
      } else {
        currentUnit.content = trimmedLine;
      }
    }
  }

  // Añadir última unidad
  if (currentUnit && currentUnit.content) {
    units.push(currentUnit);
  }

  // Si no se detectaron unidades, crear una sola con todo el texto
  if (units.length === 0) {
    units.push({
      id: '1',
      label: 'Contenido Completo',
      content: text.substring(0, 5000), // Limitar a 5000 caracteres
      sections: []
    });
  }

  return units;
}

// API para generar proyecto
app.post('/api/generate', async (req, res) => {
  try {
    const {
      appName,
      appDescription,
      primaryColor,
      backgroundColor,
      textColor,
      borderColor,
      content // JSON con el contenido de la ley
    } = req.body;

    // Validar datos
    if (!appName || !content) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Crear directorio temporal
    const tempDir = path.join(__dirname, 'temp', Date.now().toString());
    fs.mkdirSync(tempDir, { recursive: true });

    // Generar archivos del proyecto
    await generateProject(tempDir, {
      appName,
      appDescription,
      primaryColor,
      backgroundColor,
      textColor,
      borderColor,
      content
    });

    // Crear ZIP
    const zipPath = path.join(__dirname, 'temp', `${Date.now()}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`ZIP creado: ${archive.pointer()} bytes`);
      res.download(zipPath, `${appName.replace(/\s+/g, '-')}-proyecto.zip`, () => {
        // Limpiar archivos temporales
        fs.rmSync(tempDir, { recursive: true, force: true });
        fs.rmSync(zipPath, { force: true });
      });
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(output);
    archive.directory(tempDir, false);
    archive.finalize();

  } catch (error) {
    console.error('Error generando proyecto:', error);
    res.status(500).json({ error: error.message });
  }
});

async function generateProject(dir, config) {
  // Crear estructura de directorios
  const dirs = ['src', 'assets', 'data', 'scripts', 'tests'];
  dirs.forEach(d => fs.mkdirSync(path.join(dir, d), { recursive: true }));

  // Generar package.json
  const packageJson = {
    name: config.appName.toLowerCase().replace(/\s+/g, '-'),
    version: '1.0.0',
    private: true,
    scripts: {
      start: 'node scripts/serve.mjs',
      test: 'node --test tests/*.test.mjs'
    },
    description: config.appDescription,
    engines: { node: '>=20' }
  };
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(packageJson, null, 2));

  // Generar index.html con colores personalizados
  const indexHtml = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="${config.primaryColor}">
    <title>${config.appName}</title>
    <link rel="icon" href="./assets/libro.svg" type="image/svg+xml">
    <link rel="stylesheet" href="./styles.css">
    <script type="module" src="./src/app.js"></script>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="#inicio">
        <img class="brand-mark" src="./assets/libro.svg" width="56" height="56" alt="Libro">
        <span>
          <span class="brand-eyebrow">ESTUDIO</span>
          <strong>${config.appName}</strong>
          <small>${config.appDescription}</small>
        </span>
      </a>
    </header>
    <div id="notice" role="alert" hidden></div>
    <main id="app" tabindex="-1"><p>Cargando biblioteca…</p></main>
    <nav aria-label="Navegación principal">
      <a href="#inicio"><span class="material-icon" aria-hidden="true">&#xe88a;</span><span>Inicio</span></a>
      <a href="#biblioteca"><span class="material-icon" aria-hidden="true">&#xea19;</span><span>Biblioteca</span></a>
      <a href="#tarjetas"><span class="material-icon" aria-hidden="true">&#xe41d;</span><span>Tarjetas</span></a>
      <a href="#test"><span class="material-icon" aria-hidden="true">&#xf04c;</span><span>Test</span></a>
      <a href="#progreso"><span class="material-icon" aria-hidden="true">&#xe26b;</span><span>Progreso</span></a>
    </nav>
  </body>
</html>`;
  fs.writeFileSync(path.join(dir, 'index.html'), indexHtml);

  // Generar styles.css con colores personalizados
  const stylesCss = `@font-face {
  font-family: "MaterialIcons";
  src: url("./assets/MaterialIcons.ttf") format("truetype");
  font-style: normal;
  font-weight: 400;
  font-display: block;
}
:root {
  color-scheme: light;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: ${config.textColor};
  background: ${config.backgroundColor};
  line-height: 1.6;
  --primary: ${config.primaryColor};
  --border: ${config.borderColor};
}
* { box-sizing: border-box; }
body { margin: 0; }
a { color: var(--primary); text-underline-offset: .2em; }
button, input, select { font: inherit; }
button, .button { min-height: 44px; }
button, .button {
  display: inline-flex; align-items: center; justify-content: center; padding: .7rem 1.15rem;
  border: 1px solid var(--primary); border-radius: 10px; background: var(--primary);
  color: white; font-weight: 800; text-decoration: none; cursor: pointer;
}
button:hover, .button:hover { filter: brightness(.94); }
button:disabled { opacity: .45; cursor: not-allowed; }
.secondary { background: white; color: var(--primary); border-color: var(--border); }
:focus-visible { outline: 3px solid #3b82c4; outline-offset: 4px; }
.site-header {
  display: flex; align-items: center; gap: 13px; max-width: 940px; margin: auto;
  padding: 14px 20px 0;
}
body[data-route]:not([data-route="inicio"]) .site-header { display: none; }
.brand { display: flex; align-items: center; gap: 13px; color: ${config.textColor}; text-decoration: none; line-height: 1.3; }
.brand strong { display: block; font-size: 25px; font-weight: 900; letter-spacing: -.03em; }
.brand-eyebrow { display: block; font-size: 12px; font-weight: 900; color: var(--primary); letter-spacing: 1.4px; margin-bottom: 3px; }
.brand small { display: block; font-size: 13px; font-weight: 500; margin-top: 3px; color: var(--border); }
.brand-mark { display: block; flex-shrink: 0; border-radius: 12px; }
.material-icon { font-family: "MaterialIcons"; font-weight: 400; font-style: normal; font-size: 24px; line-height: 1; display: inline-block; -webkit-font-smoothing: antialiased; }
main { max-width: 940px; margin: auto; padding: 14px 20px 100px; }
main:focus { outline: none; }
h1 { font-size: 30px; font-weight: 900; line-height: 1.2; letter-spacing: -.03em; margin: .5rem 0 1rem; }
h2 { font-size: 21px; font-weight: 900; line-height: 1.4; margin: 0 0 .85rem; }
p { margin: .5rem 0 1rem; }
.panel { background: white; border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; margin: 1rem 0; }
nav {
  position: fixed; bottom: 0; left: 0; right: 0;
  display: flex; justify-content: space-around;
  background: white; border-top: 1px solid var(--border);
  padding: 8px 0 20px;
}
nav a {
  display: flex; flex-direction: column; align-items: center;
  text-decoration: none; color: var(--border); font-size: 11px;
  gap: 4px;
}
nav a:hover, nav a[aria-current="page"] { color: var(--primary); }
nav a .material-icon { font-size: 24px; }`;
  fs.writeFileSync(path.join(dir, 'styles.css'), stylesCss);

  // Generar datos
  fs.writeFileSync(path.join(dir, 'data', 'corpus.json'), JSON.stringify(config.content, null, 2));

  // Copiar icono base
  const iconSource = path.join(__dirname, 'public', 'libro.svg');
  if (fs.existsSync(iconSource)) {
    fs.copyFileSync(iconSource, path.join(dir, 'assets', 'libro.svg'));
  }

  // Generar script básico
  const appJs = `import { loadCorpus } from "./domain.js";

const app = document.querySelector("#app");
const notice = document.querySelector("#notice");

async function init() {
  try {
    const data = await loadCorpus();
    renderHome(data);
  } catch (error) {
    showError(error);
  }
}

function showError(error) {
  console.error(error);
  notice.hidden = false;
  notice.textContent = error.message;
}

function renderHome(data) {
  app.innerHTML = \`
    <div class="panel">
      <h1>Bienvenido a ${config.appName}</h1>
      <p>${config.appDescription}</p>
      <p>Esta aplicación contiene \${data.units.length} unidades para estudiar.</p>
    </div>
  \`;
}

init();`;
  fs.writeFileSync(path.join(dir, 'src', 'app.js'), appJs);

  // Generar domain.js básico
  const domainJs = `import { loadCorpus as loadCorpusBase } from "./corpus-loader.js";

export async function loadCorpus() {
  return await loadCorpusBase();
}`;
  fs.writeFileSync(path.join(dir, 'src', 'domain.js'), domainJs);

  // Generar corpus-loader.js
  const corpusLoaderJs = `export async function loadCorpus() {
  const response = await fetch('./data/corpus.json');
  if (!response.ok) throw new Error('No se pudo cargar el contenido');
  return await response.json();
}`;
  fs.writeFileSync(path.join(dir, 'src', 'corpus-loader.js'), corpusLoaderJs);

  // Generar script de servidor
  const serveMjs = `import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8766;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') filePath = './index.html';

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(\`Servidor corriendo en http://127.0.0.1:\${PORT}\`);
});`;
  fs.writeFileSync(path.join(dir, 'scripts', 'serve.mjs'), serveMjs);

  // Generar README
  const readme = `# ${config.appName}

${config.appDescription}

## Instalación

\`\`\`bash
npm install
npm start
\`\`\`

Abrir http://127.0.0.1:8766

## Colores Personalizados

- Color primario: ${config.primaryColor}
- Color de fondo: ${config.backgroundColor}
- Color de texto: ${config.textColor}
- Color de bordes: ${config.borderColor}

## Estructura

- \`index.html\` - Página principal
- \`styles.css\` - Estilos con colores personalizados
- \`src/\` - Lógica de la aplicación
- \`data/\` - Contenido de la ley
- \`assets/\` - Recursos gráficos

## Generado con

Herramienta Generadora de Leyes v1.0
`;
  fs.writeFileSync(path.join(dir, 'README.md'), readme);
}

app.listen(PORT, () => {
  console.log(`🚀 Generador de Leyes corriendo en http://localhost:${PORT}`);
});
