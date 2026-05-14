/**
 * Servidor de producción para el portal estático (dist/).
 * Sin dependencias externas — Node.js built-ins únicamente.
 * Añade todos los headers de seguridad HTTP recomendados.
 */
import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { join, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const DIST      = resolve(__dirname, 'dist')
const PORT      = Number(process.env.PORT) || 3000

// ─── MIME types ────────────────────────────────────────────────────────────
const MIME = {
  '.html':  'text/html; charset=utf-8',
  '.js':    'application/javascript',
  '.mjs':   'application/javascript',
  '.css':   'text/css',
  '.svg':   'image/svg+xml',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.webp':  'image/webp',
  '.ico':   'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.json':  'application/json',
  '.txt':   'text/plain; charset=utf-8',
}

// ─── Content Security Policy ────────────────────────────────────────────────
const supabaseUrl = process.env.VITE_SUPABASE_URL ?? ''
const supabaseWss = supabaseUrl.replace('https://', 'wss://')
const apiBaseUrl  = process.env.VITE_API_BASE_URL ?? ''

const connectSrc = ["'self'", 'blob:', supabaseUrl, supabaseWss, apiBaseUrl]
  .filter(Boolean)
  .join(' ')

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",  // unsafe-inline requerido por CSS custom properties
  `img-src 'self' data: blob: ${supabaseUrl}`,  // data: QR; blob: previews; supabase: storage
  `connect-src ${connectSrc}`,
  "font-src 'self'",
  `frame-src 'self' blob: ${supabaseUrl}`,      // blob: para preview de PDFs en iframe
  "frame-ancestors 'none'",            // previene clickjacking (solo funciona como HTTP header)
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ')

// ─── Security headers ───────────────────────────────────────────────────────
const SEC_HEADERS = {
  'Content-Security-Policy':   CSP,
  'X-Frame-Options':           'DENY',
  'X-Content-Type-Options':    'nosniff',
  'Referrer-Policy':           'strict-origin-when-cross-origin',
  'Permissions-Policy':        'camera=(self), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function serveFile(filePath, res, status = 200) {
  const ext  = extname(filePath).toLowerCase()
  const mime = MIME[ext] ?? 'application/octet-stream'
  const isHtml = ext === '.html'

  try {
    const { size } = statSync(filePath)
    res.writeHead(status, {
      'Content-Type':   mime,
      'Content-Length': size,
      // HTML: no cachear para que el SPA siempre sirva la última versión
      // Assets con hash: cachear 1 año (immutable)
      'Cache-Control': isHtml
        ? 'no-cache, no-store, must-revalidate'
        : 'public, max-age=31536000, immutable',
      ...SEC_HEADERS,
    })
    createReadStream(filePath).pipe(res)
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end('Internal Server Error')
  }
}

// ─── Server ─────────────────────────────────────────────────────────────────
createServer((req, res) => {
  // Solo GET y HEAD
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' })
    res.end()
    return
  }

  // Ignorar query string y fragmentos
  const pathname = (req.url ?? '/').split('?')[0].split('#')[0]

  // Prevenir path traversal
  const safePath = resolve(DIST, '.' + pathname)
  if (!safePath.startsWith(DIST)) {
    res.writeHead(403)
    res.end()
    return
  }

  // Intentar servir el archivo exacto
  if (existsSync(safePath) && statSync(safePath).isFile()) {
    serveFile(safePath, res)
    return
  }

  // Fallback SPA: todas las rutas sirven index.html
  serveFile(join(DIST, 'index.html'), res)
}).listen(PORT, () => {
  console.log(`Portal running on port ${PORT}`)
})
