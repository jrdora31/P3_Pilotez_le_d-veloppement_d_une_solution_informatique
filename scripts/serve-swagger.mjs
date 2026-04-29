import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(fileURLToPath(new URL("..", import.meta.url)));
const docsDir = join(rootDir, "docs");
const preferredPort = Number.parseInt(process.env.PORT || "8080", 10);
const host = process.env.HOST || "127.0.0.1";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".yaml": "application/yaml; charset=utf-8",
  ".yml": "application/yaml; charset=utf-8",
};

function isInsideDocs(filePath) {
  const pathFromDocs = relative(docsDir, filePath);
  return pathFromDocs === "" || (!pathFromDocs.startsWith("..") && !pathFromDocs.startsWith(sep));
}

function resolveRequestPath(requestUrl = "/") {
  const url = new URL(requestUrl, `http://${host}`);
  const pathname = url.pathname === "/" ? "/swagger.html" : url.pathname;
  const filePath = resolve(docsDir, `.${normalize(decodeURIComponent(pathname))}`);

  if (!isInsideDocs(filePath)) {
    return null;
  }

  return filePath;
}

const server = createServer((request, response) => {
  const filePath = resolveRequestPath(request.url);

  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "cache-control": "no-store",
    "content-type": contentTypes[extname(filePath)] || "application/octet-stream",
  });

  createReadStream(filePath).pipe(response);
});

function listen(port, attemptsLeft = 20) {
  server.listen(port, host, () => {
    console.log(`Swagger UI: http://${host}:${port}/swagger.html`);
  });

  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
      listen(port + 1, attemptsLeft - 1);
      return;
    }

    throw error;
  });
}

listen(preferredPort);
