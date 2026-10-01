import { expect, test } from '@playwright/test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { McpError, type CallToolResult } from '@modelcontextprotocol/sdk/types.js'

/**
 * `/mcp` com um cliente MCP real (o `Client` do SDK oficial sobre `StreamableHTTPClientTransport`) contra o
 * Worker do build servido pelo `wrangler dev`: initialize, recursos, tools e a borda HTTP (Origin, métodos).
 */
const BASE = 'http://127.0.0.1:8787'

async function connect() {
  const client = new Client({ name: 'e2e-whoisclebs', version: '1.0.0' })
  const transport = new StreamableHTTPClientTransport(new URL('/mcp', BASE))
  await client.connect(transport)
  return { client, transport }
}

test.describe.serial('/mcp (cliente MCP real)', () => {
  let client: Client
  let transport: StreamableHTTPClientTransport

  test.beforeAll(async () => {
    ;({ client, transport } = await connect())
  })

  test.afterAll(async () => {
    await client?.close()
  })

  test('initialize: servidor whoisclebs, sem sessão, com recursos e tools', async () => {
    expect(client.getServerVersion()?.name).toBe('whoisclebs')
    expect(client.getServerCapabilities()).toMatchObject({ resources: {}, tools: {} })
    expect(transport.sessionId).toBeUndefined()
    expect(client.getInstructions()).toContain('somente leitura')
  })

  test('resources/list: perfil, projetos, artigos publicados nos dois idiomas e notas; sem rascunho', async () => {
    const { resources } = await client.listResources()
    const uris = resources.map((resource) => resource.uri)
    expect(uris).toEqual(
      expect.arrayContaining([
        'whoisclebs://profile',
        'whoisclebs://projects/tuxedo',
        'whoisclebs://projects/golpher',
        'whoisclebs://projects/seishin',
        'whoisclebs://articles/github-actions-como-fazer-deploy',
        'whoisclebs://en/articles/github-actions-como-fazer-deploy',
        'whoisclebs://en/articles/estudo-de-caso-lighthouse-clebson-cc',
        'whoisclebs://notes/docker-healthcheck-para-servicos',
      ]),
    )
    // Rascunho (`published: false` nos dois idiomas): fora das páginas, logo fora do MCP.
    expect(uris.filter((uri) => uri.includes('hardening-performance-site-estatico-vite-cloudflare'))).toEqual([])
    expect(resources.every((resource) => resource.mimeType === 'text/markdown')).toBe(true)
  })

  test('resources/read: o mesmo texto publicado em /llms-full.txt; URI inexistente → -32002', async ({ request }) => {
    const { contents } = await client.readResource({ uri: 'whoisclebs://projects/tuxedo' })
    const text = (contents[0] as { text: string }).text
    expect(text).toContain('- Canonical: https://whoisclebs.com/projetos/tuxedo/')
    const full = await (await request.get('/llms-full.txt')).text()
    expect(full).toContain(text)
    const profile = await client.readResource({ uri: 'whoisclebs://profile' })
    expect((profile.contents[0] as { text: string }).text).toContain('## Perfil')
    const error = await client.readResource({ uri: 'whoisclebs://projects/nao-existe' }).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(McpError)
    expect((error as McpError).code).toBe(-32002)
  })

  test('tools/list: só search_content, somente leitura', async () => {
    const { tools } = await client.listTools()
    expect(tools.map((tool) => tool.name)).toEqual(['search_content'])
    expect(tools[0]?.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false })
  })

  test('tools/call: resultado estruturado com URI e página canônica', async () => {
    const result = (await client.callTool({ name: 'search_content', arguments: { query: 'tuxedo', type: 'project', limit: 3 } })) as CallToolResult
    expect(result.isError).toBeFalsy()
    const structured = result.structuredContent as { total: number; results: Array<{ uri: string; url: string }> }
    expect(structured.results[0]).toMatchObject({ uri: 'whoisclebs://projects/tuxedo', url: 'https://whoisclebs.com/projetos/tuxedo/' })
    expect(structured.results.length).toBeLessThanOrEqual(3)
  })

  test('tools/call: query curta demais e limit acima de 20 voltam como erro da tool', async () => {
    for (const args of [{ query: 'a' }, { query: 'deploy', limit: 21 }, { query: 'deploy', type: 'rascunho' }]) {
      const result = (await client.callTool({ name: 'search_content', arguments: args })) as CallToolResult
      expect(result.isError, JSON.stringify(args)).toBe(true)
    }
  })
})

test.describe('/mcp: borda HTTP', () => {
  const initialize = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'navegador', version: '0' } },
  }
  const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }

  test('Origin de outro site → 403 (DNS rebinding); o próprio domínio passa com CORS só para ele', async ({ request }) => {
    const denied = await request.post('/mcp', { headers: { ...headers, origin: 'https://evil.example' }, data: initialize })
    expect(denied.status()).toBe(403)
    expect(denied.headers()['access-control-allow-origin']).toBeUndefined()
    expect(await denied.json()).toMatchObject({ jsonrpc: '2.0', id: null, error: { code: -32000 } })
    const allowed = await request.post('/mcp', { headers: { ...headers, origin: 'https://whoisclebs.com' }, data: initialize })
    expect(allowed.status()).toBe(200)
    expect(allowed.headers()['access-control-allow-origin']).toBe('https://whoisclebs.com')
    expect(allowed.headers()['cache-control']).toBe('no-store')
  })

  test('cliente real com Origin proibido não conecta', async () => {
    const client = new Client({ name: 'e2e-origin', version: '1.0.0' })
    const transport = new StreamableHTTPClientTransport(new URL('/mcp', BASE), { requestInit: { headers: { origin: 'https://evil.example' } } })
    await expect(client.connect(transport)).rejects.toThrow(/origin not allowed/)
  })

  test('GET e DELETE → 405 (sem stream SSE nem sessões); corpo acima de 64 KiB → 413', async ({ request }) => {
    for (const method of ['GET', 'DELETE']) {
      const response = await request.fetch('/mcp', { method, headers: { accept: 'text/event-stream' } })
      expect(response.status(), method).toBe(405)
      expect(response.headers()['allow']).toBe('POST, OPTIONS')
    }
    const big = await request.post('/mcp', { headers, data: { ...initialize, params: { ...initialize.params, pad: 'x'.repeat(70 * 1024) } } })
    expect(big.status()).toBe(413)
  })
})
