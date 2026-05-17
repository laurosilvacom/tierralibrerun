import { v } from 'convex/values'
import { internalAction } from './_generated/server'

/**
 * Add a user to the Resend audience on first sign-in.
 *
 * Scheduled (not awaited) from users.getOrCreate so the mutation commits
 * regardless of Resend availability — a failed sync must never block sign-in.
 * RESEND_API_KEY and RESEND_AUDIENCE_ID live in Convex's deployment env.
 */
export const syncContact = internalAction({
	args: {
		email: v.string(),
		name: v.optional(v.string()),
	},
	handler: async (_ctx, { email, name }) => {
		const apiKey = process.env.RESEND_API_KEY
		const audienceId = process.env.RESEND_AUDIENCE_ID
		const normalizedEmail = email.trim().toLowerCase()
		if (!apiKey || !audienceId || !normalizedEmail) {
			if (!apiKey || !audienceId) {
				console.warn(
					'newsletter.syncContact: RESEND_API_KEY or RESEND_AUDIENCE_ID unset; skipping',
				)
			}
			return
		}

		const [firstName, ...rest] = (name ?? '').trim().split(/\s+/)
		const lastName = rest.join(' ').trim() || undefined

		const res = await fetch(
			`https://api.resend.com/audiences/${audienceId}/contacts`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					email: normalizedEmail,
					first_name: firstName || undefined,
					last_name: lastName,
					unsubscribed: false,
				}),
			},
		)

		if (res.ok) return

		const body = await res.text().catch(() => '<no body>')
		console.error('newsletter.syncContact: Resend returned error', {
			status: res.status,
			body,
			email: normalizedEmail,
		})
	},
})
