import { currentUser } from '@clerk/nextjs/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'
import { AuthButton } from '@/components/auth-button'
import { Button } from '@/components/ui/button'
import { isAdmin } from '@/lib/auth'

function AccessDenied() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="bg-card border-border max-w-md rounded-lg border p-8">
				<h1 className="text-destructive mb-3 text-xl font-bold">
					Access Denied
				</h1>
				<p className="text-muted-foreground mb-6 text-sm">
					Admin access required.
				</p>
				<div className="flex gap-2">
					<Button asChild size="sm">
						<Link href="/">Go home</Link>
					</Button>
					<AuthButton action="sign-in" label="Sign in" variant="outline" />
				</div>
			</div>
		</div>
	)
}

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const user = await currentUser()
	if (!user) redirect('/?auth=sign-in')

	if (!(await isAdmin())) return <AccessDenied />

	return (
		<div className="min-h-screen">
			<div className="fixed inset-y-0 left-0 z-10 w-56 border-r pt-16">
				<nav className="space-y-1 p-4">
					<p className="text-muted-foreground mb-3 px-3 text-xs font-medium uppercase tracking-wider">
						Admin
					</p>
					<NavLink href="/admin/applications">Applications</NavLink>
					<NavLink href="/admin/active">Active Athletes</NavLink>
					<NavLink href="/admin/users">Users</NavLink>
				</nav>
			</div>
			<div className="pl-56">
				<div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
			</div>
		</div>
	)
}

function NavLink({
	href,
	children,
}: {
	href: string
	children: React.ReactNode
}) {
	return (
		<Link
			href={href}
			className="text-muted-foreground hover:text-foreground hover:bg-muted block rounded-md px-3 py-2 text-sm transition-colors"
		>
			{children}
		</Link>
	)
}
