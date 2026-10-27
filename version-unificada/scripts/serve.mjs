import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const port = Number(process.env.PORT ?? 8766);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".ttf": "font/ttf" };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const file = path.resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
    if (!file.startsWith(root)) { res.writeHead(403).end("Acceso no permitido."); return; }
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" });
    res.end(body);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") res.writeHead(404).end("Recurso no encontrado.");
    else { console.error(error); res.writeHead(500).end("Error al servir el recurso."); }
  }
});
server.on("error", error => { console.error(error); process.exitCode = 1; });
server.listen(port, "127.0.0.1", () => console.log(`LGSS unificada disponible en http://127.0.0.1:${port}`));
