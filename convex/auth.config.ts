import { type AuthConfig } from 'convex/server'

function issuerDomainFromPublishableKey(publishableKey?: string) {
	if (!publishableKey) return undefined

	const encodedDomain = publishableKey.split('_').slice(2).join('_')
	if (!encodedDomain) return undefined

	try {
		const decodedDomain = Buffer.from(encodedDomain, 'base64url')
			.toString('utf8')
			.replace(/\$$/, '')

		if (!decodedDomain) return undefined
		return decodedDomain.startsWith('https://')
			? decodedDomain
			: `https://${decodedDomain}`
	} catch {
		return undefined
	}
}

const raw =
	process.env.CLERK_JWT_ISSUER_DOMAIN ??
	issuerDomainFromPublishableKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

if (!raw) {
	throw new Error(
		'Missing Clerk issuer domain. Set CLERK_JWT_ISSUER_DOMAIN or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY for Convex auth.',
	)
}

const domains = raw
	.split(',')
	.map((d) => d.trim())
	.filter(Boolean)

export default {
	providers: domains.map((domain) => ({
		domain,
		applicationID: 'convex',
	})),
} satisfies AuthConfig
