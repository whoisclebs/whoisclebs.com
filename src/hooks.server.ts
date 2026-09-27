import type { Handle, HandleServerError } from '@sveltejs/kit'
import { localeFromPath } from '$lib/i18n'
import { LEGACY_REDIRECT_STATUS, resolveLegacyRedirect } from '$lib/routing/redirects'

/** Cabeçalhos para respostas dinâmicas do Worker; assets estáticos usam `static/_headers`. */
const securityHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

export const handle: Handle = async ({ event, resolve }) => {
  const target = resolveLegacyRedirect(event.url.pathname)
  if (target) {
    return new Response(null, {
      status: LEGACY_REDIRECT_STATUS,
      headers: { location: `${target}${event.url.search}`, 'cache-control': 'public, max-age=86400', ...securityHeaders },
    })
  }

  const lang = localeFromPath(event.url.pathname)
  const response = await resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%lang%', lang),
  })
  if (!event.isSubRequest) {
    try {
      for (const [name, value] of Object.entries(securityHeaders)) {
        if (!response.headers.has(name)) response.headers.set(name, value)
      }
    } catch {
      // Respostas com cabeçalhos imutáveis (ex.: fetch repassado) seguem como vieram.
    }
  }
  return response
}

/** 404 é resposta esperada (rota inexistente); só erros reais vão para o log do Worker. */
export const handleError: HandleServerError = ({ error, status }) => {
  if (status !== 404) console.error(error)
}
