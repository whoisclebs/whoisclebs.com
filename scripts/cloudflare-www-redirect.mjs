/**
 * scripts/cloudflare-www-redirect.mjs
 *
 * Cria (ou substitui) a Redirect Rule da zona whoisclebs.com: www.whoisclebs.com → whoisclebs.com, 301, mantendo
 * caminho e query. Idempotente: o PUT no entrypoint da fase troca o conjunto de regras inteiro por este.
 * Os arquivos prerenderizados são servidos antes do Worker, então esse redirecionamento não cabe em `hooks.server.ts`.
 *
 * Uso: CLOUDFLARE_API_TOKEN=... node scripts/cloudflare-www-redirect.mjs
 *      (token com Zone Rulesets: Edit na zona; o id da zona vem de CLOUDFLARE_ZONE_ID ou é buscado pelo nome)
 */
const token = process.env.CLOUDFLARE_API_TOKEN
if (!token) {
  console.error('Defina CLOUDFLARE_API_TOKEN.')
  process.exit(1)
}

const API = 'https://api.cloudflare.com/client/v4'
const ZONE_NAME = 'whoisclebs.com'

async function call(method, path, body) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await response.json()
  if (!json.success) throw new Error(`${method} ${path}: ${(json.errors ?? []).map((error) => error.message).join('; ') || response.status}`)
  return json.result
}

const zoneId = process.env.CLOUDFLARE_ZONE_ID ?? (await call('GET', `/zones?name=${ZONE_NAME}`))[0]?.id
if (!zoneId) throw new Error(`Zona ${ZONE_NAME} não encontrada para este token.`)

await call('PUT', `/zones/${zoneId}/rulesets/phases/http_request_dynamic_redirect/entrypoint`, {
  rules: [
    {
      action: 'redirect',
      description: `www.${ZONE_NAME} -> ${ZONE_NAME} (301, mantém caminho e query)`,
      expression: `(http.host eq "www.${ZONE_NAME}")`,
      action_parameters: {
        from_value: {
          status_code: 301,
          preserve_query_string: true,
          target_url: { expression: `concat("https://${ZONE_NAME}", http.request.uri.path)` },
        },
      },
    },
  ],
})
console.log(`Redirect Rule aplicada na zona ${ZONE_NAME}.`)
