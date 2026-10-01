import { projectData, projectEntries } from '$lib/server/pages'
import type { EntryGenerator, PageServerLoad } from './$types'

export const entries: EntryGenerator = () => projectEntries()

export const load: PageServerLoad = ({ params }) => projectData(params.slug, 'en')
