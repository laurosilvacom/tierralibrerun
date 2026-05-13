import { type UserIdentity } from 'convex/server'

type AuthContext = {
	auth: {
		getUserIdentity: () => Promise<UserIdentity | null>
	}
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
	.split(',')
	.map((value) => value.trim().toLowerCase())
	.filter(Boolean)

export async function requireIdentity(ctx: AuthContext) {
	const identity = await ctx.auth.getUserIdentity()
	if (!identity) {
		throw new Error('Not authenticated')
	}
	return identity
}

export function identityEmail(identity: UserIdentity) {
	return typeof identity.email === 'string' ? identity.email.trim().toLowerCase() : undefined
}

export function identityRole(identity: UserIdentity) {
	return typeof identity.role === 'string' ? identity.role : undefined
}

export function isAdminReader(identity: UserIdentity) {
	const email = identityEmail(identity)
	const role = identityRole(identity)
	return (
		(email ? ADMIN_EMAILS.includes(email) : false) ||
		role === 'admin' ||
		role === 'admin_readonly'
	)
}

export function isAdminWriter(identity: UserIdentity) {
	const email = identityEmail(identity)
	const role = identityRole(identity)
	return (email ? ADMIN_EMAILS.includes(email) : false) || role === 'admin'
}

export async function requireAdminReader(ctx: AuthContext) {
	const identity = await requireIdentity(ctx)
	if (!isAdminReader(identity)) {
		throw new Error('Forbidden')
	}
	return identity
}

export async function requireAdminWriter(ctx: AuthContext) {
	const identity = await requireIdentity(ctx)
	if (!isAdminWriter(identity)) {
		throw new Error('Forbidden')
	}
	return identity
}
