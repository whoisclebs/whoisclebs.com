/**
 * Commit publicado neste site, gravado no build (`__BUILD_SHA__`, ver `vite.config.ts`). O HUD da home mostra
 * os 7 primeiros caracteres em texto, com link para o commit; sem SHA, mostra "sem dado" e nenhum link.
 */
export const REPOSITORY_URL = 'https://github.com/whoisclebs/whoisclebs.com'

export interface BuildInfo {
  sha: string
  short: string
  url: string
}

export function buildInfo(sha: string = __BUILD_SHA__): BuildInfo | null {
  if (!/^[0-9a-f]{40}$/.test(sha)) return null
  return { sha, short: sha.slice(0, 7), url: `${REPOSITORY_URL}/commit/${sha}` }
}
