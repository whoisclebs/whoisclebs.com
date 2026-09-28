import { readFileSync } from 'node:fs'
import { expect, test, type APIResponse } from '@playwright/test'

/**
 * Paridade de URLs: toda URL do inventário do site antigo (docs/redesign/url-inventory.json)
 * responde 200 ou redireciona com 301/308 direto para o destino novo esperado.
 * Mapa legível: docs/redesign/url-map.md. Fonte do mapa no código: src/lib/routing/redirects.ts.
 */
const inventory: string[] = JSON.parse(readFileSync('docs/redesign/url-inventory.json', 'utf8'))

const expectedRedirects: Record<string, string> = {
  '/about/': '/sobre/',
  '/blog/': '/escrita/',
  '/books/': '/livros/',
  '/portfolio/': '/projetos/',
  '/til/': '/notas/',
  '/til/docker-healthcheck-para-servicos/': '/notas/docker-healthcheck-para-servicos/',
  '/en/blog/': '/en/writing/',
  '/en/portfolio/': '/en/projects/',
}
for (const path of inventory) {
  const article = /^\/(en\/)?blog\/([a-z0-9-]+)\/$/.exec(path)
  if (article) expectedRedirects[path] = article[1] ? `/en/writing/${article[2]}/` : `/escrita/${article[2]}/`
  const project = /^\/projects\/([a-z0-9-]+)\/$/.exec(path)
  if (project) expectedRedirects[path] = `/projetos/${project[1]}/`
}

/** Caminhos com caracteres que o servidor de assets normaliza (`&` → `%26`) são pedidos já codificados. */
function requestPath(path: string): string {
  return path.split('/').map((segment) => encodeURIComponent(decodeURIComponent(segment))).join('/')
}

function location(response: APIResponse): string {
  const value = response.headers()['location'] ?? ''
  return new URL(value, 'http://placeholder').pathname
}

test('o inventário tem as 55 URLs da baseline', () => {
  expect(inventory).toHaveLength(55)
})

for (const path of inventory) {
  test(`URL legada ${path}`, async ({ request }) => {
    const response = await request.get(requestPath(path), { maxRedirects: 0 })
    const target = expectedRedirects[path]
    if (target) {
      expect([301, 308], `${path} deveria redirecionar`).toContain(response.status())
      expect(location(response)).toBe(target)
      const final = await request.get(target, { maxRedirects: 0 })
      expect(final.status(), `destino ${target}`).toBe(200)
    } else {
      expect(response.status(), `${path} deveria responder 200`).toBe(200)
      expect((await response.body()).byteLength).toBeGreaterThan(0)
    }
  })
}

test('caminho com & sem codificar chega ao mesmo arquivo', async ({ request }) => {
  const response = await request.get('/cover/d&d.png')
  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('image/png')
})

test('rota inexistente devolve 404 real com página própria', async ({ request, page }) => {
  const response = await request.get('/rota-que-nao-existe/', { maxRedirects: 0 })
  expect(response.status()).toBe(404)
  const html = await response.text()
  expect(html).toContain('<meta name="robots" content="noindex"')
  expect(html).not.toContain('rel="canonical"')

  const navigation = await page.goto('/en/nothing-here/')
  expect(navigation?.status()).toBe(404)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('404 Page not found')
})
