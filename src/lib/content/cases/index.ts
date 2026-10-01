/**
 * Estudos de caso publicados, na ordem da home. Validados no carregamento: link fora de
 * github.com/whoisclebs.com, trecho sem permalink fixado, diagrama ou trechos fora de uma seção, ou
 * medição sem ambiente derrubam o build.
 */
import { z } from 'zod'
import { caseStudySchema, type CaseStudy } from '../case-schema.ts'
import { golpherCase } from './golpher.ts'
import { tuxedoCase } from './tuxedo.ts'

export const caseStudies: CaseStudy[] = z.array(caseStudySchema).parse([tuxedoCase, golpherCase])

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.slug === slug)
}
