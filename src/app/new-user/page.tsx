import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ensureConvexUserForCurrentSession } from '@/lib/convex-user'
import { resolveOnboardingReturnTarget } from '@/lib/routing'

export const dynamic = 'force-dynamic'

/**
 * Post-signup landing. No "onboarding" — demographics live in the application
 * form, and the Convex user record is created lazily on first authenticated
 * page load. This route only exists to bounce the user to wherever they were
 * actually headed (the `next` param) or to /dashboard.
 */
export default async function NewUserPage(props: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
	const sp = (await props.searchParams) || {}
	const next = resolveOnboardingReturnTarget(sp)
	const { userId } = await auth()

	if (!userId) {
		const redirectTarget = next ?? '/dashboard'
		redirect(
			`/?auth=sign-in&redirect_url=${encodeURIComponent(redirectTarget)}`,
		)
	}

	await ensureConvexUserForCurrentSession()
	redirect(next ?? '/dashboard')
}
