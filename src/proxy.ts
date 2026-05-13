import {
	clerkMiddleware,
	createRouteMatcher,
	type ClerkMiddlewareAuth,
} from '@clerk/nextjs/server'
import { type NextRequest } from 'next/server'

/**
 * Routes accessible without authentication.
 *
 * Protected routes (/dashboard, /admin, /fund/apply, etc.)
 * are NOT listed here — they require sign-in at the middleware level.
 * Those routes also have their own layout-level guards as a second layer of defence.
 */
const isPublicRoute = createRouteMatcher([
	// Marketing & informational pages
	'/',
	'/blog',
	'/blog/:slug',
	'/donate',
	'/hyak',
	'/races(.*)',
	'/fund',
	'/code-of-conduct',
	'/companies(.*)',
	'/privacy-policy',
	'/terms-of-service',

	// Post-signup redirect bridge
	'/new-user',

	// Sanity Studio (has its own auth)
	'/studio(.*)',
])

export default clerkMiddleware(
	async (auth: ClerkMiddlewareAuth, request: NextRequest) => {
		if (!isPublicRoute(request)) {
			await auth.protect()
		}
	},
)

export const config = {
	matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
