import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import ApplicationForm from './form'
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
	if (!user) redirect('/?auth=sign-in')

	// Eligibility is enforced in the Convex mutation — just load race options here
	const raceOptions = await getAllRaceOptionsForApplication()

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
							applications: [],
							applicationCount: 0,
							remainingApplications: 1,
							appliedRaces: [],
						}}
						raceOptions={raceOptions}
					/>
				</div>
			</div>
		</main>
	)
}
