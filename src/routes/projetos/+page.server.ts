import { projectsData } from '$lib/server/pages'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = () => projectsData('pt-BR')
