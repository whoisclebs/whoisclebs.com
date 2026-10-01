import { describe, expect, it } from 'vitest'
import { caseStudySchema, inlineLinks, isAllowedSourceUrl, type CaseStudyInput } from './case-schema'
import { caseStudies } from './cases/index'

const SHA = 'a'.repeat(40)
const LINK = `https://github.com/whoisclebs/tuxedo/blob/${SHA}/client.go#L41-L71`

function validCase(): CaseStudyInput {
  const source = { label: 'client.go', url: LINK }
  return {
    slug: 'tuxedo',
    title: 'Um cliente HTTP encadeável',
    dek: 'Resumo.',
    checkedAt: '2026-10-01',
    revision: { sha: SHA, date: '2025-03-04', url: `https://github.com/whoisclebs/tuxedo/commit/${SHA}` },
    sections: [
      { id: 'por-que-existe', title: 'Por que existe', body: [`Escrevi o [\`execute\`](${LINK}) uma vez.`] },
      { id: 'como-funciona', title: 'Como funciona', body: ['Texto.'], figures: ['architecture'] },
      { id: 'testes', title: 'Testes', body: ['Um teste.'], figures: ['measurements'] },
      { id: 'trechos', title: 'Trechos', body: [], figures: ['snippets'] },
    ],
    architecture: {
      caption: 'Fluxo de uma chamada.',
      nodes: [
        { label: 'Client', detail: 'Guarda o http.Client.', state: 'solid' as const, source },
        { label: 'Request', detail: 'Headers e body.', state: 'solid' as const, source },
      ],
    },
    snippets: [
      {
        title: 'execute',
        file: 'client.go',
        lines: [41, 42] as [number, number],
        lang: 'go' as const,
        url: `https://github.com/whoisclebs/tuxedo/blob/${SHA}/client.go#L41-L42`,
        code: 'func (r *Request) execute(method, url string) (*Response, error) {\n\treq, err := http.NewRequest(method, url, bytes.NewBuffer(r.body))',
        caption: 'Monta o http.Request.',
      },
    ],
    measurements: [{ command: 'go test -count=1 ./...', environment: 'Go 1.26.4 linux/amd64', date: '2026-10-01', result: 'passou' }],
  }
}

