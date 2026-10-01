import { expect, test } from '@playwright/test'

/**
 * Smoke local do fluxo completo no Worker real (`wrangler dev`, D1 local migrado do zero):
 * cron → caso de uso → D1 → `GET /api/activity`. A API do GitHub é o servidor de fixture
 * (`tests/fixtures/github-fixture-server.mjs`), injetado por `--var GITHUB_API_BASE`.
 * `cache-control: no-cache` pula o Cache API do Worker gerado pelo adapter entre as leituras.
 */
const FIXTURE = 'http://127.0.0.1:8790'
const noCache = { 'cache-control': 'no-cache' }

test.describe.serial('/api/activity', () => {
  test('sem sincronização: 503 com JSON explicativo', async ({ request }) => {
    await request.post(`${FIXTURE}/__fixture/mode`, { data: 'ok' })
    const response = await request.get('/api/activity', { headers: noCache })
    expect(response.status()).toBe(503)
    expect(response.headers()['cache-control']).toBe('no-store')
    expect(await response.json()).toMatchObject({ source: 'github', status: 'unavailable', items: [] })
  })

  test('depois do cron: fresh, no máximo 10 itens, só https://github.com, ETag e 304', async ({ request }) => {
    expect((await request.get('/__scheduled?cron=*/30+*+*+*+*')).ok()).toBe(true)
    await expect
      .poll(async () => (await request.get('/api/activity', { headers: noCache })).status(), { timeout: 10_000 })
      .toBe(200)

    const response = await request.get('/api/activity', { headers: noCache })
    const body = await response.json()
    expect(body).toMatchObject({ source: 'github', status: 'fresh' })
    expect(Date.parse(body.updatedAt)).not.toBeNaN()
    expect(body.items.length).toBeGreaterThan(0)
    expect(body.items.length).toBeLessThanOrEqual(10)
    for (const item of body.items) {
      expect(Object.keys(item).sort()).toEqual(['id', 'kind', 'occurredAt', 'title', 'url'])
      expect(item.url).toMatch(/^https:\/\/github\.com\//)
    }
    expect(JSON.stringify(body)).not.toContain('segredo') // evento privado da fixture

    const etag = response.headers()['etag']
    expect(etag).toBeTruthy()
    expect(response.headers()['cache-control']).toMatch(/max-age=/)
    const revalidated = await request.get('/api/activity', { headers: { ...noCache, 'if-none-match': etag ?? '' } })
    expect(revalidated.status()).toBe(304)
  })

  test('GitHub falhando: mantém o cache e responde stale com a data do último sucesso', async ({ request }) => {
    const before = await (await request.get('/api/activity', { headers: noCache })).json()
    await request.post(`${FIXTURE}/__fixture/mode`, { data: 'fail' })
    expect((await request.get('/__scheduled?cron=*/30+*+*+*+*')).ok()).toBe(true)
    await expect
      .poll(async () => (await (await request.get('/api/activity', { headers: noCache })).json()).status, { timeout: 10_000 })
      .toBe('stale')

    const after = await (await request.get('/api/activity', { headers: noCache })).json()
    expect(after.updatedAt).toBe(before.updatedAt)
    expect(after.items).toEqual(before.items)
    await request.post(`${FIXTURE}/__fixture/mode`, { data: 'ok' })
  })
})
