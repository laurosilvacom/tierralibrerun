/**
 * One-shot data migrations.
 *
 * Run with:
 *   pnpm convex run migrations:backfillSubmittedAt '{ "dryRun": true }'
 *   pnpm convex run migrations:backfillSubmittedAt '{ "dryRun": false }'
 *
 * Keep this file around as a record of historical fixes. Add new migrations as
 * new exports; do not edit ones that have already been run in production.
 */
import { v } from 'convex/values'
import { internalMutation } from './_generated/server'

// May 6, 2026 ±1 day window (UTC), matching the PlanetScale → Convex run.
const MIGRATION_WINDOW_START = Date.UTC(2026, 4, 5) // May 5 00:00 UTC
const MIGRATION_WINDOW_END = Date.UTC(2026, 4, 8) // May 8 00:00 UTC (exclusive)
const MIGRATION_REFERENCE = Date.UTC(2026, 4, 6) // for fallback math

// Records inserted natively in Convex set `updatedAt` to `Date.now()` at
// roughly the same instant as `_creationTime`. Allow a small slop for clock
// skew when deciding whether `updatedAt` came from PlanetScale.
const TIMESTAMP_SLOP_MS = 60_000

const DAY_MS = 24 * 60 * 60 * 1000
const SEVEN_MONTHS_MS = 7 * 30 * DAY_MS

type Source =
	| 'native'
	| 'updatedAt'
	| 'reviewedAt'
	| 'raceDate'
	| 'fallback'
	| 'already_set'

interface PlannedChange {
	id: string
	name: string
	email: string
	race: string
	creationTime: number
	currentSubmittedAt: number | undefined
	proposedSubmittedAt: number
	source: Source
}

/**
 * For one application record, decide what `submittedAt` should be.
 *
 * Hierarchy of signals (best first):
 *   1. Already has `submittedAt` → leave alone.
 *   2. Not in migration window → record was created natively in Convex. Use
 *      `_creationTime`.
 *   3. `updatedAt` is meaningfully older than `_creationTime` → the migration
 *      script stored the PlanetScale `created_at` in `updatedAt` and no admin
 *      action has overwritten it. Use `updatedAt`.
 *   4. `reviewedAt` is older than `_creationTime` → record was already decided
 *      in PlanetScale; `reviewedAt` is an upper bound on submission.
 *   5. `raceDate` is in the past → submission was at least a month before the
 *      race. Use `raceDate - 30 days`.
 *   6. No signal → 7 months before the migration, which clears the 6-month
 *      cooldown but is still a concrete sortable date.
 */
function planSubmittedAt(app: {
	_id: { toString: () => string }
	_creationTime: number
	updatedAt: number
	reviewedAt?: number
	raceDate?: number
	submittedAt?: number
}): { proposed: number; source: Source } {
	if (app.submittedAt !== undefined) {
		return { proposed: app.submittedAt, source: 'already_set' }
	}

	const inMigrationWindow =
		app._creationTime >= MIGRATION_WINDOW_START &&
		app._creationTime < MIGRATION_WINDOW_END

	if (!inMigrationWindow) {
		return { proposed: app._creationTime, source: 'native' }
	}

	if (app.updatedAt < app._creationTime - TIMESTAMP_SLOP_MS) {
		return { proposed: app.updatedAt, source: 'updatedAt' }
	}

	if (
		app.reviewedAt !== undefined &&
		app.reviewedAt < app._creationTime - TIMESTAMP_SLOP_MS
	) {
		return { proposed: app.reviewedAt, source: 'reviewedAt' }
	}

	if (app.raceDate !== undefined && app.raceDate < app._creationTime) {
		return { proposed: app.raceDate - 30 * DAY_MS, source: 'raceDate' }
	}

	return {
		proposed: MIGRATION_REFERENCE - SEVEN_MONTHS_MS,
		source: 'fallback',
	}
}

export const backfillSubmittedAt = internalMutation({
	args: { dryRun: v.boolean() },
	handler: async (ctx, { dryRun }) => {
		const apps = await ctx.db.query('fundApplications').collect()
		const planned: PlannedChange[] = []
		const counts: Record<Source, number> = {
			native: 0,
			updatedAt: 0,
			reviewedAt: 0,
			raceDate: 0,
			fallback: 0,
			already_set: 0,
		}

		for (const app of apps) {
			const { proposed, source } = planSubmittedAt(app)
			counts[source]++

			if (source === 'already_set') continue

			planned.push({
				id: app._id.toString(),
				name: app.name,
				email: app.email,
				race: app.race,
				creationTime: app._creationTime,
				currentSubmittedAt: app.submittedAt,
				proposedSubmittedAt: proposed,
				source,
			})

			if (!dryRun) {
				await ctx.db.patch(app._id, { submittedAt: proposed })
			}
		}

		return {
			dryRun,
			total: apps.length,
			counts,
			changes: planned,
		}
	},
})
