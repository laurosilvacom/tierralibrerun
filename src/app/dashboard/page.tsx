'use client'

import { useUser } from '@clerk/nextjs'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { format } from 'date-fns'
import { Check, Clock, X, Plus, FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
	PENDING: {
		label: 'Under review',
		icon: Clock,
		iconWrap: 'bg-primary/15',
		iconColor: 'text-primary',
		dotColor: 'bg-primary',
		textColor: 'text-primary',
		message:
			"Your application is being reviewed. We'll email you with updates.",
	},
	APPROVED: {
		label: 'Approved',
		icon: Check,
		iconWrap: 'bg-chart-5/15',
		iconColor: 'text-chart-5',
		dotColor: 'bg-chart-5',
		textColor: 'text-chart-5',
		message:
			'Congratulations. Your application has been approved. Watch your email for next steps.',
	},
	DENIED: {
		label: 'Not selected',
		icon: X,
		iconWrap: 'bg-destructive/10',
		iconColor: 'text-destructive',
		dotColor: 'bg-destructive',
		textColor: 'text-destructive',
		message: 'This application was not selected for this cycle.',
	},
} as const

export default function DashboardPage() {
	const { user, isLoaded } = useUser()
	const [bootstrapStatus, setBootstrapStatus] = useState<
		'idle' | 'loading' | 'ready' | 'error'
	>('idle')
	const {
		isAuthenticated: isConvexAuthenticated,
		isLoading: isConvexAuthLoading,
	} = useConvexAuth()

	const getOrCreate = useMutation(api.users.getOrCreate)
	useEffect(() => {
		if (!isLoaded || isConvexAuthLoading) return
		if (!user || !isConvexAuthenticated) {
			setBootstrapStatus('idle')
			return
		}

		let cancelled = false
		setBootstrapStatus('loading')
		void getOrCreate()
			.then(() => {
				if (!cancelled) setBootstrapStatus('ready')
			})
			.catch((error: unknown) => {
				console.error('Failed to bootstrap dashboard user', error)
				if (!cancelled) setBootstrapStatus('error')
			})

		return () => {
			cancelled = true
		}
	}, [getOrCreate, isConvexAuthenticated, isConvexAuthLoading, isLoaded, user])

	const applications = useQuery(
		api.applications.listMine,
		isConvexAuthenticated && bootstrapStatus === 'ready' ? {} : 'skip',
	)

	/* Loading */
	if (
		!isLoaded ||
		isConvexAuthLoading ||
		bootstrapStatus === 'loading' ||
		(isConvexAuthenticated &&
			bootstrapStatus === 'ready' &&
			applications === undefined)
	) {
		return (
			<div className="bg-background min-h-[calc(100dvh-4rem)]">
				<div className="mx-auto max-w-3xl px-6 py-10 md:py-16">
					<div className="bg-muted h-4 w-32 animate-pulse rounded" />
					<div className="bg-muted mt-3 h-10 w-72 max-w-full animate-pulse rounded" />
					<div className="bg-muted mt-3 h-5 w-96 max-w-full animate-pulse rounded" />
					<div className="bg-muted mt-10 h-24 w-full animate-pulse rounded-2xl" />
					<div className="bg-muted mt-10 h-6 w-32 animate-pulse rounded" />
					<div className="bg-muted mt-4 h-28 w-full animate-pulse rounded-2xl" />
				</div>
			</div>
		)
	}

	if (bootstrapStatus === 'error') {
		return (
			<div className="bg-background flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-6 py-12">
				<div className="animate-fade-in-up mx-auto w-full max-w-md text-center">
					<h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
						We could not finish setting up your dashboard.
					</h1>
					<p className="text-muted-foreground mt-3 text-base leading-relaxed md:text-lg">
						Refresh the page to reconnect your authenticated session.
					</p>
				</div>
			</div>
		)
	}

	/* Session not ready */
	if (!isConvexAuthenticated) {
		return (
			<div className="bg-background flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-6 py-12">
				<div className="animate-fade-in-up mx-auto w-full max-w-md text-center">
					<h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
						Session not ready.
					</h1>
					<p className="text-muted-foreground mt-3 text-base leading-relaxed md:text-lg">
						Refresh the page to reconnect your authenticated session.
					</p>
				</div>
			</div>
		)
	}

	const dashboardApplications = applications ?? []
	const fullName =
		`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Athlete'
	const applicationCount = dashboardApplications.length
	const pendingCount = dashboardApplications.filter(
		(app) => app.status === 'PENDING',
	).length
	const approvedCount = dashboardApplications.filter(
		(app) => app.status === 'APPROVED',
	).length

	return (
		<div className="bg-background min-h-[calc(100dvh-4rem)]">
			<div className="animate-fade-in-up mx-auto max-w-3xl px-6 py-10 md:py-16">
				{/* Header */}
				<header className="mb-10">
					<p className="text-muted-foreground text-sm font-medium">
						Athlete dashboard
					</p>
					<h1 className="text-foreground mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
						Welcome, {fullName}.
					</h1>
					<p className="text-muted-foreground mt-2 text-base leading-relaxed md:text-lg">
						Track your race funding applications and updates.
					</p>
				</header>

				{/* Metrics */}
				<div className="border-border bg-card divide-border mb-10 grid grid-cols-3 divide-x rounded-2xl border">
					<div className="p-5">
						<p className="text-card-foreground text-3xl font-semibold tracking-tight tabular-nums">
							{applicationCount}
						</p>
						<p className="text-muted-foreground mt-1 text-xs font-medium">
							Applications
						</p>
					</div>
					<div className="p-5">
						<p
							className={cn(
								'text-3xl font-semibold tracking-tight tabular-nums',
								pendingCount > 0 ? 'text-primary' : 'text-card-foreground',
							)}
						>
							{pendingCount}
						</p>
						<p className="text-muted-foreground mt-1 text-xs font-medium">
							In review
						</p>
					</div>
					<div className="p-5">
						<p
							className={cn(
								'text-3xl font-semibold tracking-tight tabular-nums',
								approvedCount > 0 ? 'text-chart-5' : 'text-card-foreground',
							)}
						>
							{approvedCount}
						</p>
						<p className="text-muted-foreground mt-1 text-xs font-medium">
							Approved
						</p>
					</div>
				</div>

				{/* Applications */}
				<section>
					<div className="mb-4 flex items-center justify-between">
						<h2 className="text-foreground text-lg font-semibold tracking-tight">
							Applications
						</h2>
						<Button asChild size="sm">
							<Link href="/fund/apply">
								<Plus className="mr-1 h-4 w-4" />
								Apply
							</Link>
						</Button>
					</div>

					{dashboardApplications.length === 0 ? (
						<div className="border-border bg-card rounded-2xl border p-10 text-center">
							<div className="bg-accent mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full">
								<FileText className="text-primary h-5 w-5" strokeWidth={2} />
							</div>
							<h3 className="text-card-foreground text-base font-medium">
								No applications yet
							</h3>
							<p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm leading-relaxed">
								Apply for race funding to get started. It takes about 15
								minutes.
							</p>
							<div className="mt-6">
								<Button asChild>
									<Link href="/fund/apply">
										Apply for race funding
										<ArrowRight className="ml-2 h-4 w-4" />
									</Link>
								</Button>
							</div>
						</div>
					) : (
						<div className="space-y-3">
							{dashboardApplications.map(
								(app: {
									_id: string
									status: string
									race: string
									_creationTime: number
									submittedAt?: number
									raceDate?: number
								}) => {
									const config =
										STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG] ??
										STATUS_CONFIG.PENDING
									const Icon = config.icon
									return (
										<div
											key={app._id}
											className="border-border bg-card hover:border-ring/50 rounded-2xl border p-5 transition-colors"
										>
											<div className="flex items-start gap-4">
												<div
													className={cn(
														'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
														config.iconWrap,
													)}
												>
													<Icon
														className={cn('h-5 w-5', config.iconColor)}
														strokeWidth={2.5}
													/>
												</div>
												<div className="min-w-0 flex-1">
													<div className="flex items-start justify-between gap-3">
														<div className="min-w-0">
															<p className="text-card-foreground truncate text-base font-medium">
																{app.race}
															</p>
															<div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
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
																	<span>{config.label}</span>
																</span>
																<span aria-hidden>·</span>
																<span>
																	Applied{' '}
																	{format(
																		new Date(app.submittedAt ?? app._creationTime),
																		'MMM d, yyyy',
																	)}
																</span>
															</div>
														</div>
														{app.raceDate && (
															<div className="hidden shrink-0 text-right sm:block">
																<p className="text-muted-foreground text-xs">
																	Race day
																</p>
																<p className="text-card-foreground mt-0.5 text-sm font-medium">
																	{format(
																		new Date(app.raceDate),
																		'MMM d, yyyy',
																	)}
																</p>
															</div>
														)}
													</div>
													<p className="text-muted-foreground mt-3 text-sm leading-relaxed">
														{config.message}
													</p>
												</div>
											</div>
										</div>
									)
								},
							)}
						</div>
					)}
				</section>
			</div>
		</div>
	)
}
