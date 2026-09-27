import { topicData, topicEntries } from '$lib/server/pages'
import type { EntryGenerator, PageServerLoad } from './$types'

export const entries: EntryGenerator = () => topicEntries('pt-BR')

export const load: PageServerLoad = ({ params }) => topicData(params.slug, 'pt-BR')
