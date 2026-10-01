import { describe, expect, it } from 'vitest'
import events from '../../../../../tests/fixtures/github-events.json'
import { mapGitHubEvent, mapGitHubEvents } from './map-github-event'

const base = {
  id: '1',
  actor: { login: 'whoisclebs' },
  repo: { name: 'whoisclebs/tuxedo' },
  public: true,
  created_at: '2026-09-26T21:10:00Z',
}

describe('mapGitHubEvents (fixture)', () => {
  it('mapeia só eventos públicos de tipos publicáveis, com título legível e URL montada no github.com', () => {
    expect(mapGitHubEvents(events)).toEqual([
      {
        id: '50000000012',
        kind: 'push',
        title: 'Enviou commits para whoisclebs/tuxedo (main)',
        url: 'https://github.com/whoisclebs/tuxedo/commit/0123456789abcdef0123456789abcdef01234567',
        occurredAt: '2026-09-26T21:10:00Z',
      },
      {
        id: '50000000011',
        kind: 'release',
        title: 'Publicou a versão v0.4.0 de whoisclebs/tuxedo',
        url: 'https://github.com/whoisclebs/tuxedo/releases/tag/v0.4.0',
        occurredAt: '2026-09-26T20:00:00Z',
      },
      {
        id: '50000000010',
        kind: 'pull_request',
        title: 'Abriu o pull request #42 em go-golpher/golpher: Adiciona middleware de timeout',
        url: 'https://github.com/go-golpher/golpher/pull/42',
        occurredAt: '2026-09-25T15:30:00Z',
      },
      {
        id: '50000000009',
        kind: 'pull_request',
        title: 'Fez merge do pull request #40 em go-golpher/golpher',
        url: 'https://github.com/go-golpher/golpher/pull/40',
        occurredAt: '2026-09-25T12:00:00Z',
      },
      {
        id: '50000000008',
        kind: 'issue',
        title: 'Abriu a issue #7 em whoisclebs/rsgit: Suporte a pack files',
        url: 'https://github.com/whoisclebs/rsgit/issues/7',
        occurredAt: '2026-09-24T09:00:00Z',
      },
      {
        id: '50000000007',
        kind: 'create',
        title: 'Criou o repositório whoisclebs/seishin-engine',
        url: 'https://github.com/whoisclebs/seishin-engine',
        occurredAt: '2026-09-23T18:00:00Z',
      },
      {
        id: '50000000005',
        kind: 'star',
        title: 'Marcou sveltejs/kit com estrela',
        url: 'https://github.com/sveltejs/kit',
        occurredAt: '2026-09-22T10:00:00Z',
      },
      {
        // html_url da fonte (host estranho) é ignorada: a URL é sempre montada a partir do repositório.
        id: '50000000002',
        kind: 'release',
        title: 'Publicou a versão v0.3.0 de whoisclebs/tuxedo',
        url: 'https://github.com/whoisclebs/tuxedo/releases/tag/v0.3.0',
        occurredAt: '2026-09-20T09:00:00Z',
      },
    ])
  })

  it('recusa corpo que não é lista', () => {
    expect(() => mapGitHubEvents({ message: 'Not Found' })).toThrow(/lista/)
  })
})

describe('mapGitHubEvent', () => {
  it('descarta evento privado ou sem `public: true`', () => {
    const push = { ...base, type: 'PushEvent', payload: { ref: 'refs/heads/main', head: 'a'.repeat(40) } }
    expect(mapGitHubEvent({ ...push, public: false })).toBeNull()
    expect(mapGitHubEvent({ ...push, public: undefined })).toBeNull()
    expect(mapGitHubEvent(push)).not.toBeNull()
  })

  it('descarta tipos fora da lista (comentários, forks, membros, criação de branch)', () => {
    expect(mapGitHubEvent({ ...base, type: 'IssueCommentEvent', payload: { action: 'created' } })).toBeNull()
    expect(mapGitHubEvent({ ...base, type: 'ForkEvent', payload: {} })).toBeNull()
    expect(mapGitHubEvent({ ...base, type: 'MemberEvent', payload: { action: 'added' } })).toBeNull()
    expect(mapGitHubEvent({ ...base, type: 'CreateEvent', payload: { ref_type: 'branch', ref: 'x' } })).toBeNull()
  })

  it('descarta ações sem interesse público (labels, assign)', () => {
    expect(mapGitHubEvent({ ...base, type: 'PullRequestEvent', payload: { action: 'labeled', number: 1 } })).toBeNull()
    expect(mapGitHubEvent({ ...base, type: 'IssuesEvent', payload: { action: 'assigned', issue: { number: 1 } } })).toBeNull()
  })

  it('descarta nome de repositório ou ID inválido', () => {
    const star = { ...base, type: 'WatchEvent', payload: { action: 'started' } }
    expect(mapGitHubEvent({ ...star, repo: { name: 'evil.example/../x' } })).toBeNull()
    expect(mapGitHubEvent({ ...star, repo: { name: 'a/b/c' } })).toBeNull()
    expect(mapGitHubEvent({ ...star, id: 'abc' })).toBeNull()
    expect(mapGitHubEvent(null)).toBeNull()
  })

  it('usa o repositório quando o push não traz SHA válido', () => {
    const push = mapGitHubEvent({ ...base, type: 'PushEvent', payload: { ref: 'refs/tags/v1' } })
    expect(push).toMatchObject({ title: 'Enviou commits para whoisclebs/tuxedo', url: 'https://github.com/whoisclebs/tuxedo' })
  })

  it('cria tag com URL codificada', () => {
    const tag = mapGitHubEvent({ ...base, type: 'CreateEvent', payload: { ref_type: 'tag', ref: 'release/1.0' } })
    expect(tag).toMatchObject({
      kind: 'create',
      title: 'Criou a tag release/1.0 em whoisclebs/tuxedo',
      url: 'https://github.com/whoisclebs/tuxedo/releases/tag/release%2F1.0',
    })
  })
})
