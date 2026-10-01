import { articleData, articleEntries } from '$lib/server/pages'
import type { EntryGenerator, PageServerLoad } from './$types'

export const entries: EntryGenerator = () => articleEntries()

export const load: PageServerLoad = ({ params }) => articleData(params.slug, 'pt-BR')
