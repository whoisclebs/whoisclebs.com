import { describe, expect, it } from 'vitest'
import events from '../../../../../tests/fixtures/github-events.json'
import { GitHubPublicActivitySource, type FetchLike } from './public-activity-source'

function recordingFetch(respond: (request: Request) => Response | Promise<Response>) {
  const requests: Request[] = []
  const fetch: FetchLike = async (input, init) => {
    const request = new Request(input, init)
    requests.push(request)
    return respond(request)
  }
  return { fetch, requests }
}

const json = (body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json', ...headers } })

describe('GitHubPublicActivitySource', () => {
  it('chama a API pública do usuário com cabeçalhos exigidos e sem token por padrão', async () => {
    const { fetch, requests } = recordingFetch(() => json(events, { etag: 'W/"abc"' }))
    const source = new GitHubPublicActivitySource({ username: 'whoisclebs', fetch })
    const result = await source.fetchRecent({ etag: null })

    const [request] = requests
    expect(request?.url).toBe('https://api.github.com/users/whoisclebs/events/public?per_page=30')
    expect(request?.headers.get('accept')).toBe('application/vnd.github+json')
    expect(request?.headers.get('user-agent')).toMatch(/whoisclebs/)
    expect(request?.headers.get('x-github-api-version')).toBe('2022-11-28')
    expect(request?.headers.has('authorization')).toBe(false)
    expect(request?.headers.has('if-none-match')).toBe(false)
    expect(result).toMatchObject({ status: 'ok', etag: 'W/"abc"' })
    expect(result.status === 'ok' && result.items).toHaveLength(8)
  })

  it('envia If-None-Match e devolve not-modified no 304', async () => {
    const { fetch, requests } = recordingFetch(() => new Response(null, { status: 304 }))
    const source = new GitHubPublicActivitySource({ username: 'whoisclebs', fetch })
    expect(await source.fetchRecent({ etag: 'W/"abc"' })).toEqual({ status: 'not-modified' })
    expect(requests[0]?.headers.get('if-none-match')).toBe('W/"abc"')
  })

  it('usa o token opcional como Bearer', async () => {
    const { fetch, requests } = recordingFetch(() => json([]))
    await new GitHubPublicActivitySource({ username: 'whoisclebs', token: 'segredo', fetch }).fetchRecent({ etag: null })
    expect(requests[0]?.headers.get('authorization')).toBe('Bearer segredo')
  })

  it('lança erro resumido em HTTP inesperado, sem vazar o token', async () => {
    const { fetch } = recordingFetch(() => new Response('rate limited', { status: 403 }))
    const source = new GitHubPublicActivitySource({ username: 'whoisclebs', token: 'segredo', fetch })
    const error = await source.fetchRecent({ etag: null }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe('GitHub respondeu HTTP 403')
  })

  it('lança erro em JSON inválido', async () => {
    const { fetch } = recordingFetch(() => new Response('<html>', { status: 200 }))
    await expect(new GitHubPublicActivitySource({ username: 'whoisclebs', fetch }).fetchRecent({ etag: null })).rejects.toThrow(/JSON/)
  })

  it('aborta por timeout', async () => {
    const fetch: FetchLike = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
      })
    const source = new GitHubPublicActivitySource({ username: 'whoisclebs', fetch, timeoutMs: 20 })
    await expect(source.fetchRecent({ etag: null })).rejects.toThrow('GitHub não respondeu em 20 ms')
  })

  it('recusa username inválido e base de API que não seja https (exceto loopback para testes locais)', () => {
    const { fetch } = recordingFetch(() => json([]))
    expect(() => new GitHubPublicActivitySource({ username: '../x', fetch })).toThrow()
    expect(() => new GitHubPublicActivitySource({ username: 'whoisclebs', fetch, apiBase: 'http://evil.example' })).toThrow()
    expect(() => new GitHubPublicActivitySource({ username: 'whoisclebs', fetch, apiBase: 'http://127.0.0.1:8790' })).not.toThrow()
  })
})
