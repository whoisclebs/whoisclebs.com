/**
 * Corpos de `/api/activity` para e2e e snapshots do rodapé (passo 11). Dados de fixture: repositórios
 * `whoisclebs/exemplo-*` não existem; servem só para desenhar e testar os estados fresh/stale/vazio.
 */

const MINUTE = 60_000

/** @param {'fresh' | 'stale'} status @param {Date} now */
export function activityBody(status, now = new Date(), { empty = false } = {}) {
  const at = (/** @type {number} */ minutes) => new Date(now.getTime() - minutes * MINUTE).toISOString()
  const updatedAt = status === 'fresh' ? at(12) : at(3 * 24 * 60 + 90)
  const base = status === 'fresh' ? 0 : 3 * 24 * 60 + 90
  const items = [
    { id: 'f1', kind: 'push', title: 'Enviou commits para whoisclebs/exemplo-a (main)', url: 'https://github.com/whoisclebs/exemplo-a', occurredAt: at(base + 40) },
    { id: 'f2', kind: 'release', title: 'Publicou a versão v0.3.0 de whoisclebs/exemplo-b', url: 'https://github.com/whoisclebs/exemplo-b/releases/tag/v0.3.0', occurredAt: at(base + 5 * 60) },
    { id: 'f3', kind: 'pull_request', title: 'Abriu o pull request #12 em whoisclebs/exemplo-a: separar a política de nova tentativa do cliente', url: 'https://github.com/whoisclebs/exemplo-a/pull/12', occurredAt: at(base + 26 * 60) },
    { id: 'f4', kind: 'issue', title: 'Fechou a issue #7 em whoisclebs/exemplo-c', url: 'https://github.com/whoisclebs/exemplo-c/issues/7', occurredAt: at(base + 3 * 24 * 60) },
    { id: 'f5', kind: 'create', title: 'Criou o repositório whoisclebs/exemplo-c', url: 'https://github.com/whoisclebs/exemplo-c', occurredAt: at(base + 6 * 24 * 60) },
    { id: 'f6', kind: 'star', title: 'Marcou com estrela whoisclebs/exemplo-d', url: 'https://github.com/whoisclebs/exemplo-d', occurredAt: at(base + 8 * 24 * 60) },
  ]
  return { source: 'github', updatedAt, status, items: empty ? [] : items }
}

export const unavailableBody = {
  source: 'github',
  status: 'unavailable',
  updatedAt: null,
  items: [],
  message: 'Atividade pública indisponível no momento.',
}
