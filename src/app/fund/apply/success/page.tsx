import { currentUser } from '@clerk/nextjs/server'
import { CheckCircle, Home, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export const metadata = {
	title: 'Application Submitted | Tierra Libre Run',
	robots: { index: false, follow: false },
}

export default async function ApplicationSuccessPage() {
	const user = await currentUser()
	if (!user) redirect('/?auth=sign-in')

	return (
		<div className="container mx-auto max-w-xl px-4 py-16">
			<div className="space-y-6 text-center">
				<CheckCircle className="mx-auto h-16 w-16 text-green-500" />
				<div>
					<h1 className="text-2xl font-bold">Application Submitted</h1>
					<p className="text-muted-foreground mt-2">
						We've received your application and will be in touch via email.
					</p>
				</div>

				<Separator />

				<div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
					<Button asChild>
						<Link href="/dashboard">
							<LayoutDashboard className="mr-2 h-4 w-4" />
							View Dashboard
						</Link>
					</Button>
					<Button variant="outline" asChild>
						<Link href="/">
							<Home className="mr-2 h-4 w-4" />
							Home
						</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}