describe('caseStudySchema', () => {
  it('aceita títulos livres, seções sem fontes e links no corpo', () => {
    expect(caseStudySchema.safeParse(validCase()).success).toBe(true)
  })

  it('aceita seção com fontes opcionais, desde que no GitHub ou no próprio site', () => {
    const input = validCase()
    input.sections[0] = { ...input.sections[0]!, sources: [{ label: 'README', url: 'https://github.com/whoisclebs/tuxedo' }] }
    expect(caseStudySchema.safeParse(input).success).toBe(true)
  })

  it('recusa link no corpo, fonte ou diagrama fora do GitHub https ou do próprio site', () => {
    for (const url of ['http://github.com/whoisclebs/tuxedo', 'https://example.com/x', 'https://pkg.go.dev/github.com/whoisclebs/tuxedo', 'https://github.com.evil.io/x']) {
      const inBody = validCase()
      inBody.sections[0] = { ...inBody.sections[0]!, body: [`Veja [isto](${url}).`] }
      expect(caseStudySchema.safeParse(inBody).success, `corpo: ${url}`).toBe(false)

      const inSources = validCase()
      inSources.sections[0] = { ...inSources.sections[0]!, sources: [{ label: 'x', url }] }
      expect(caseStudySchema.safeParse(inSources).success, `fonte: ${url}`).toBe(false)

      const inNode = validCase()
      inNode.architecture.nodes[0] = { ...inNode.architecture.nodes[0]!, source: { label: 'x', url } }
      expect(caseStudySchema.safeParse(inNode).success, `diagrama: ${url}`).toBe(false)
    }
  })

  it('recusa id de seção repetido, seção vazia e título vazio', () => {
    const repeated = validCase()
    repeated.sections[1] = { ...repeated.sections[1]!, id: 'por-que-existe' }
    expect(caseStudySchema.safeParse(repeated).success).toBe(false)

    const empty = validCase()
    empty.sections[0] = { id: 'vazia', title: 'Vazia', body: [] }
    expect(caseStudySchema.safeParse(empty).success).toBe(false)

    const untitled = validCase()
    untitled.sections[0] = { ...untitled.sections[0]!, title: ' ' }
    expect(caseStudySchema.safeParse(untitled).success).toBe(false)
  })

  it('diagrama e trechos aparecem uma vez; medições só se houver medição', () => {
    const noDiagram = validCase()
    noDiagram.sections[1] = { ...noDiagram.sections[1]!, figures: [] }
    expect(caseStudySchema.safeParse(noDiagram).success).toBe(false)

    const twice = validCase()
    twice.sections[2] = { ...twice.sections[2]!, figures: ['measurements', 'snippets'] }
    expect(caseStudySchema.safeParse(twice).success).toBe(false)

    const noRuns = validCase()
    noRuns.measurements = []
    expect(caseStudySchema.safeParse(noRuns).success).toBe(false)
    noRuns.sections[2] = { ...noRuns.sections[2]!, figures: [] }
    expect(caseStudySchema.safeParse(noRuns).success).toBe(true)
  })

  it('exige trecho de código com link fixado num commit e nas mesmas linhas', () => {
    const branch = validCase()
    branch.snippets[0] = { ...branch.snippets[0]!, url: 'https://github.com/whoisclebs/tuxedo/blob/main/client.go#L41-L42' }
    expect(caseStudySchema.safeParse(branch).success).toBe(false)

    const wrongLines = validCase()
    wrongLines.snippets[0] = { ...wrongLines.snippets[0]!, url: `https://github.com/whoisclebs/tuxedo/blob/${SHA}/client.go#L1-L2` }
    expect(caseStudySchema.safeParse(wrongLines).success).toBe(false)

    const wrongCount = validCase()
    wrongCount.snippets[0] = { ...wrongCount.snippets[0]!, lines: [41, 45] }
    wrongCount.snippets[0].url = `https://github.com/whoisclebs/tuxedo/blob/${SHA}/client.go#L41-L45`
    expect(caseStudySchema.safeParse(wrongCount).success).toBe(false)

    const otherRevision = validCase()
    otherRevision.snippets[0] = { ...otherRevision.snippets[0]!, url: `https://github.com/whoisclebs/tuxedo/blob/${'b'.repeat(40)}/client.go#L41-L42` }
    expect(caseStudySchema.safeParse(otherRevision).success).toBe(false)
  })

  it('exige comando, ambiente e data em toda medição', () => {
    const input = validCase()
    const { environment: _environment, ...withoutEnvironment } = input.measurements[0]!
    input.measurements[0] = withoutEnvironment as CaseStudyInput['measurements'][number]
    expect(caseStudySchema.safeParse(input).success).toBe(false)
  })

  it('não aceita mais os campos do formato de laudo', () => {
    const withVoice = validCase()
    withVoice.sections[0] = { ...withVoice.sections[0]!, voice: 'analise' } as never
    expect(caseStudySchema.safeParse(withVoice).success).toBe(false)
  })
})

describe('isAllowedSourceUrl e inlineLinks', () => {
  it('aceita github.com e whoisclebs.com em https', () => {
    expect(isAllowedSourceUrl('https://github.com/go-golpher/golpher/issues/22')).toBe(true)
    expect(isAllowedSourceUrl('https://whoisclebs.com/notas/x/')).toBe(true)
    expect(isAllowedSourceUrl('https://raw.githubusercontent.com/x')).toBe(false)
  })

  it('acha os links [texto](url) de um parágrafo', () => {
    expect(inlineLinks('A [`R()`](https://github.com/a/b) e [c](https://whoisclebs.com/x/).')).toEqual([
      { label: '`R()`', url: 'https://github.com/a/b' },
      { label: 'c', url: 'https://whoisclebs.com/x/' },
    ])
  })
})

describe('cases publicados', () => {
  it('tuxedo é o primeiro case e todos passam no schema', () => {
    expect(caseStudies[0]?.slug).toBe('tuxedo')
    for (const study of caseStudies) expect(caseStudySchema.safeParse(study).success, study.slug).toBe(true)
  })

  it('todo link (corpo, fontes, diagrama, trechos) é https no github.com ou no próprio site', () => {
    const urls = caseStudies.flatMap((study) => [
      study.revision.url,
      ...study.sections.flatMap((section) => [...section.body.flatMap((paragraph) => inlineLinks(paragraph).map((link) => link.url)), ...(section.sources ?? []).map((source) => source.url)]),
      ...study.architecture.nodes.map((node) => node.source.url),
      ...study.snippets.map((snippet) => snippet.url),
    ])
    expect(urls.length).toBeGreaterThan(20)
    for (const url of urls) expect(isAllowedSourceUrl(url), url).toBe(true)
  })

  it('o texto não volta ao formato de laudo nem cita o simulador', () => {
    const text = JSON.stringify(caseStudies)
    for (const phrase of ['conferi em', 'Análise minha', 'O repositório não', 'simulador', 'demonstração', 'Resultado observado', 'Alternativas recusadas']) {
      expect(text, phrase).not.toContain(phrase)
    }
  })
})
