import { createContentCatalog, type ContentCatalog } from '$lib/server/domain/content-catalog'
import { createMcpHandler } from '$lib/server/http/mcp-handler'
import { createFixedWindowLimiter } from '$lib/server/http/rate-limit'
import { MCP_SERVER_VERSION } from '$lib/server/mcp/server'
import { buildCatalogEntries } from '$lib/server/publishing/mcp-catalog'
import type { RequestHandler } from './$types'

// MCP somente leitura (Streamable HTTP, sem estado). Nunca prerenderizar; sem barra final: `/mcp`.
export const prerender = false
export const trailingSlash = 'never'

// Por isolate: o catálogo é montado uma vez (conteúdo do build) e o limite é best-effort (decisão 72).
let catalog: ContentCatalog | undefined
const handle = createMcpHandler({
  catalog: () => (catalog ??= createContentCatalog(buildCatalogEntries())),
  limiter: createFixedWindowLimiter({ limit: 60, windowMs: 60_000 }),
  version: MCP_SERVER_VERSION,
})

/** IP só como chave opaca do limite em memória; nunca logado nem persistido. */
function clientKey(getClientAddress: () => string): string {
  try {
    return getClientAddress() || 'unknown'
  } catch {
    return 'unknown'
  }
}

// `fallback` recebe todos os métodos: o handler decide POST/OPTIONS e responde 405 aos demais.
export const fallback: RequestHandler = ({ request, getClientAddress }) => handle(request, clientKey(getClientAddress))
