import { describe, expect, it } from 'vitest'
import { resolveLegacyRedirect } from './redirects'

describe('resolveLegacyRedirect', () => {
  it.each([
    ['/about/', '/sobre/'],
    ['/about', '/sobre/'],
    ['/blog/', '/escrita/'],
    ['/blog/github-actions-como-fazer-deploy/', '/escrita/github-actions-como-fazer-deploy/'],
    ['/blog/github-actions-como-fazer-deploy', '/escrita/github-actions-como-fazer-deploy/'],
    ['/books/', '/livros/'],
    ['/portfolio/', '/projetos/'],
    ['/projects/', '/projetos/'],
    ['/projects/tuxedo/', '/projetos/tuxedo/'],
    ['/til/', '/notas/'],
    ['/til/docker-healthcheck-para-servicos/', '/notas/docker-healthcheck-para-servicos/'],
    ['/en/blog/', '/en/writing/'],
    ['/en/blog/strike-campus-party-digital-goias-2021/', '/en/writing/strike-campus-party-digital-goias-2021/'],
    ['/en/portfolio/', '/en/projects/'],
  ])('%s → %s', (from, to) => {
    expect(resolveLegacyRedirect(from)).toBe(to)
  })

  it.each(['/', '/sobre/', '/escrita/x/', '/en/about/', '/en/projects/tuxedo/', '/hobbies/', '/blog/a/b/', '/rss/blog.xml'])(
    'não redireciona %s',
    (path) => {
      expect(resolveLegacyRedirect(path)).toBeNull()
    },
  )
})
