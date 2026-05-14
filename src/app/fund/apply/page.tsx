import { auth, currentUser } from '@clerk/nextjs/server'
import { fetchQuery } from 'convex/nextjs'
import { redirect } from 'next/navigation'
import ApplicationForm from './form'
import { api } from '@/convex/_generated/api'
import { fundApplyMetadata } from '@/lib/metadata'
import { getAllRaceOptionsForApplication } from '@/lib/sanity/queries'

export const metadata = {
	...fundApplyMetadata,
	robots: {
		index: false,
		follow: false,
		googleBot: { index: false, follow: false },
	},
}

export default async function ApplyPage() {
	const user = await currentUser()
	if (!user) {
		redirect(`/?auth=sign-in&redirect_url=${encodeURIComponent('/fund/apply')}`)
	}

	const { getToken } = await auth()
	const token = await getToken({ template: 'convex' })

	const [raceOptions, myApplications] = await Promise.all([
		getAllRaceOptionsForApplication(),
		token
			? fetchQuery(api.applications.listMine, {}, { token })
			: Promise.resolve([]),
	])

	const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000
	const sixMonthsAgo = Date.now() - SIX_MONTHS_MS
	const recentApps = myApplications.filter(
		(app) => app._creationTime >= sixMonthsAgo,
	)
	const appliedRaces = recentApps.map((app) => app.race)
	const remainingApplications = Math.max(0, 1 - recentApps.length)

	return (
		<main className="bg-background text-foreground min-h-screen">
			<div className="container mx-auto px-4 py-8 md:px-6 lg:py-12">
				<div className="mx-auto max-w-6xl">
					<ApplicationForm
						userData={{
							name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
							email: user.emailAddresses?.[0]?.emailAddress ?? '',
							userId: user.id,
						}}
						applicationStatus={{
							applications: myApplications.map((app) => ({
								id: app._id,
								race: app.race,
								status: app.status,
								createdAt: new Date(app._creationTime),
							})),
							applicationCount: myApplications.length,
							remainingApplications,
							appliedRaces,
						}}
						raceOptions={raceOptions}
					/>
				</div>
			</div>
		</main>
	)
}
