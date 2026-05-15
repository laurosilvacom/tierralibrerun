'use client'

import { useConvexAuth, useQuery } from 'convex/react'
import { format } from 'date-fns'
import {
	ArrowLeft,
	Check,
	ChevronRight,
	Clock,
	Mail,
	X,
} from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'
import { DeleteUser } from '@/components/admin/delete-user'
import { LimitExemptToggle } from '@/components/admin/limit-exempt'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import { type Id } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'

type Status = 'PENDING' | 'APPROVED' | 'DENIED'

const STATUS_CONFIG: Record<
	Status,
	{ label: string; icon: typeof Clock; textColor: string; dotColor: string }
> = {
	PENDING: {
		label: 'Pending',
		icon: Clock,
		textColor: 'text-primary',
		dotColor: 'bg-primary',
	},
	APPROVED: {
		label: 'Approved',
		icon: Check,
		textColor: 'text-chart-5',
		dotColor: 'bg-chart-5',
	},
	DENIED: {
		label: 'Not selected',
		icon: X,
		textColor: 'text-muted-foreground',
		dotColor: 'bg-muted-foreground',
	},
}

function initials(name?: string | null) {
	if (!name) return '?'
	return name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2)
}

function SectionCard({
	title,
	children,
}: {
	title: string
	children: React.ReactNode
}) {
	return (
		<div className="border-border bg-card rounded-2xl border p-6">
			<h2 className="text-foreground mb-4 text-base font-semibold tracking-tight">
				{title}
			</h2>
			{children}
		</div>
	)
}

export default function AdminUserDetailPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const {
		isAuthenticated: isConvexAuthenticated,
		isLoading: isConvexAuthLoading,
	} = useConvexAuth()
	const { id } = use(params)
	const user = useQuery(
		api.users.getById,
		isConvexAuthenticated ? { id: id as Id<'users'> } : 'skip',
	)
	const userApps = useQuery(
		api.applications.listByUser,
		isConvexAuthenticated ? { userId: id as Id<'users'> } : 'skip',
	)

	if (isConvexAuthLoading || user === undefined) {
		return (
			<div className="space-y-4">
				<div className="bg-muted h-6 w-32 animate-pulse rounded" />
				<div className="bg-muted h-12 w-72 animate-pulse rounded" />
				<div className="bg-muted mt-6 h-48 animate-pulse rounded-2xl" />
			</div>
		)
	}

	if (!isConvexAuthenticated) {
		return (
			<div className="text-muted-foreground py-24 text-center text-sm">
				Refresh the page to reconnect your admin session.
			</div>
		)
	}

	if (user === null) {
		return (
			<div className="animate-fade-in-up py-24 text-center">
				<p className="text-foreground text-lg font-medium">User not found.</p>
				<div className="mt-6">
					<Button asChild variant="ghost" className="rounded-full">
						<Link href="/admin/users">
							<ArrowLeft className="mr-1 h-4 w-4" />
							Back to users
						</Link>
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div className="animate-fade-in-up">
			{/* Back */}
			<Link
				href="/admin/users"
				className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium"
			>
				<ArrowLeft className="h-4 w-4" />
				Users
			</Link>

			{/* Header */}
			<header className="mt-6 flex items-center gap-4">
				<Avatar className="h-14 w-14">
					<AvatarImage src={user.profileImageUrl ?? undefined} />
					<AvatarFallback className="text-base font-medium">
						{initials(user.name)}
					</AvatarFallback>
				</Avatar>
				<div className="min-w-0">
					<h1 className="text-foreground truncate text-3xl font-semibold tracking-tight md:text-4xl">
						{user.name ?? 'Unnamed'}
					</h1>
					<p className="text-muted-foreground mt-1 truncate text-sm">
						{user.email}
					</p>
				</div>
			</header>

			<div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
				{/* Main */}
				<div className="space-y-5 lg:col-span-2">
					<SectionCard title="Fund applications">
						{!userApps || userApps.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No applications yet.
							</p>
						) : (
							<div className="space-y-2">
								{userApps.map(
									(app: {
										_id: string
										status: string
										race: string
										_creationTime: number
									}) => {
										const config =
											STATUS_CONFIG[app.status as Status] ??
											STATUS_CONFIG.PENDING
										return (
											<Link
												key={app._id}
												href={`/admin/applications/${app._id}`}
												className="hover:bg-muted/40 group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors"
											>
												<div className="min-w-0 flex-1">
													<p className="text-foreground truncate text-sm font-medium">
														{app.race}
													</p>
													<div className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
														<span
															className={cn(
																'flex items-center gap-1.5 font-medium',
																config.textColor,
															)}
														>
															<span
																className={cn(
																	'h-1.5 w-1.5 rounded-full',
																	config.dotColor,
																)}
															/>
															{config.label}
														</span>
														<span aria-hidden>·</span>
														<span>
															{format(
																new Date(app._creationTime),
																'MMM d, yyyy',
															)}
														</span>
													</div>
												</div>
												<ChevronRight className="text-muted-foreground group-hover:text-foreground h-4 w-4 shrink-0 transition-colors" />
											</Link>
										)
									},
								)}
							</div>
						)}
					</SectionCard>
				</div>

				{/* Sidebar */}
				<div className="space-y-5">
					<SectionCard title="Profile">
						<div className="space-y-3 text-sm">
							<div className="flex items-center gap-2">
								<Mail className="text-muted-foreground h-4 w-4 shrink-0" />
								<span className="break-words">{user.email}</span>
							</div>
							{user.fundApplicationLimitExempt && (
								<Badge variant="outline" className="text-xs font-normal">
									Limit exempt
								</Badge>
							)}
							<p className="text-muted-foreground pt-1 text-xs">
								Joined{' '}
								{format(new Date(user._creationTime), 'MMMM d, yyyy')}
							</p>
						</div>
					</SectionCard>

					<SectionCard title="Admin controls">
						<div className="space-y-5">
							<LimitExemptToggle
								userId={user._id}
								currentValue={user.fundApplicationLimitExempt}
							/>
							<DeleteUser userId={user._id} />
						</div>
					</SectionCard>
				</div>
			</div>
		</div>
	)
}
