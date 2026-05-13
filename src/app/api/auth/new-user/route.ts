import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { resolveOnboardingReturnTarget } from '@/lib/routing'

export const dynamic = 'force-dynamic'

/**
 * Called after Clerk sign-up. Redirects to dashboard immediately.
 * User record is created lazily in Convex on first authenticated page load.
 * No separate onboarding flow required.
 */
export async function GET(request: Request) {
	const url = new URL(request.url)
	const next = resolveOnboardingReturnTarget(url.searchParams)
	const { userId } = await auth()

	if (!userId) {
		return NextResponse.json(
			{ status: 'pending' },
			{
				status: 202,
				headers: { 'cache-control': 'no-store, no-cache, must-revalidate' },
			},
		)
	}

	const redirectTo = next ?? '/dashboard'
	return NextResponse.redirect(new URL(redirectTo, url.origin))
}
