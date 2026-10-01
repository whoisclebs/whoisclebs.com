import { describe, expect, it } from 'vitest'
import { createContentCatalog, type CatalogEntry } from '../domain/content-catalog'
import { createFixedWindowLimiter } from './rate-limit'
import { createMcpHandler, MCP_ALLOWED_ORIGINS, MCP_MAX_BODY_BYTES } from './mcp-handler'

const entries: CatalogEntry[] = [
  { uri: 'whoisclebs://profile', type: 'profile', title: 'Perfil', description: 'Engenheiro', url: 'https://whoisclebs.com/sobre/', locale: 'pt-BR', mimeType: 'text/markdown', text: '## Perfil\n\nGo e pagamentos.' },
  { uri: 'whoisclebs://projects/tuxedo', type: 'project', title: 'tuxedo', description: 'Framework HTTP em Go', url: 'https://whoisclebs.com/projetos/tuxedo/', locale: 'pt-BR', date: '2026-09-27', mimeType: 'text/markdown', text: '### tuxedo\n\nRoteador.' },
  { uri: 'whoisclebs://articles/deploy', type: 'article', title: 'Deploy com Actions', description: 'Pipeline', url: 'https://whoisclebs.com/escrita/deploy/', locale: 'pt-BR', date: '2025-09-16', mimeType: 'text/markdown', text: '### Deploy\n\nCorpo.' },
  { uri: 'whoisclebs://en/articles/deploy', type: 'article', title: 'Deploy with Actions', description: 'Pipeline', url: 'https://whoisclebs.com/en/writing/deploy/', locale: 'en', date: '2025-09-16', mimeType: 'text/markdown', text: '### Deploy\n\nBody.' },
  { uri: 'whoisclebs://notes/healthcheck', type: 'note', title: 'Healthcheck', description: 'Nota', url: 'https://whoisclebs.com/notas/healthcheck/', locale: 'pt-BR', date: '2024-01-01', mimeType: 'text/markdown', text: '### Healthcheck\n\ncurl.' },
]

const PROTOCOL = '2025-11-25'

function handler(limit = 100) {
  return createMcpHandler({ catalog: () => createContentCatalog(entries), limiter: createFixedWindowLimiter({ limit, windowMs: 60_000 }), version: 'test' })
}

