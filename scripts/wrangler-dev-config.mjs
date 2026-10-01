/**
 * scripts/wrangler-dev-config.mjs
 *
 * Gera `wrangler.dev.jsonc` (ignorado pelo git) a partir do `wrangler.jsonc` sem o que só vale em produção
 * (`routes`, `workers_dev`, `preview_urls`). Motivo: com `routes` na configuração, o `wrangler dev` reescreve o
 * cabeçalho `Origin` das requisições para o endereço local, o que quebra a checagem de origem do `/mcp` nos testes
 * (em produção o `Origin` chega intacto: conferido com curl contra whoisclebs.com). Os testes e o Lighthouse sobem o
 * `wrangler dev` com `--config wrangler.dev.jsonc`.
 *
 * Uso: node scripts/wrangler-dev-config.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'

const source = readFileSync('wrangler.jsonc', 'utf8')
// JSONC só com comentários de linha inteira (o arquivo não usa comentários no fim de linha nem em bloco).
const config = JSON.parse(source.replace(/^\s*\/\/.*$/gm, ''))
for (const key of ['routes', 'route', 'workers_dev', 'preview_urls']) delete config[key]
writeFileSync('wrangler.dev.jsonc', `// Gerado por scripts/wrangler-dev-config.mjs. Não edite.\n${JSON.stringify(config, null, 2)}\n`)
