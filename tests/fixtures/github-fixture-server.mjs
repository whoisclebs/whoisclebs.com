// Substituto local da API de eventos do GitHub para o smoke e2e (sem rede real).
// GET /users/<user>/events/public → fixture com ETag (304 com If-None-Match igual).
// POST /__fixture/mode com corpo "ok" ou "fail" alterna para respostas 502.
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'

const port = Number(process.env.GITHUB_FIXTURE_PORT ?? 8790)
const body = readFileSync(new URL('./github-events.json', import.meta.url))
const etag = 'W/"fixture-1"'
let mode = 'ok'

createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`)
  if (req.method === 'POST' && url.pathname === '/__fixture/mode') {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => {
      mode = data.trim() === 'fail' ? 'fail' : 'ok'
      res.writeHead(204).end()
    })
    return
  }
  if (req.method === 'GET' && url.pathname === '/') return void res.writeHead(200).end('ok')
  if (req.method === 'GET' && /^\/users\/[^/]+\/events\/public$/.test(url.pathname)) {
    if (mode === 'fail') return void res.writeHead(502).end('fixture: falha simulada')
    if (req.headers['if-none-match'] === etag) return void res.writeHead(304, { etag }).end()
    return void res.writeHead(200, { 'content-type': 'application/json', etag }).end(body)
  }
  res.writeHead(404).end()
}).listen(port, '127.0.0.1')
