import { homeData } from '$lib/server/pages'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = () => homeData('pt-BR')
