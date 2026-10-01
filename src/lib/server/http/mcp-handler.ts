/**
 * Borda HTTP do MCP (`/mcp`): Streamable HTTP da especificação 2025-11-25 via
 * `WebStandardStreamableHTTPServerTransport` do SDK oficial (Request/Response padrão, roda no Workers).
 *
 * - Sem estado: sem `MCP-Session-Id`, um servidor e um transporte novos por requisição, respostas JSON.
 * - GET/DELETE → 405: o servidor não oferece stream SSE nem sessões (spec, "Listening for Messages").
 * - Origin: ausente (cliente fora do navegador) ou igual ao próprio domínio; qualquer outro → 403 com erro
 *   JSON-RPC sem id (proteção contra DNS rebinding exigida pela spec). CORS só para o próprio domínio.
 * - Corpo ≤ 64 KiB (Content-Length e leitura), uma mensagem por POST (sem lote), limite por cliente em
 *   memória (best-effort), `no-store`.
 * - Nada é logado: nem IP, nem consulta, nem corpo.
 */
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import type { ContentCatalog } from '../domain/content-catalog'
import { createMcpServer } from '../mcp/server'
import type { FixedWindowLimiter } from './rate-limit'

export const MCP_ALLOWED_ORIGINS: readonly string[] = ['https://whoisclebs.com']
export const MCP_MAX_BODY_BYTES = 64 * 1024

const ALLOW = 'POST, OPTIONS'
const ALLOW_HEADERS = 'Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID'

export interface McpHandlerOptions {
  catalog: () => ContentCatalog
  limiter: FixedWindowLimiter
  version: string
  allowedOrigins?: readonly string[]
  maxBodyBytes?: number
}

function jsonRpcError(status: number, message: string, headers: Record<string, string> = {}, code = -32000): Response {
  return new Response(JSON.stringify({ jsonrpc: '2.0', error: { code, message }, id: null }), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

/** Lê o corpo como texto parando assim que passa de `max` bytes (undefined = grande demais). */
async function readBody(request: Request, max: number): Promise<string | undefined> {
  if (!request.body) return ''
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > max) {
      await reader.cancel()
      return undefined
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(bytes)
}

function withHeaders(response: Response, headers: Record<string, string>): Response {
  const out = new Response(response.body, response)
  for (const [name, value] of Object.entries(headers)) out.headers.set(name, value)
  return out
}

export function createMcpHandler({ catalog, limiter, version, allowedOrigins = MCP_ALLOWED_ORIGINS, maxBodyBytes = MCP_MAX_BODY_BYTES }: McpHandlerOptions) {
  return async function handleMcp(request: Request, clientKey: string): Promise<Response> {
    const origin = request.headers.get('origin')
    if (origin !== null && !allowedOrigins.includes(origin)) return jsonRpcError(403, 'Forbidden: origin not allowed', { vary: 'Origin' })

    const cors: Record<string, string> = origin ? { 'access-control-allow-origin': origin, vary: 'Origin' } : {}
    const base = { ...cors, 'cache-control': 'no-store' }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: { ...base, allow: ALLOW, 'access-control-allow-methods': ALLOW, 'access-control-allow-headers': ALLOW_HEADERS, 'access-control-max-age': '600' },
      })
    }
    if (request.method !== 'POST') return jsonRpcError(405, 'Method not allowed: this server offers no SSE stream and no sessions', { ...base, allow: ALLOW })

    const decision = limiter.take(clientKey)
    if (!decision.allowed) return jsonRpcError(429, 'Too many requests', { ...base, 'retry-after': String(decision.retryAfterSeconds ?? 60) })

    const declared = Number(request.headers.get('content-length'))
    if (Number.isFinite(declared) && declared > maxBodyBytes) return jsonRpcError(413, 'Payload too large', base)

    const body = await readBody(request, maxBodyBytes)
    if (body === undefined) return jsonRpcError(413, 'Payload too large', base)
    let parsedBody: unknown
    try {
      parsedBody = JSON.parse(body)
    } catch {
      return jsonRpcError(400, 'Parse error: Invalid JSON', base, -32700)
    }
    // 2025-11-25: o corpo do POST é UMA mensagem JSON-RPC. O SDK ainda aceita lotes de até 100 (legado de
    // 2025-03-26), o que multiplicaria o custo de uma requisição além do limite por cliente.
    if (Array.isArray(parsedBody)) return jsonRpcError(400, 'Invalid Request: batching is not supported', base, -32600)

    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
    const server = createMcpServer(catalog(), version)
    try {
      await server.connect(transport)
      return withHeaders(await transport.handleRequest(request, { parsedBody }), base)
    } finally {
      await server.close()
    }
  }
}
