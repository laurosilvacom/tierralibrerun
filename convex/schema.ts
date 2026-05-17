import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
	/**
	 * Minimal user record. Clerk owns identity (name, email, photo).
	 * We store only what the app needs beyond auth.
	 */
	users: defineTable({
		clerkId: v.string(),
		email: v.string(),
		name: v.optional(v.string()),
		profileImageUrl: v.optional(v.string()),
		fundApplicationLimitExempt: v.boolean(),
		updatedAt: v.number(),
	})
		.index('by_clerkId', ['clerkId'])
		.index('by_email', ['email'])
		.searchIndex('search_name_email', {
			searchField: 'name',
			filterFields: ['email'],
		}),

	/**
	 * Fund applications. Demographics (age, zip, identity) are collected
	 * directly in the application form — not in a separate onboarding flow.
	 */
	fundApplications: defineTable({
		userId: v.id('users'),
		// Identity — collected in the application form
		name: v.string(),
		email: v.string(),
		age: v.number(),
		zipcode: v.string(),
		bipocIdentity: v.boolean(),
		genderIdentity: v.string(),
		referralSource: v.string(),
		// Race
		race: v.string(),
		raceDate: v.optional(v.number()),
		raceLocation: v.optional(v.string()),
		firstRace: v.boolean(),
		// Essays
		experience: v.string(),
		reason: v.string(),
		goals: v.optional(v.string()),
		communityContribution: v.string(),
		tierraLibreContribution: v.optional(v.string()),
		// Support needs
		additionalAssistanceNeeds: v.optional(v.string()),
		gearNeeds: v.optional(v.string()),
		// Mentorship
		wantsMentor: v.boolean(),
		mentorGenderPreference: v.optional(v.string()),
		// Decision
		status: v.union(
			v.literal('PENDING'),
			v.literal('APPROVED'),
			v.literal('DENIED'),
		),
		adminNotes: v.optional(v.string()),
		reviewedAt: v.optional(v.number()),
		reviewedByClerkId: v.optional(v.string()),
		updatedAt: v.number(),
		// Real submission time. Distinct from Convex `_creationTime`, which for
		// migrated records reflects the May 2026 PlanetScale → Convex migration
		// rather than the original PlanetScale `created_at`. New submissions set
		// this to `Date.now()`. Migrated records are backfilled by
		// `migrations.backfillSubmittedAt`.
		submittedAt: v.optional(v.number()),
	})
		.index('by_userId', ['userId'])
		.index('by_status', ['status'])
		.searchIndex('search_name_email_race', {
			searchField: 'name',
			filterFields: ['status', 'race'],
		}),
})
