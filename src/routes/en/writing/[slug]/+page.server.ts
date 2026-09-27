import { articleData, articleEntriesEn } from '$lib/server/pages'
import type { EntryGenerator, PageServerLoad } from './$types'

export const entries: EntryGenerator = () => articleEntriesEn()

export const load: PageServerLoad = ({ params }) => articleData(params.slug, 'en')
