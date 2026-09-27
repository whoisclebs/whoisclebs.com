import { topicData, topicEntries } from '$lib/server/pages'
import type { EntryGenerator, PageServerLoad } from './$types'

export const entries: EntryGenerator = () => topicEntries('en')

export const load: PageServerLoad = ({ params }) => topicData(params.slug, 'en')
