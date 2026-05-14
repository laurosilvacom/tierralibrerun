'use client'

import { useUser } from '@clerk/nextjs'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { format } from 'date-fns'
import {
	CheckCircle,
	Clock,
	XCircle,
	Plus,
	FileText,
	Trophy,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { api } from '@/convex/_generated/api'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
	PENDING: {
		label: 'Under Review',
		icon: Clock,
		iconClassName: 'text-primary',
		iconWrapClassName: 'bg-background/85',
		surfaceClassName: 'border-primary/20 bg-primary/10',
		badgeClassName: 'border-primary/20 bg-background/85 text-primary',
		message:
			"Your application is being reviewed. We'll email you with updates.",
	},
	APPROVED: {
		label: 'Approved',
		icon: CheckCircle,
		iconClassName: 'text-chart-5',
		iconWrapClassName: 'bg-chart-5/12',
		surfaceClassName: 'border-chart-5/20 bg-chart-5/8',
		badgeClassName: 'border-chart-5/20 bg-background/85 text-chart-5',
		message:
			'Congratulations! Your application has been approved. Watch your email for next steps.',
	},
	DENIED: {
		label: 'Not Selected',
		icon: XCircle,
		iconClassName: 'text-muted-foreground',
		iconWrapClassName: 'bg-background/85',
		surfaceClassName: 'border-border bg-muted/70',
		badgeClassName: 'border-border bg-background/85 text-muted-foreground',
		message: 'This application was not selected for this cycle.',
	},
} as const

