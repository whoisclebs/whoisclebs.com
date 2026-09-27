import { aboutData } from '$lib/server/pages'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = () => aboutData('en')
