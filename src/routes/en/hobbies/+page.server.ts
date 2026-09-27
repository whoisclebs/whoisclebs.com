import { hobbiesData } from '$lib/server/pages'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = () => hobbiesData('en')
