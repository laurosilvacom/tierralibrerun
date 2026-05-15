import { currentUser } from '@clerk/nextjs/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'
import { AdminSidebarNav } from '@/components/admin/sidebar-nav'
import { AuthButton } from '@/components/auth-button'
import { Button } from '@/components/ui/button'
import {
	Sidebar,
	SidebarHeader,
	SidebarInset,
	SidebarProvider,
} from '@/components/ui/sidebar'
import { isAdmin } from '@/lib/auth'

function AccessDenied() {
	return (
		<div className="bg-background flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-6 py-12">
			<div className="animate-fade-in-up mx-auto w-full max-w-md text-center">
				<h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
					Access denied.
				</h1>
				<p className="text-muted-foreground mt-3 text-base leading-relaxed md:text-lg">
					This area is for admins only.
				</p>
				<div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
					<Button asChild size="lg">
						<Link href="/">Back home</Link>
					</Button>
					<AuthButton
						action="sign-in"
						label="Sign in"
						variant="ghost"
						size="lg"
					/>
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
		<SidebarProvider>
			<Sidebar>
				<SidebarHeader>
					<p className="text-sidebar-foreground text-sm font-semibold">
						Admin dashboard
					</p>
					<p className="text-sidebar-foreground/65 text-xs">Tierra Libre Run</p>
				</SidebarHeader>
				<AdminSidebarNav />
			</Sidebar>
			<SidebarInset>
				<div className="mx-auto w-full max-w-5xl px-6 py-10 md:py-14">
					{children}
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
