import { noteData, noteEntries } from '$lib/server/pages'
import type { EntryGenerator, PageServerLoad } from './$types'

export const entries: EntryGenerator = () => noteEntries()

export const load: PageServerLoad = ({ params }) => noteData(params.slug)
