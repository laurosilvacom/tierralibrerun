import { currentUser } from '@clerk/nextjs/server'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

export const metadata = {
	title: 'Application Submitted | Tierra Libre Run',
	robots: { index: false, follow: false },
}

export default async function ApplicationSuccessPage() {
	const user = await currentUser()
	if (!user) redirect('/?auth=sign-in')

	return (
		<div className="bg-background flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-6 py-12">
			<div className="animate-fade-in-up mx-auto w-full max-w-lg text-center">
				<div className="bg-primary/10 mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full">
					<Check className="text-primary h-8 w-8" strokeWidth={2.5} />
				</div>
				<h1 className="text-foreground text-4xl font-semibold tracking-tight md:text-5xl">
					Application submitted.
				</h1>
				<p className="text-muted-foreground mx-auto mt-5 max-w-md text-lg leading-relaxed md:text-xl">
					We&apos;ll review your application and follow up by email. You can
					track its status anytime from your dashboard.
				</p>

				<div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
					<Button asChild size="lg" className="rounded-full px-8 text-base">
						<Link href="/dashboard">View dashboard</Link>
					</Button>
					<Button
						asChild
						size="lg"
						variant="ghost"
						className="rounded-full px-8 text-base"
					>
						<Link href="/">Back home</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}
