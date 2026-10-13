// Static preview of ../docs that behaves like GitHub Pages behind its CDN:
// compression, short cache, directory index with trailing-slash redirect, 404.html for misses.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs');
const port = Number(process.argv[2] ?? process.env.PORT ?? 4300);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.xml', '.txt']);

const local = (urlPath) => {
  const p = normalize(join(root, decodeURIComponent(urlPath)));
  return p === root || p.startsWith(root + sep) ? p : null;
};
const isDir = (p) => p !== null && existsSync(p) && statSync(p).isDirectory();

// Compressed bodies are cached per file version, like a CDN edge, so timing is not dominated by compression.
const cache = new Map();
const body = (file, zip) => {
  const key = `${file}|${zip}|${statSync(file).mtimeMs}`;
  if (!cache.has(key)) {
    const raw = readFileSync(file);
    cache.set(key, zip === 'br' ? brotliCompressSync(raw) : zip === 'gzip' ? gzipSync(raw, { level: 9 }) : raw);
  }
  return cache.get(key);
};

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  const p = local(pathname);
  if (isDir(p) && !pathname.endsWith('/')) {
    res.writeHead(301, { Location: pathname + '/' }).end();
    return;
  }
  const hit = isDir(p) ? join(p, 'index.html') : p;
  const found = hit !== null && existsSync(hit);
  const file = found ? hit : join(root, '404.html');
  const ext = extname(file);
  const accept = String(req.headers['accept-encoding'] ?? '');
  const zip = !COMPRESSIBLE.has(ext) ? null : /\bbr\b/.test(accept) ? 'br' : /\bgzip\b/.test(accept) ? 'gzip' : null;
  const data = body(file, zip);
  res.writeHead(found ? 200 : 404, {
    'Content-Type': TYPES[ext] ?? 'application/octet-stream',
    'Content-Length': data.length,
    'Cache-Control': 'max-age=600',
    Vary: 'Accept-Encoding',
    ...(zip ? { 'Content-Encoding': zip } : {}),
  });
  res.end(req.method === 'HEAD' ? undefined : data);
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}`));