let nextId = 1
function rpc(method: string, params: Record<string, unknown> = {}, headers: Record<string, string> = {}): Request {
  return new Request('https://whoisclebs.com/mcp', {
    method: 'POST',
    // Cabeçalho com valor vazio = ausente (o initialize ainda não negociou versão).
    headers: Object.fromEntries(Object.entries({ 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': PROTOCOL, ...headers }).filter(([, value]) => value !== '')),
    body: JSON.stringify({ jsonrpc: '2.0', id: nextId++, method, params }),
  })
}

async function call(method: string, params: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
  const response = await handler()(rpc(method, params, headers), 'ip')
  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toContain('application/json')
  return (await response.json()) as { result?: Record<string, unknown>; error?: { code: number; message: string } }
}

describe('createMcpHandler: transporte Streamable HTTP somente leitura', () => {
  it('initialize responde JSON sem sessão, com os recursos e as tools anunciados', async () => {
    const response = await handler()(
      rpc('initialize', { protocolVersion: PROTOCOL, capabilities: {}, clientInfo: { name: 'teste', version: '0' } }, { 'mcp-protocol-version': '' }),
      'ip',
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('mcp-session-id')).toBeNull()
    expect(response.headers.get('cache-control')).toBe('no-store')
    const body = (await response.json()) as { result: { protocolVersion: string; serverInfo: { name: string }; capabilities: Record<string, unknown> } }
    expect(body.result.protocolVersion).toBe(PROTOCOL)
    expect(body.result.serverInfo.name).toBe('whoisclebs')
    expect(Object.keys(body.result.capabilities)).toEqual(expect.arrayContaining(['resources', 'tools']))
  })

  it('resources/list traz o perfil e todos os itens do catálogo; templates cobrem projetos, artigos e notas', async () => {
    const list = await call('resources/list')
    const resources = (list.result?.resources ?? []) as Array<{ uri: string; mimeType: string; name: string }>
    expect(resources.map((r) => r.uri).sort()).toEqual(entries.map((e) => e.uri).sort())
    expect(resources.every((r) => r.mimeType === 'text/markdown' && r.name)).toBe(true)
    const templates = await call('resources/templates/list')
    expect(((templates.result?.resourceTemplates ?? []) as Array<{ uriTemplate: string }>).map((t) => t.uriTemplate).sort()).toEqual([
      'whoisclebs://articles/{slug}',
      'whoisclebs://en/articles/{slug}',
      'whoisclebs://notes/{slug}',
      'whoisclebs://projects/{slug}',
    ])
  })

  it('resources/read devolve o Markdown do item e -32002 para URI inexistente', async () => {
    const read = await call('resources/read', { uri: 'whoisclebs://projects/tuxedo' })
    expect(read.result?.contents).toEqual([{ uri: 'whoisclebs://projects/tuxedo', mimeType: 'text/markdown', text: '### tuxedo\n\nRoteador.' }])
    const profile = await call('resources/read', { uri: 'whoisclebs://profile' })
    expect((profile.result?.contents as Array<{ text: string }>)[0]?.text).toContain('Go e pagamentos')
    const missing = await call('resources/read', { uri: 'whoisclebs://projects/nao-existe' })
    expect(missing.error?.code).toBe(-32002)
  })

  it('tools/list expõe só search_content, marcada como somente leitura', async () => {
    const list = await call('tools/list')
    const tools = list.result?.tools as Array<{ name: string; annotations: Record<string, unknown>; inputSchema: { properties: Record<string, unknown>; required: string[] } }>
    expect(tools.map((t) => t.name)).toEqual(['search_content'])
    expect(tools[0]?.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false, openWorldHint: false })
    expect(Object.keys(tools[0]?.inputSchema.properties ?? {}).sort()).toEqual(['limit', 'query', 'type'])
    expect(tools[0]?.inputSchema.required).toEqual(['query'])
  })

  it('tools/call busca no catálogo e devolve conteúdo estruturado', async () => {
    const result = await call('tools/call', { name: 'search_content', arguments: { query: 'deploy', type: 'article', limit: 1 } })
    expect(result.result?.isError).toBeFalsy()
    const structured = result.result?.structuredContent as { total: number; results: Array<{ uri: string }> }
    expect(structured.total).toBe(2)
    expect(structured.results.map((r) => r.uri)).toEqual(['whoisclebs://articles/deploy'])
  })

  it.each([
    [{ query: 'a' }],
    [{ query: '   ' }],
    [{ query: 'x'.repeat(201) }],
    [{ query: 'deploy', limit: 21 }],
    [{ query: 'deploy', type: 'secret' }],
    [{}],
  ])('tools/call recusa entrada inválida %j com isError', async (args) => {
    const result = await call('tools/call', { name: 'search_content', arguments: args })
    expect(result.result?.isError).toBe(true)
  })
})

describe('createMcpHandler: borda HTTP', () => {
  it('recusa Origin fora da allowlist com 403 e erro JSON-RPC sem id', async () => {
    const response = await handler()(rpc('tools/list', {}, { origin: 'https://evil.example' }), 'ip')
    expect(response.status).toBe(403)
    expect(response.headers.get('access-control-allow-origin')).toBeNull()
    expect(await response.json()).toMatchObject({ jsonrpc: '2.0', id: null, error: { code: -32000 } })
  })

  it('aceita o próprio domínio com CORS restrito a ele', async () => {
    const origin = MCP_ALLOWED_ORIGINS[0] as string
    const response = await handler()(rpc('tools/list', {}, { origin }), 'ip')
    expect(response.status).toBe(200)
    expect(response.headers.get('access-control-allow-origin')).toBe(origin)
    expect(response.headers.get('vary')).toContain('Origin')
  })

  it('preflight OPTIONS: 204 para o próprio domínio, 403 para outro', async () => {
    const allowed = await handler()(new Request('https://whoisclebs.com/mcp', { method: 'OPTIONS', headers: { origin: 'https://whoisclebs.com' } }), 'ip')
    expect(allowed.status).toBe(204)
    expect(allowed.headers.get('access-control-allow-methods')).toBe('POST, OPTIONS')
    expect(allowed.headers.get('access-control-allow-headers')?.toLowerCase()).toContain('mcp-protocol-version')
    const denied = await handler()(new Request('https://whoisclebs.com/mcp', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } }), 'ip')
    expect(denied.status).toBe(403)
  })

  it.each(['GET', 'DELETE', 'PUT'])('%s responde 405 (sem SSE nem sessões) com Allow', async (method) => {
    const response = await handler()(new Request('https://whoisclebs.com/mcp', { method, headers: { accept: 'text/event-stream' } }), 'ip')
    expect(response.status).toBe(405)
    expect(response.headers.get('allow')).toBe('POST, OPTIONS')
  })

  it('corpo acima do limite: 413 pelo Content-Length e pelo corpo lido', async () => {
    const big = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: { pad: 'x'.repeat(MCP_MAX_BODY_BYTES) } })
    const declared = rpc('tools/list')
    const withLength = new Request(declared.url, { method: 'POST', headers: { ...Object.fromEntries(declared.headers), 'content-length': String(big.length) }, body: big })
    expect((await handler()(withLength, 'ip')).status).toBe(413)
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(big))
        controller.close()
      },
    })
    const chunked = new Request(declared.url, { method: 'POST', headers: Object.fromEntries(declared.headers), body: stream, duplex: 'half' } as RequestInit)
    expect((await handler()(chunked, 'ip')).status).toBe(413)
  })

  it('rate limit por cliente: 429 com Retry-After e sem afetar outro cliente', async () => {
    const limited = handler(2)
    expect((await limited(rpc('tools/list'), 'a')).status).toBe(200)
    expect((await limited(rpc('tools/list'), 'a')).status).toBe(200)
    const blocked = await limited(rpc('tools/list'), 'a')
    expect(blocked.status).toBe(429)
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0)
    expect((await limited(rpc('tools/list'), 'b')).status).toBe(200)
  })

  it('lote JSON-RPC (array) → 400 -32600: a spec 2025-11-25 exige uma mensagem por POST e o lote multiplicaria o custo', async () => {
    const single = rpc('tools/list')
    const batch = new Request(single.url, { method: 'POST', headers: Object.fromEntries(single.headers), body: JSON.stringify([{ jsonrpc: '2.0', id: 1, method: 'tools/list' }, { jsonrpc: '2.0', id: 2, method: 'tools/list' }]) })
    const response = await handler()(batch, 'ip')
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ id: null, error: { code: -32600 } })
  })

  it('JSON inválido → 400 -32700', async () => {
    const single = rpc('tools/list')
    const response = await handler()(new Request(single.url, { method: 'POST', headers: Object.fromEntries(single.headers), body: '{nope' }), 'ip')
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ id: null, error: { code: -32700 } })
  })

  it('versão de protocolo não suportada: 400', async () => {
    const response = await handler()(rpc('tools/list', {}, { 'mcp-protocol-version': '1999-01-01' }), 'ip')
    expect(response.status).toBe(400)
  })
})
