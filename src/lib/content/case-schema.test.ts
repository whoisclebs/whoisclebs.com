import { describe, expect, it } from 'vitest'
import { CASE_SECTION_IDS, caseStudySchema, isAllowedSourceUrl, type CaseStudyInput } from './case-schema'
import { caseStudies } from './cases/index'

const SHA = 'a'.repeat(40)

function validCase(): CaseStudyInput {
  const source = { label: 'client.go', url: `https://github.com/whoisclebs/tuxedo/blob/${SHA}/client.go#L41-L71` }
  return {
    slug: 'tuxedo',
    title: 'Um cliente HTTP encadeável sem dependências',
    dek: 'Resumo.',
    question: 'Como encurtar chamadas HTTP em Go sem trazer dependências?',
    checkedAt: '2026-09-27',
    revision: { sha: SHA, date: '2025-03-04', url: `https://github.com/whoisclebs/tuxedo/commit/${SHA}` },
    sections: CASE_SECTION_IDS.map((id) => ({ id, voice: 'fonte' as const, body: ['Texto.'], sources: [source] })),
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
    measurements: [
      {
        what: 'Testes do repositório',
        command: 'go test -count=1 ./...',
        environment: 'Go 1.26.4 linux/amd64',
        date: '2026-09-27',
        result: 'PASS',
        source,
      },
    ],
  }
}

describe('caseStudySchema', () => {
  it('aceita um case completo com fonte em todas as seções', () => {
    expect(caseStudySchema.safeParse(validCase()).success).toBe(true)
  })

  it('falha quando uma seção não tem fonte', () => {
    const input = validCase()
    input.sections[3] = { ...input.sections[3]!, sources: [] }
    const result = caseStudySchema.safeParse(input)
    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error?.issues)).toContain('sources')
  })

  it('falha quando falta uma seção ou a ordem muda', () => {
    const missing = validCase()
    missing.sections = missing.sections.filter((section) => section.id !== 'alternativas')
    expect(caseStudySchema.safeParse(missing).success).toBe(false)

    const swapped = validCase()
    const [first, second, ...rest] = swapped.sections
    swapped.sections = [second!, first!, ...rest]
    expect(caseStudySchema.safeParse(swapped).success).toBe(false)
  })

  it('recusa fonte fora do GitHub https ou do próprio site', () => {
    for (const url of ['http://github.com/whoisclebs/tuxedo', 'https://example.com/x', 'https://pkg.go.dev/github.com/whoisclebs/tuxedo', 'https://github.com.evil.io/x']) {
      const input = validCase()
      input.sections[0] = { ...input.sections[0]!, sources: [{ label: 'x', url }] }
      expect(caseStudySchema.safeParse(input).success, url).toBe(false)
    }
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
  })

  it('exige método, ambiente e data em toda medição', () => {
    const input = validCase()
    const { environment: _environment, ...withoutEnvironment } = input.measurements[0]!
    input.measurements[0] = withoutEnvironment as CaseStudyInput['measurements'][number]
    expect(caseStudySchema.safeParse(input).success).toBe(false)
  })
})

describe('isAllowedSourceUrl', () => {
  it('aceita github.com e whoisclebs.com em https', () => {
    expect(isAllowedSourceUrl('https://github.com/go-golpher/golpher/issues/22')).toBe(true)
    expect(isAllowedSourceUrl('https://whoisclebs.com/notas/x/')).toBe(true)
    expect(isAllowedSourceUrl('https://raw.githubusercontent.com/x')).toBe(false)
  })
})

describe('cases publicados', () => {
  it('tuxedo é o primeiro case e todos passam no schema', () => {
    expect(caseStudies[0]?.slug).toBe('tuxedo')
    for (const study of caseStudies) expect(caseStudySchema.safeParse(study).success, study.slug).toBe(true)
  })

  it('todas as URLs de fonte são https no github.com ou no próprio site', () => {
    const urls = caseStudies.flatMap((study) => [
      study.revision.url,
      ...study.sections.flatMap((section) => section.sources.map((source) => source.url)),
      ...study.architecture.nodes.map((node) => node.source.url),
      ...study.snippets.map((snippet) => snippet.url),
      ...study.measurements.map((measurement) => measurement.source.url),
    ])
    expect(urls.length).toBeGreaterThan(20)
    for (const url of urls) expect(isAllowedSourceUrl(url), url).toBe(true)
  })

  it('análise do autor fica marcada nas seções que não têm histórico escrito', () => {
    const tuxedo = caseStudies.find((study) => study.slug === 'tuxedo')
    expect(tuxedo?.sections.find((section) => section.id === 'mudaria')?.voice).toBe('analise')
  })
})
