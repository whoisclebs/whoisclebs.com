import { describe, expect, it } from 'vitest'
import { agentProjectIssues, agentProjects, loopSteps, techTopics, type AgentProject } from './agents'

describe('capítulo de agentes: status verdadeiro', () => {
  it('todo projeto em "produção" ou "protótipo" tem URL pública de código no GitHub', () => {
    for (const project of agentProjects.filter((p) => p.status === 'producao' || p.status === 'prototipo')) {
      expect(project.code?.url, project.slug).toMatch(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/)
      expect(project.lastCommit?.url, project.slug).toMatch(/^https:\/\/github\.com\/.+\/commit\/[0-9a-f]{40}$/)
    }
    expect(agentProjectIssues(agentProjects)).toEqual([])
  })

  it('recusa protótipo sem código e "sem código público" com URL', () => {
    const broken: AgentProject[] = [
      { slug: 'a', name: 'A', status: 'prototipo', summary: '', note: '', sources: [] },
      { slug: 'b', name: 'B', status: 'sem-codigo-publico', summary: '', note: '', code: { url: 'https://github.com/x/y', license: 'MIT' }, lastCommit: { sha: 'x', date: '2026-01-01', url: 'https://github.com/x/y/commit/x' }, sources: [] },
      { slug: 'c', name: 'C', status: 'producao', summary: '', note: '', code: { url: 'https://example.com/c', license: 'MIT' }, sources: [] },
    ]
    const issues = agentProjectIssues(broken)
    expect(issues.some((issue) => issue.startsWith('a:'))).toBe(true)
    expect(issues.some((issue) => issue.startsWith('b:'))).toBe(true)
    expect(issues.some((issue) => issue.startsWith('c:'))).toBe(true)
  })

  it('nenhum texto do capítulo traz número de benchmark (%, ×, Recall, MRR)', () => {
    const text = JSON.stringify({ agentProjects, loopSteps, techTopics })
    expect(text).not.toMatch(/\d+(,\d+)?\s?%|\d+\s?×|recall@|\bMRR\b/i)
  })

  it('níveis completos: cinco partes do laço e cinco tópicos técnicos com fonte', () => {
    expect(loopSteps.map((step) => step.id)).toEqual(['objetivo', 'contexto', 'acoes', 'avaliacao', 'observabilidade'])
    expect(techTopics.map((topic) => topic.id)).toEqual(['limites-de-contexto', 'memoria', 'permissoes', 'avaliacao', 'falhas'])
    for (const topic of techTopics) expect(topic.sources.length, topic.id).toBeGreaterThan(0)
  })
})
