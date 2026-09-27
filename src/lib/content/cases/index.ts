/**
 * Estudos de caso publicados, na ordem da home. Validados no carregamento: seção sem fonte, fonte fora de
 * github.com/whoisclebs.com, trecho sem permalink fixado ou medição sem ambiente derrubam o build.
 */
import { z } from 'zod'
import { caseStudySchema, type CaseStudy } from '../case-schema.ts'
import { golpherCase } from './golpher.ts'
import { tuxedoCase } from './tuxedo.ts'

export const caseStudies: CaseStudy[] = z.array(caseStudySchema).parse([tuxedoCase, golpherCase])

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.slug === slug)
}
