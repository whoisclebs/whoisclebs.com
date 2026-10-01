import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import { badges, socialLinks } from '$lib/content/library'
import { projects } from '$lib/content/projects'
import { buildResume } from './resume'

const require = createRequire(import.meta.url)
const { validate } = require('@jsonresume/schema') as { validate: (resume: unknown, callback: (errors: Array<{ property: string; message: string }> | null, valid: boolean) => void) => void }

function schemaErrors(resume: unknown): string[] {
  let result: string[] = []
  validate(resume, (errors) => {
    result = (errors ?? []).map((error) => `${error.property} ${error.message}`)
  })
  return result
}

describe('/resume.json (JSON Resume)', () => {
  const resume = buildResume()

  it('valida no schema oficial (@jsonresume/schema)', () => {
    expect(schemaErrors(resume)).toEqual([])
  })

  it('o validador reprova um currículo inválido (o teste não passa por vacuidade)', () => {
    expect(schemaErrors({ ...resume, basics: { ...resume.basics, email: 'não-é-email' } })).not.toEqual([])
    expect(schemaErrors({ ...resume, projects: [{ name: 'x', startDate: '27/09/2026' }] })).not.toEqual([])
  })

  it('tem as seções pedidas e deixa vazio o que o site não confirma', () => {
    expect(Object.keys(resume)).toEqual(expect.arrayContaining(['basics', 'work', 'education', 'skills', 'projects']))
    expect(resume.work).toEqual([])
    expect(resume.education).toEqual([])
    expect(resume.basics).not.toHaveProperty('phone')
    expect(resume.basics).not.toHaveProperty('location')
  })

  it('perfis, projetos e certificados vêm só do conteúdo', () => {
    expect(resume.basics.profiles.map((profile) => profile.url)).toEqual(socialLinks.map((link) => link.href))
    for (const profile of resume.basics.profiles) expect(profile.url).toContain(profile.username)
    expect(resume.projects.map((project) => project.url)).toEqual(projects.map((project) => project.repo))
    expect(resume.certificates.map((certificate) => certificate.url)).toEqual(badges.map((badge) => badge.url))
    expect(resume.skills.every((skill) => skill.keywords.length > 0)).toBe(true)
    expect(resume.meta.canonical).toBe('https://whoisclebs.com/resume.json')
  })
})
