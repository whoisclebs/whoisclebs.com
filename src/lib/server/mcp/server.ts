/**
 * Adaptador do SDK MCP oficial (`@modelcontextprotocol/sdk`) sobre o catálogo puro do domínio: registra os
 * recursos (perfil, projetos, artigos, notas) e a tool `search_content`. Somente leitura: nenhuma tool
 * escreve, nenhuma consulta o D1. Um servidor novo por requisição (modo sem estado do transporte).
 */
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { McpError } from '@modelcontextprotocol/sdk/types.js'
import { CfWorkerJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/cfworker'
import { z } from 'zod'
import {
  CONTENT_TYPES,
  SEARCH_LIMIT_DEFAULT,
  SEARCH_LIMIT_MAX,
  SEARCH_QUERY_MAX,
  SEARCH_QUERY_MIN,
  type CatalogEntry,
  type ContentCatalog,
  type ContentType,
} from '../domain/content-catalog'

export const MCP_SERVER_VERSION = '1.0.0'

/** Código JSON-RPC de recurso inexistente na especificação MCP (server/resources, "Error Handling"). */
export const RESOURCE_NOT_FOUND = -32002

const INSTRUCTIONS =
  'Servidor somente leitura do site whoisclebs.com (Clebson Augusto). Os recursos são o mesmo conteúdo publicado nas páginas e em /llms-full.txt, em Markdown, com canonical, idioma e datas. Use search_content para achar itens por palavra-chave e resources/read para ler um item inteiro. A página HTML indicada em cada item é a fonte canônica.'

const TEMPLATES: Array<{ name: string; template: string; type: ContentType; title: string; description: string; prefix: string }> = [
  { name: 'project', template: 'whoisclebs://projects/{slug}', prefix: 'whoisclebs://projects/', type: 'project', title: 'Projeto', description: 'Estudo de caso (com fontes) ou ficha de projeto open source, em pt-BR.' },
  { name: 'article', template: 'whoisclebs://articles/{slug}', prefix: 'whoisclebs://articles/', type: 'article', title: 'Artigo (pt-BR)', description: 'Artigo de Escrita em português, com metadados e corpo em Markdown.' },
  { name: 'article-en', template: 'whoisclebs://en/articles/{slug}', prefix: 'whoisclebs://en/articles/', type: 'article', title: 'Article (en)', description: 'Writing article in English, with metadata and Markdown body.' },
  { name: 'note', template: 'whoisclebs://notes/{slug}', prefix: 'whoisclebs://notes/', type: 'note', title: 'Nota', description: 'Nota técnica curta, em pt-BR.' },
]

function listed(entry: CatalogEntry) {
  return { uri: entry.uri, name: entry.title, title: entry.title, description: entry.description, mimeType: entry.mimeType }
}

function contents(catalog: ContentCatalog, uri: string) {
  const entry = catalog.read(uri)
  if (!entry) throw new McpError(RESOURCE_NOT_FOUND, 'Resource not found', { uri })
  return { contents: [{ uri: entry.uri, mimeType: entry.mimeType, text: entry.text }] }
}

const hitSchema = z.object({
  uri: z.string(),
  type: z.enum(CONTENT_TYPES),
  title: z.string(),
  url: z.string(),
  locale: z.string(),
  date: z.string().optional(),
  snippet: z.string(),
})

export function createMcpServer(catalog: ContentCatalog, version: string): McpServer {
  const server = new McpServer(
    { name: 'whoisclebs', title: 'whoisclebs.com', version, websiteUrl: 'https://whoisclebs.com/' },
    // Sem Ajv (gera código com `new Function`, proibido no Workers): o validador do SDK para Workers.
    { instructions: INSTRUCTIONS, jsonSchemaValidator: new CfWorkerJsonSchemaValidator() },
  )

  const profile = catalog.list('profile')[0]
  if (profile) {
    server.registerResource('profile', profile.uri, { title: 'Perfil', description: profile.description, mimeType: profile.mimeType }, (uri) =>
      contents(catalog, uri.href),
    )
  }

  for (const template of TEMPLATES) {
    server.registerResource(
      template.name,
      new ResourceTemplate(template.template, {
        list: () => ({ resources: catalog.list(template.type).filter((entry) => entry.uri.startsWith(template.prefix)).map(listed) }),
      }),
      { title: template.title, description: template.description, mimeType: 'text/markdown' },
      (uri) => contents(catalog, uri.href),
    )
  }

  server.registerTool(
    'search_content',
    {
      title: 'Buscar no conteúdo publicado',
      description: `Busca por palavras-chave (sem diferenciar maiúsculas nem acentos; todos os termos precisam aparecer) no perfil, projetos, artigos e notas publicados. Devolve URI do recurso, página canônica e um trecho. Até ${SEARCH_LIMIT_MAX} resultados.`,
      inputSchema: {
        query: z.string().min(SEARCH_QUERY_MIN).max(SEARCH_QUERY_MAX).describe(`Palavras-chave (${SEARCH_QUERY_MIN} a ${SEARCH_QUERY_MAX} caracteres).`),
        type: z.enum(CONTENT_TYPES).optional().describe('Restringe a um tipo de conteúdo.'),
        limit: z.number().int().min(1).max(SEARCH_LIMIT_MAX).optional().describe(`Máximo de resultados (padrão ${SEARCH_LIMIT_DEFAULT}).`),
      },
      outputSchema: { query: z.string(), type: z.enum(CONTENT_TYPES).optional(), total: z.number().int(), results: z.array(hitSchema) },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    (args) => {
      const result = catalog.search(args)
      const lines = result.results.map((hit) => `- ${hit.title} (${hit.type}, ${hit.locale}${hit.date ? `, ${hit.date}` : ''}) ${hit.uri} — ${hit.url}\n  ${hit.snippet}`)
      const text = result.total === 0 ? `Nenhum resultado para "${result.query}".` : `${result.total} resultado(s) para "${result.query}":\n${lines.join('\n')}`
      return { content: [{ type: 'text', text }], structuredContent: { ...result } }
    },
  )

  return server
}
