/**
 * Authentication helpers for server-side use.
 *
 * Admin access: determined by ADMIN_EMAILS env var or Clerk publicMetadata.role === 'admin'.
 * User records: managed in Convex via api.users.* — Clerk is authentication only.
 */
import 'server-only'

import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { normalizeInternalPath } from '@/lib/routing'

// ─── Admin ────────────────────────────────────────────────────────────────────

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
	.split(',')
	.map((e) => e.trim().toLowerCase())
	.filter(Boolean)

function emailIsAdmin(email: string | undefined): boolean {
	return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
}

/** Returns true for any admin (full or read-only). Use to guard /admin page access. */
export async function isAdmin(): Promise<boolean> {
	try {
		const user = await currentUser()
		if (!user) return false
		const email = user.emailAddresses?.[0]?.emailAddress
		const role = user.publicMetadata?.role as string | undefined
		return emailIsAdmin(email) || role === 'admin' || role === 'admin_readonly'
	} catch {
		return false
	}
}

/** Returns true for full admins only. Use to guard write operations. */
export async function isAdminWriter(): Promise<boolean> {
	try {
		const user = await currentUser()
		if (!user) return false
		const email = user.emailAddresses?.[0]?.emailAddress
		const role = user.publicMetadata?.role as string | undefined
		return emailIsAdmin(email) || role === 'admin'
	} catch {
		return false
	}
}

/** Throw if the current user is not a full admin. Use in server actions. */
export async function requireAdmin() {
	const user = await currentUser()
	if (!user) throw new Error('Unauthorized')
	const email = user.emailAddresses?.[0]?.emailAddress
	const role = user.publicMetadata?.role as string | undefined
	if (!emailIsAdmin(email) && role !== 'admin') throw new Error('Forbidden')
	return user
}

// ─── User ─────────────────────────────────────────────────────────────────────

/** Require a Clerk session. Redirects to sign-in if absent. Returns Clerk userId. */
export async function requireAuth(params?: { next?: string; redirectTo?: string }) {
	const { userId } = await auth()
	if (userId) return userId

	const redirectTo = params?.redirectTo ?? '/?auth=sign-in'
	const next = normalizeInternalPath(params?.next)

	if (next) {
		const joiner = redirectTo.includes('?') ? '&' : '?'
		redirect(`${redirectTo}${joiner}redirect_url=${encodeURIComponent(next)}`)
	}

	redirect(redirectTo)
}
