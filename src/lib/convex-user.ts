import 'server-only'

import { auth } from '@clerk/nextjs/server'
import { fetchMutation } from 'convex/nextjs'
import { api } from '@/convex/_generated/api'

export async function ensureConvexUserForCurrentSession() {
	const { userId, getToken } = await auth()
	if (!userId) return null

	const token = await getToken({ template: 'convex' })
	if (!token) {
		throw new Error('Missing Convex auth token for signed-in Clerk session')
	}

	return await fetchMutation(api.users.getOrCreate, {}, { token })
}
