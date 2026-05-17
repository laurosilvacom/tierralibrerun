import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import {
	isAdminReader,
	requireAdminReader,
	requireAdminWriter,
	requireIdentity,
} from './auth'

function definedFields<T extends Record<string, unknown>>(
	fields: T,
): Partial<T> {
	return Object.fromEntries(
		Object.entries(fields).filter(([, value]) => value !== undefined),
	) as Partial<T>
}

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * Admin: paginated list of all applications regardless of status.
 * `name` and `email` are denormalized onto the application at submit time,
 * so we never need to fetch the related user document for list rendering.
 */
export const listAll = query({
	args: { paginationOpts: paginationOptsValidator },
	handler: async (ctx, { paginationOpts }) => {
		await requireAdminReader(ctx)
		return await ctx.db
			.query('fundApplications')
			.order('desc')
			.paginate(paginationOpts)
	},
})

/** Admin: paginated list filtered by status. */
export const listByStatus = query({
	args: {
		status: v.union(
			v.literal('PENDING'),
			v.literal('APPROVED'),
			v.literal('DENIED'),
		),
		paginationOpts: paginationOptsValidator,
	},
	handler: async (ctx, { status, paginationOpts }) => {
		await requireAdminReader(ctx)
		return await ctx.db
			.query('fundApplications')
			.withIndex('by_status', (q) => q.eq('status', status))
			.order('desc')
			.paginate(paginationOpts)
	},
})

/** Admin: counts for all three statuses. */
export const counts = query({
	args: {},
	handler: async (ctx) => {
		await requireAdminReader(ctx)

		const [pending, approved, denied] = await Promise.all([
			ctx.db
				.query('fundApplications')
				.withIndex('by_status', (q) => q.eq('status', 'PENDING'))
				.collect(),
			ctx.db
				.query('fundApplications')
				.withIndex('by_status', (q) => q.eq('status', 'APPROVED'))
				.collect(),
			ctx.db
				.query('fundApplications')
				.withIndex('by_status', (q) => q.eq('status', 'DENIED'))
				.collect(),
		])
		return {
			pending: pending.length,
			approved: approved.length,
			denied: denied.length,
			total: pending.length + approved.length + denied.length,
		}
	},
})

/**
 * Admin + athlete: a single application.
 * `name` and `email` are denormalized onto the application at submit time,
 * so the related user document is not joined into the response.
 */
export const getById = query({
	args: { id: v.id('fundApplications') },
	handler: async (ctx, { id }) => {
		const identity = await requireIdentity(ctx)
		const app = await ctx.db.get(id)
		if (!app) return null

		if (!isAdminReader(identity)) {
			const currentUser = await ctx.db
				.query('users')
				.withIndex('by_clerkId', (q) =>
					q.eq('clerkId', identity.subject as string),
				)
				.unique()

			if (!currentUser || currentUser._id !== app.userId) {
				throw new Error('Forbidden')
			}
		}

		return {
			...app,
			user: isAdminReader(identity) ? await ctx.db.get(app.userId) : null,
		}
	},
})

/** Admin: all applications for a specific user. */
export const listByUser = query({
	args: { userId: v.id('users') },
	handler: async (ctx, { userId }) => {
		await requireAdminReader(ctx)

		return await ctx.db
			.query('fundApplications')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.order('desc')
			.collect()
	},
})

/** Athlete: their own applications. */
export const listMine = query({
	args: {},
	handler: async (ctx) => {
		const identity = await requireIdentity(ctx)

		const user = await ctx.db
			.query('users')
			.withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
			.unique()

		if (!user) return []

		return await ctx.db
			.query('fundApplications')
			.withIndex('by_userId', (q) => q.eq('userId', user._id))
			.order('desc')
			.collect()
	},
})

// ─── Mutations ───────────────────────────────────────────────────────────────

/**
 * Submit a new fund application.
 * Demographics are collected in the form itself — no separate onboarding step.
 */
