import { legalData } from '$lib/server/pages'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = () => legalData('terms', 'en')
