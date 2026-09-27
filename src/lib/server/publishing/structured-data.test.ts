import { describe, expect, it } from 'vitest'
import { socialLinks } from '$lib/content/library'
import { caseStudies } from '$lib/content/cases/index'
import { getProject, projects } from '$lib/content/projects'
import { FORBIDDEN_KEYS, REQUIRED_FIELDS } from '$lib/publishing/checks'
import { aboutData, articleData, homeData, noteData, projectData } from '$lib/server/pages'
import { breadcrumbNode, caseStudyNodes, personNode, softwareSourceCodeNode } from './structured-data'

const json = (value: unknown) => JSON.stringify(value)

describe('JSON-LD gerado do conteúdo', () => {
  it('Person usa só os perfis que o conteúdo lista em sameAs', () => {
    const person = personNode('pt-BR')
    expect(person.sameAs).toEqual(socialLinks.map((link) => link.href))
    expect(person.name).toBe('Clebson A. Fonseca')
    expect(person.jobTitle).toBe('Engenheiro de software sênior')
    expect(personNode('en').jobTitle).toBe('Senior software engineer')
  })

  it('home tem Person + WebSite; Sobre tem ProfilePage com mainEntity Person', () => {
    const home = homeData('pt-BR').seo.jsonLd as Array<Record<string, unknown>>
    expect(home.map((node) => node['@type'])).toEqual(['Person', 'WebSite'])
    const about = aboutData('pt-BR').seo.jsonLd as Record<string, unknown>
    expect(about['@type']).toBe('ProfilePage')
    expect((about.mainEntity as Record<string, unknown>)['@type']).toBe('Person')
    expect(about.name).toBe('Quem é Clebson?')
    expect(about.url).toBe('https://whoisclebs.com/sobre/')
  })

  it('artigo: BlogPosting com título, datas, idioma, canonical e autor + trilha até o artigo', async () => {
    const data = await articleData('github-actions-como-fazer-deploy', 'pt-BR')
    const [article, crumbs] = data.seo.jsonLd as Array<Record<string, unknown>>
    expect(article).toMatchObject({
      '@type': 'BlogPosting',
      headline: data.post.title,
      datePublished: data.post.date,
      inLanguage: 'pt-BR',
      url: 'https://whoisclebs.com/escrita/github-actions-como-fazer-deploy/',
      author: { '@type': 'Person', name: 'Clebson A. Fonseca' },
    })
    const items = (crumbs as { itemListElement: Array<Record<string, unknown>> }).itemListElement
    expect(items.map((item) => item.name)).toEqual(['Início', 'Escrita', data.post.title])
    expect(items.at(-1)?.item).toBe(article?.url)
  })

  it('nota: TechArticle em pt-BR', async () => {
    const data = await noteData('docker-healthcheck-para-servicos')
    const [note] = data.seo.jsonLd as Array<Record<string, unknown>>
    expect(note).toMatchObject({ '@type': 'TechArticle', headline: data.note.title, datePublished: data.note.date, inLanguage: 'pt-BR' })
  })

  it('case: TechArticle (título = H1) sobre um SoftwareSourceCode com repositório público; sem SoftwareApplication', () => {
    for (const study of caseStudies) {
      const project = getProject(study.slug)
      if (!project) throw new Error(study.slug)
      const [article, code] = caseStudyNodes(study, project, `/projetos/${study.slug}/`)
      expect(article).toMatchObject({ '@type': 'TechArticle', headline: study.title, dateModified: study.checkedAt })
      expect(code).toMatchObject({ '@type': 'SoftwareSourceCode', name: project.name, codeRepository: project.repo })
      expect((article?.about as Record<string, unknown>)['@id']).toBe(code?.['@id'])
    }
  })

  it('ficha sem case: SoftwareSourceCode + trilha; hreflang só quando não há case', async () => {
    const seishin = await projectData('seishin', 'en')
    expect((seishin.seo.jsonLd as Array<Record<string, unknown>>)[0]?.['@type']).toBe('SoftwareSourceCode')
    expect(seishin.seo.hreflang).toBe(true)
    const tuxedo = await projectData('tuxedo', 'pt-BR')
    expect(tuxedo.seo.hreflang).toBe(false)
    expect(tuxedo.seo.image).toBe('/og/tuxedo.png')
  })

  it('nenhum nó traz avaliação, preço, oferta ou emprego', async () => {
    const all = [homeData('pt-BR'), aboutData('en'), await articleData('github-actions-como-fazer-deploy', 'en'), ...(await Promise.all(projects.map((p) => projectData(p.slug, 'pt-BR'))))]
    for (const data of all) {
      const serialized = json(data.seo.jsonLd)
      for (const key of FORBIDDEN_KEYS) expect(serialized).not.toContain(`"${key}"`)
      expect(serialized).not.toContain('SoftwareApplication')
    }
  })

  it('todo tipo emitido tem regra de campos obrigatórios', () => {
    const project = projects[0]
    if (!project) throw new Error('sem projetos')
    for (const node of [personNode('pt-BR'), softwareSourceCodeNode(project, 'x', 'pt-BR'), breadcrumbNode('pt-BR', [{ name: 'A', path: '/a/' }])]) {
      expect(REQUIRED_FIELDS[node['@type'] as string]).toBeDefined()
    }
  })
})
