import { composeActivityReader } from '$lib/server/compose'
import { createActivityHandler } from '$lib/server/http/activity-handler'
import type { RequestHandler } from './$types'

// Dado de requisição (cache no D1): nunca prerenderizar.
export const prerender = false

export const GET: RequestHandler = createActivityHandler(({ platform }) => composeActivityReader(platform?.env))