export default function DashboardPage() {
	const { user, isLoaded } = useUser()
	const {
		isAuthenticated: isConvexAuthenticated,
		isLoading: isConvexAuthLoading,
	} = useConvexAuth()

	// Create the user record in Convex on first visit — no separate onboarding required.
	const getOrCreate = useMutation(api.users.getOrCreate)
	useEffect(() => {
		if (isLoaded && user && isConvexAuthenticated) {
			void getOrCreate()
		}
	}, [isLoaded, user, isConvexAuthenticated, getOrCreate])

	// Live subscription — updates instantly when admin approves or denies
	const applications = useQuery(
		api.applications.listMine,
		isConvexAuthenticated ? {} : 'skip',
	)

	if (!isLoaded || isConvexAuthLoading || applications === undefined) {
		return (
			<div className="container mx-auto max-w-3xl px-4 py-12">
				<div className="space-y-4">
					<div className="bg-card h-8 w-48 animate-pulse rounded" />
					<div className="bg-card h-48 animate-pulse rounded-xl" />
				</div>
			</div>
		)
	}

	if (!isConvexAuthenticated) {
		return (
			<div className="container mx-auto max-w-3xl px-4 py-12">
				<div className="rounded-xl border p-6">
					<h1 className="text-xl font-semibold">Session not ready</h1>
					<p className="text-muted-foreground mt-2 text-sm">
						Refresh the page to reconnect your authenticated session.
					</p>
				</div>
			</div>
		)
	}

	const fullName =
		`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Athlete'
	const applicationCount = applications.length
	const pendingCount = applications.filter(
		(app) => app.status === 'PENDING',
	).length
	const approvedCount = applications.filter(
		(app) => app.status === 'APPROVED',
	).length

	return (
		<div className="container mx-auto max-w-5xl px-4 py-10 sm:py-12">
			<section className="border-primary/15 from-primary/12 via-background to-accent/70 relative mb-8 overflow-hidden rounded-[calc(var(--radius)+0.75rem)] border bg-gradient-to-br p-6 shadow-sm sm:p-8">
				<div className="bg-primary/14 absolute top-0 right-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full blur-3xl" />
				<div className="bg-accent/80 absolute bottom-0 left-8 h-32 w-32 translate-y-10 rounded-full blur-3xl" />
				<div className="relative">
					<Badge
						variant="secondary"
						className="border-border/60 bg-background/80 mb-4 border px-3 py-1 text-[10px] tracking-[0.18em] uppercase"
					>
						Athlete dashboard
					</Badge>
					<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
						<div className="max-w-2xl">
							<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
								Welcome, {fullName}
							</h1>
							<p className="text-muted-foreground mt-2 max-w-xl text-sm leading-6 sm:text-base">
								Track your race funding applications, review status changes, and
								jump back into a new submission when you&apos;re ready.
							</p>
						</div>
						<div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
							<div className="border-border/70 bg-background/80 rounded-2xl border px-4 py-3 backdrop-blur">
								<p className="text-muted-foreground text-[11px] tracking-[0.18em] uppercase">
									Applications
								</p>
								<p className="mt-2 text-2xl font-semibold">
									{applicationCount}
								</p>
							</div>
							<div className="border-primary/15 bg-background/80 rounded-2xl border px-4 py-3 backdrop-blur">
								<p className="text-muted-foreground text-[11px] tracking-[0.18em] uppercase">
									In review
								</p>
								<p className="text-primary mt-2 text-2xl font-semibold">
									{pendingCount}
								</p>
							</div>
							<div className="border-chart-5/15 bg-background/80 rounded-2xl border px-4 py-3 backdrop-blur">
								<p className="text-muted-foreground text-[11px] tracking-[0.18em] uppercase">
									Approved
								</p>
								<p className="text-chart-5 mt-2 text-2xl font-semibold">
									{approvedCount}
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<Card className="border-primary/10 overflow-hidden shadow-sm">
				<CardHeader className="border-border/60 border-b pb-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle className="text-2xl">
								Race Funding Applications
							</CardTitle>
							<CardDescription className="mt-1">
								Your applications and their current status
							</CardDescription>
						</div>
						<Button asChild size="sm">
							<Link href="/fund/apply">
								<Plus className="mr-1 h-4 w-4" />
								Apply
							</Link>
						</Button>
					</div>
				</CardHeader>
				<CardContent className="pt-6">
					{applications.length === 0 ? (
						<div className="border-border/80 bg-muted/40 flex flex-col items-center rounded-2xl border border-dashed px-6 py-12 text-center">
							<FileText className="text-muted-foreground/30 mb-4 h-16 w-16" />
							<h3 className="mb-1 font-medium">No applications yet</h3>
							<p className="text-muted-foreground mb-6 text-sm">
								Apply for race funding to get started. The application takes
								about 15 minutes.
							</p>
							<Button asChild>
								<Link href="/fund/apply">Apply for Race Funding</Link>
							</Button>
						</div>
					) : (
						<div className="space-y-4">
							{applications.map(
								(app: {
									_id: string
									status: string
									race: string
									_creationTime: number
									raceDate?: number
								}) => {
									const config =
										STATUS_CONFIG[app.status as keyof typeof STATUS_CONFIG] ??
										STATUS_CONFIG.PENDING
									const Icon = config.icon
									return (
										<div
											key={app._id}
											className={cn(
												'rounded-2xl border p-4 transition-colors sm:p-5',
												config.surfaceClassName,
											)}
										>
											<div className="flex items-start justify-between gap-3">
												<div className="flex min-w-0 items-start gap-3">
													<div
														className={cn(
															'border-border/60 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
															config.iconWrapClassName,
														)}
													>
														<Icon
															className={cn(
																'h-5 w-5 shrink-0',
																config.iconClassName,
															)}
														/>
													</div>
													<div className="min-w-0">
														<div className="flex flex-wrap items-center gap-2">
															<span className="text-base font-semibold">
																{app.race}
															</span>
															<Badge
																variant="outline"
																className={cn(
																	'text-[11px] tracking-[0.14em] uppercase',
																	config.badgeClassName,
																)}
															>
																{config.label}
															</Badge>
														</div>
														<p className="text-muted-foreground mt-0.5 text-xs">
															Applied{' '}
															{format(
																new Date(app._creationTime),
																'MMMM d, yyyy',
															)}
														</p>
													</div>
												</div>
												{app.raceDate && (
													<div className="text-muted-foreground border-border/60 bg-background/80 flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium">
														<Trophy className="h-3 w-3" />
														{format(new Date(app.raceDate), 'MMM d, yyyy')}
													</div>
												)}
											</div>
											<p className="text-muted-foreground mt-4 text-sm leading-6">
												{config.message}
											</p>
										</div>
									)
								},
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
