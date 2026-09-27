import type { PublicActivityItem } from '../../domain/public-activity'

/**
 * Tradução de eventos da API pública do GitHub (`GET /users/{user}/events/public`) para itens de atividade.
 *
 * Publicáveis: PushEvent, CreateEvent (repositório e tag), ReleaseEvent (published), PullRequestEvent
 * (opened, reopened, closed, merged), IssuesEvent (opened, reopened, closed) e WatchEvent (estrela).
 * Descartados: qualquer evento sem `public: true`, criação/remoção de branch, comentários, reviews, forks,
 * membros, wiki e ações de rótulo/atribuição — ruído ou contexto de terceiros sem valor para o visitante.
 * URLs nunca vêm da fonte: são montadas a partir do nome do repositório validado, sempre em github.com.
 * Títulos não trazem contagens (a API não informa número de commits de forma confiável).
 */

type Json = Record<string, unknown>

const REPO_NAME = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/
const EVENT_ID = /^\d{1,30}$/
const SHA = /^[0-9a-f]{40}$/

const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value)
const str = (value: unknown): string | null => (typeof value === 'string' && value.trim() !== '' ? value.trim() : null)
const int = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null

const repoUrl = (repo: string) => `https://github.com/${repo}`
const tagUrl = (repo: string, tag: string) => `${repoUrl(repo)}/releases/tag/${encodeURIComponent(tag)}`
const withTitle = (text: string, extra: string | null) => (extra ? `${text}: ${extra}` : text)

type Mapped = Pick<PublicActivityItem, 'kind' | 'title' | 'url'>

function mapPayload(type: string, repo: string, payload: Json): Mapped | null {
  switch (type) {
    case 'PushEvent': {
      const ref = str(payload.ref)
      const branch = ref?.startsWith('refs/heads/') ? ref.slice('refs/heads/'.length) : null
      const head = str(payload.head)
      return {
        kind: 'push',
        title: `Enviou commits para ${repo}${branch ? ` (${branch})` : ''}`,
        url: head && SHA.test(head) ? `${repoUrl(repo)}/commit/${head}` : repoUrl(repo),
      }
    }
    case 'CreateEvent': {
      if (payload.ref_type === 'repository') return { kind: 'create', title: `Criou o repositório ${repo}`, url: repoUrl(repo) }
      const tag = payload.ref_type === 'tag' ? str(payload.ref) : null
      return tag ? { kind: 'create', title: `Criou a tag ${tag} em ${repo}`, url: tagUrl(repo, tag) } : null
    }
    case 'ReleaseEvent': {
      const release = isObject(payload.release) ? payload.release : {}
      const tag = str(release.tag_name)
      if (payload.action !== 'published' || !tag) return null
      return { kind: 'release', title: `Publicou a versão ${str(release.name) ?? tag} de ${repo}`, url: tagUrl(repo, tag) }
    }
    case 'PullRequestEvent': {
      const pr = isObject(payload.pull_request) ? payload.pull_request : {}
      const number = int(payload.number) ?? int(pr.number)
      if (!number) return null
      const merged = payload.action === 'merged' || (payload.action === 'closed' && pr.merged === true)
      const verb = merged
        ? 'Fez merge do'
        : ({ opened: 'Abriu o', reopened: 'Reabriu o', closed: 'Fechou o' } as Record<string, string>)[String(payload.action)]
      if (!verb) return null
      return {
        kind: 'pull_request',
        title: withTitle(`${verb} pull request #${number} em ${repo}`, str(pr.title)),
        url: `${repoUrl(repo)}/pull/${number}`,
      }
    }
    case 'IssuesEvent': {
      const issue = isObject(payload.issue) ? payload.issue : {}
      const number = int(issue.number)
      const verb = ({ opened: 'Abriu a', reopened: 'Reabriu a', closed: 'Fechou a' } as Record<string, string>)[String(payload.action)]
      if (!number || !verb) return null
      return { kind: 'issue', title: withTitle(`${verb} issue #${number} em ${repo}`, str(issue.title)), url: `${repoUrl(repo)}/issues/${number}` }
    }
    case 'WatchEvent':
      return payload.action === 'started' ? { kind: 'star', title: `Marcou ${repo} com estrela`, url: repoUrl(repo) } : null
    default:
      return null
  }
}

export function mapGitHubEvent(event: unknown): PublicActivityItem | null {
  if (!isObject(event) || event.public !== true) return null
  const id = typeof event.id === 'string' || typeof event.id === 'number' ? String(event.id) : ''
  const repo = isObject(event.repo) ? str(event.repo.name) : null
  const type = str(event.type)
  const occurredAt = str(event.created_at)
  if (!EVENT_ID.test(id) || !repo || !REPO_NAME.test(repo) || repo.includes('..') || !type || !occurredAt) return null
  if (Number.isNaN(Date.parse(occurredAt))) return null
  const mapped = mapPayload(type, repo, isObject(event.payload) ? event.payload : {})
  return mapped ? { id, ...mapped, occurredAt } : null
}

export function mapGitHubEvents(body: unknown): PublicActivityItem[] {
  if (!Array.isArray(body)) throw new Error('GitHub: resposta inesperada (esperava uma lista de eventos)')
  return body.flatMap((event) => mapGitHubEvent(event) ?? [])
}
