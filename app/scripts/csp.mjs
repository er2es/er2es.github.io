import { createHash } from 'node:crypto';

/**
 * A strict Content Security Policy for a built page, as a <meta> tag (GitHub Pages cannot send headers).
 *  - scripts: only the site's own files, plus the inline scripts that are in the page right now, each by its hash;
 *    nothing else can run, so an injected script would be refused. Data blocks (JSON-LD, hydration state) do not run.
 *  - everything else comes from the site itself; no plugins, no forms, no other base URL.
 *  - styles keep 'unsafe-inline': the prerendered HTML carries style attributes for positions and sizes.
 */
export function withCsp(html) {
  const hashes = [];
  for (const [, attrs, body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/\bsrc=/.test(attrs) || /\btype="[^"]*json[^"]*"/.test(attrs) || !body.trim()) continue;
    hashes.push(`'sha256-${createHash('sha256').update(body).digest('base64')}'`);
  }
  const policy = [
    "default-src 'self'",
    `script-src 'self'${hashes.length ? ' ' + [...new Set(hashes)].join(' ') : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ');
  if (!html.includes('<head>')) throw new Error('no <head> to put the Content Security Policy in');
  return html.replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="${policy}">`);
}
