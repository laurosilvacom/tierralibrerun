import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import {
	requireAdminReader,
	requireAdminWriter,
	requireIdentity,
} from './auth'

function definedFields<T extends Record<string, unknown>>(fields: T): Partial<T> {
	return Object.fromEntries(
		Object.entries(fields).filter(([, value]) => value !== undefined),
	) as Partial<T>
}

// ─── Identity ────────────────────────────────────────────────────────────────
// Functions that operate on the current authenticated session.

/**
 * Get or create the user record for the current Clerk session.
 * Called on first page load — no onboarding required.
 */
export const getOrCreate = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await requireIdentity(ctx)

		const existing = await ctx.db
			.query('users')
			.withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
			.unique()

		if (existing) {
			await ctx.db.patch(existing._id, {
				email: identity.email ?? existing.email,
				updatedAt: Date.now(),
				...definedFields({
					name: identity.name ?? undefined,
					profileImageUrl: identity.pictureUrl ?? undefined,
				}),
			})
			return await ctx.db.get(existing._id)
		}

		const id = await ctx.db.insert('users', {
			clerkId: identity.subject,
			email: identity.email ?? '',
			fundApplicationLimitExempt: false,
			updatedAt: Date.now(),
			...definedFields({
				name: identity.name ?? undefined,
				profileImageUrl: identity.pictureUrl ?? undefined,
			}),
		})

		return await ctx.db.get(id)
	},
})

/** Get the current authenticated user — read-only. */
export const getCurrent = query({
	args: {},
	handler: async (ctx) => {
		const identity = await requireIdentity(ctx)

		return await ctx.db
			.query('users')
			.withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
			.unique()
	},
})

/** Look up a user by their Clerk ID. */
export const getByClerkId = query({
	args: { clerkId: v.string() },
	handler: async (ctx, { clerkId }) => {
		await requireAdminReader(ctx)

		return await ctx.db
			.query('users')
			.withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
			.unique()
	},
})

// ─── Admin queries ────────────────────────────────────────────────────────────

/** Admin: paginated list of all users, newest first. */
export const list = query({
	args: {
		paginationOpts: paginationOptsValidator,
		search: v.optional(v.string()),
	},
	handler: async (ctx, { paginationOpts, search }) => {
		await requireAdminReader(ctx)

		if (search) {
			return await ctx.db
				.query('users')
				.withSearchIndex('search_name_email', (q) => q.search('name', search))
				.paginate(paginationOpts)
		}
		return await ctx.db.query('users').order('desc').paginate(paginationOpts)
	},
})

/** Get a single user by Convex ID. */
export const getById = query({
	args: { id: v.id('users') },
	handler: async (ctx, { id }) => {
		await requireAdminReader(ctx)
		return await ctx.db.get(id)
	},
})

// ─── Admin mutations ──────────────────────────────────────────────────────────

/** Admin: toggle whether a user is exempt from the 6-month application limit. */
export const setLimitExempt = mutation({
	args: { userId: v.id('users'), exempt: v.boolean() },
	handler: async (ctx, { userId, exempt }) => {
		await requireAdminWriter(ctx)
		await ctx.db.patch(userId, { fundApplicationLimitExempt: exempt, updatedAt: Date.now() })
	},
})

/** Admin: delete a user and all their applications. */
export const remove = mutation({
	args: { id: v.id('users') },
	handler: async (ctx, { id }) => {
		await requireAdminWriter(ctx)
		const apps = await ctx.db
			.query('fundApplications')
			.withIndex('by_userId', (q) => q.eq('userId', id))
			.collect()

		for (const app of apps) {
			await ctx.db.delete(app._id)
		}

		await ctx.db.delete(id)
	},
})