export const submit = mutation({
	args: {
		age: v.number(),
		zipcode: v.string(),
		bipocIdentity: v.boolean(),
		genderIdentity: v.string(),
		referralSource: v.string(),
		race: v.string(),
		raceDate: v.optional(v.number()),
		raceLocation: v.optional(v.string()),
		firstRace: v.boolean(),
		experience: v.string(),
		reason: v.string(),
		goals: v.optional(v.string()),
		communityContribution: v.string(),
		tierraLibreContribution: v.optional(v.string()),
		additionalAssistanceNeeds: v.optional(v.string()),
		wantsMentor: v.boolean(),
		mentorGenderPreference: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx)

		// Get or create the user record
		let user = await ctx.db
			.query('users')
			.withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
			.unique()

		if (!user) {
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
			user = await ctx.db.get(id)
		}

		if (!user) throw new Error('Failed to resolve user record')

		// Enforce 1 application per 6 months (unless admin-exempt).
		// Uses `submittedAt` when present (correct for migrated records too) and
		// falls back to `_creationTime` for any records not yet backfilled.
		if (!user.fundApplicationLimitExempt) {
			const sixMonthsAgo = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000
			const userApps = await ctx.db
				.query('fundApplications')
				.withIndex('by_userId', (q) => q.eq('userId', user!._id))
				.collect()

			const recent = userApps.filter(
				(app) => (app.submittedAt ?? app._creationTime) >= sixMonthsAgo,
			)

			if (recent.length >= 1) {
				const mostRecent = recent.sort(
					(a, b) =>
						(b.submittedAt ?? b._creationTime) -
						(a.submittedAt ?? a._creationTime),
				)[0]!
				const nextEligible = new Date(
					(mostRecent.submittedAt ?? mostRecent._creationTime) +
						6 * 30 * 24 * 60 * 60 * 1000,
				)
				throw new Error(
					`You can apply again after ${nextEligible.toLocaleDateString()}`,
				)
			}
		}

		const now = Date.now()
		return await ctx.db.insert('fundApplications', {
			userId: user._id,
			name: user.name ?? identity.name ?? '',
			email: user.email,
			age: args.age,
			zipcode: args.zipcode,
			bipocIdentity: args.bipocIdentity,
			genderIdentity: args.genderIdentity,
			referralSource: args.referralSource,
			race: args.race,
			firstRace: args.firstRace,
			experience: args.experience,
			reason: args.reason,
			communityContribution: args.communityContribution,
			wantsMentor: args.wantsMentor,
			status: 'PENDING',
			submittedAt: now,
			updatedAt: now,
			...definedFields({
				raceDate: args.raceDate,
				raceLocation: args.raceLocation,
				goals: args.goals,
				tierraLibreContribution: args.tierraLibreContribution,
				additionalAssistanceNeeds: args.additionalAssistanceNeeds,
				mentorGenderPreference: args.mentorGenderPreference,
			}),
		})
	},
})

/** Admin: approve an application. */
export const approve = mutation({
	args: { id: v.id('fundApplications'), adminNotes: v.optional(v.string()) },
	handler: async (ctx, { id, adminNotes }) => {
		const identity = await requireAdminWriter(ctx)
		if (!(await ctx.db.get(id))) throw new Error('Application not found')

		await ctx.db.patch(
			id,
			definedFields({
				status: 'APPROVED',
				adminNotes,
				reviewedAt: Date.now(),
				reviewedByClerkId: identity.subject,
				updatedAt: Date.now(),
			}),
		)
	},
})

/** Admin: deny an application. */
export const deny = mutation({
	args: { id: v.id('fundApplications'), adminNotes: v.optional(v.string()) },
	handler: async (ctx, { id, adminNotes }) => {
		const identity = await requireAdminWriter(ctx)
		if (!(await ctx.db.get(id))) throw new Error('Application not found')

		await ctx.db.patch(
			id,
			definedFields({
				status: 'DENIED',
				adminNotes,
				reviewedAt: Date.now(),
				reviewedByClerkId: identity.subject,
				updatedAt: Date.now(),
			}),
		)
	},
})

/** Admin: update notes on an application. */
export const updateNotes = mutation({
	args: { id: v.id('fundApplications'), adminNotes: v.string() },
	handler: async (ctx, { id, adminNotes }) => {
		await requireAdminWriter(ctx)
		await ctx.db.patch(id, { adminNotes, updatedAt: Date.now() })
	},
})

/** Admin: delete an application. */
export const remove = mutation({
	args: { id: v.id('fundApplications') },
	handler: async (ctx, { id }) => {
		await requireAdminWriter(ctx)
		await ctx.db.delete(id)
	},
})
