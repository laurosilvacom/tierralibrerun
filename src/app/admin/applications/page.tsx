'use client'

import {
	useConvexAuth,
	useMutation,
	usePaginatedQuery,
	useQuery,
} from 'convex/react'
import { formatDistanceToNow, format } from 'date-fns'
import {
	Check,
	Clock,
	X,
	ChevronRight,
	Heart,
	Trophy,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/convex/_generated/api'
import { type Id } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'

type Status = 'PENDING' | 'APPROVED' | 'DENIED'
type TabKey = 'all' | Status

const STATUS_CONFIG: Record<
	Status,
	{
		label: string
		icon: typeof Clock
		iconWrap: string
		iconColor: string
		dotColor: string
		textColor: string
	}
> = {
	PENDING: {
		label: 'Pending',
		icon: Clock,
		iconWrap: 'bg-primary/10',
		iconColor: 'text-primary',
		dotColor: 'bg-primary',
		textColor: 'text-primary',
	},
	APPROVED: {
		label: 'Approved',
		icon: Check,
		iconWrap: 'bg-chart-5/10',
		iconColor: 'text-chart-5',
		dotColor: 'bg-chart-5',
		textColor: 'text-chart-5',
	},
	DENIED: {
		label: 'Not selected',
		icon: X,
		iconWrap: 'bg-muted',
		iconColor: 'text-muted-foreground',
		dotColor: 'bg-muted-foreground',
		textColor: 'text-muted-foreground',
	},
}

function MetricCell({
	label,
	value,
	highlight,
}: {
	label: string
	value: number | undefined
	highlight?: 'primary' | 'chart-5'
}) {
	const tone = value && value > 0 ? highlight : undefined
	return (
		<div className="p-4 md:p-5">
			<p
				className={cn(
					'text-2xl font-semibold tracking-tight tabular-nums md:text-3xl',
					tone === 'primary' && 'text-primary',
					tone === 'chart-5' && 'text-chart-5',
					!tone && 'text-foreground',
				)}
			>
				{value ?? '—'}
			</p>
			<p className="text-muted-foreground mt-1 text-xs font-medium">{label}</p>
		</div>
	)
}

export default function ApplicationsPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const rawTab = searchParams.get('status')
	const activeTab: TabKey =
		rawTab === 'PENDING' || rawTab === 'APPROVED' || rawTab === 'DENIED'
			? rawTab
			: 'all'

	const {
		isAuthenticated: isConvexAuthenticated,
		isLoading: isConvexAuthLoading,
	} = useConvexAuth()

	const counts = useQuery(
		api.applications.counts,
		isConvexAuthenticated ? {} : 'skip',
	)

	const allQuery = usePaginatedQuery(
		api.applications.listAll,
		activeTab === 'all' && isConvexAuthenticated ? {} : 'skip',
		{ initialNumItems: 50 },
	)
	const filteredQuery = usePaginatedQuery(
		api.applications.listByStatus,
		activeTab !== 'all' && isConvexAuthenticated
			? { status: activeTab }
			: 'skip',
		{ initialNumItems: 50 },
	)

	const {
		results,
		status: queryStatus,
		loadMore,
	} = activeTab === 'all' ? allQuery : filteredQuery

	const [actionLoading, setActionLoading] = useState<string | null>(null)
	const approve = useMutation(api.applications.approve)
	const deny = useMutation(api.applications.deny)

	function setTab(tab: string) {
		const params = new URLSearchParams(searchParams.toString())
		if (tab === 'all') params.delete('status')
		else params.set('status', tab)
		router.replace(`/admin/applications?${params.toString()}`)
	}

	async function handleApprove(id: Id<'fundApplications'>) {
		if (!isConvexAuthenticated) {
			toast.error('Your admin session is not ready. Refresh and try again.')
			return
		}
		setActionLoading(id)
		try {
			await approve({ id })
			toast.success('Application approved')
		} catch {
			toast.error('Failed to approve')
		} finally {
			setActionLoading(null)
		}
	}

	async function handleDeny(id: Id<'fundApplications'>) {
		if (!isConvexAuthenticated) {
			toast.error('Your admin session is not ready. Refresh and try again.')
			return
		}
		setActionLoading(id)
		try {
			await deny({ id })
			toast.success('Application denied')
		} catch {
			toast.error('Failed to deny')
		} finally {
			setActionLoading(null)
		}
	}

	const isLoading = isConvexAuthLoading || queryStatus === 'LoadingFirstPage'

	return (
		<div className="animate-fade-in-up">
			{/* Header */}
			<header className="mb-10">
				<p className="text-muted-foreground text-sm font-medium">Admin</p>
				<h1 className="text-foreground mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
					Applications.
				</h1>
				<p className="text-muted-foreground mt-2 text-base leading-relaxed md:text-lg">
					Review, approve, and track race funding requests.
				</p>
			</header>

			{/* Metrics */}
			<div className="border-border bg-card divide-border mb-10 grid grid-cols-4 divide-x rounded-2xl border">
				<MetricCell label="Total" value={counts?.total} />
				<MetricCell
					label="Pending"
					value={counts?.pending}
					highlight="primary"
				/>
				<MetricCell
					label="Approved"
					value={counts?.approved}
					highlight="chart-5"
				/>
				<MetricCell label="Not selected" value={counts?.denied} />
			</div>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setTab} className="mb-6">
				<TabsList>
					<TabsTrigger value="all">All</TabsTrigger>
					<TabsTrigger value="PENDING">Pending</TabsTrigger>
					<TabsTrigger value="APPROVED">Approved</TabsTrigger>
					<TabsTrigger value="DENIED">Not selected</TabsTrigger>
				</TabsList>
			</Tabs>

			{/* List */}
			{isLoading ? (
				<div className="space-y-3">
					{[...Array(4)].map((_, i) => (
						<div
							key={i}
							className="bg-muted h-28 animate-pulse rounded-2xl"
						/>
					))}
				</div>
			) : !isConvexAuthenticated ? (
				<div className="text-muted-foreground py-24 text-center text-sm">
					Refresh the page to reconnect your admin session.
				</div>
			) : results.length === 0 ? (
				<div className="border-border bg-card rounded-2xl border p-12 text-center">
					<div className="bg-muted mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full">
						<Trophy
							className="text-muted-foreground h-5 w-5"
							strokeWidth={2}
						/>
					</div>
					<h3 className="text-foreground text-base font-medium">
						No applications
					</h3>
					<p className="text-muted-foreground mx-auto mt-2 max-w-sm text-sm leading-relaxed">
						{activeTab === 'all'
							? 'No applications have been submitted yet.'
							: `No ${STATUS_CONFIG[activeTab as Status].label.toLowerCase()} applications.`}
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{results.map((app) => {
						const config =
							STATUS_CONFIG[app.status as Status] ?? STATUS_CONFIG.PENDING
						const Icon = config.icon
						const loading = actionLoading === app._id
						const isPending = app.status === 'PENDING'

						return (
							<div
								key={app._id}
								className="border-border bg-card hover:border-foreground/20 rounded-2xl border p-5 transition-colors"
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
										<div className="flex flex-wrap items-start justify-between gap-3">
											<div className="min-w-0">
												<p className="text-foreground truncate text-base font-medium">
													{app.name}
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
														{config.label}
													</span>
													<span aria-hidden>·</span>
													<span>
														{formatDistanceToNow(new Date(app._creationTime), {
															addSuffix: true,
														})}
													</span>
												</div>
											</div>

											<div className="flex shrink-0 items-center gap-2">
												{isPending && (
													<>
														<Button
															size="sm"
															variant="ghost"
															onClick={() => handleDeny(app._id)}
															disabled={loading}
															className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full"
														>
															Deny
														</Button>
														<Button
															size="sm"
															onClick={() => handleApprove(app._id)}
															disabled={loading}
															className="bg-chart-5 hover:bg-chart-5/90 rounded-full text-white"
														>
															Approve
														</Button>
													</>
												)}
												{!isPending && app.reviewedAt && (
													<span className="text-muted-foreground text-xs">
														{format(new Date(app.reviewedAt), 'MMM d')}
													</span>
												)}
												<Link
													href={`/admin/applications/${app._id}`}
													aria-label="View application details"
												>
													<Button size="icon" variant="ghost" className="rounded-full">
														<ChevronRight className="h-4 w-4" />
													</Button>
												</Link>
											</div>
										</div>

										<p className="text-foreground mt-3 text-sm">{app.race}</p>
										<div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 text-xs">
											{app.raceDate && (
												<span>
													{format(new Date(app.raceDate), 'MMM d, yyyy')}
												</span>
											)}
											{app.raceLocation && (
												<>
													{app.raceDate && <span aria-hidden>·</span>}
													<span>{app.raceLocation}</span>
												</>
											)}
										</div>

										{(app.firstRace || app.wantsMentor) && (
											<div className="mt-3 flex flex-wrap gap-2">
												{app.firstRace && (
													<Badge variant="outline" className="text-xs font-normal">
														First race
													</Badge>
												)}
												{app.wantsMentor && (
													<Badge variant="outline" className="text-xs font-normal">
														<Heart className="mr-1 h-3 w-3" />
														Wants mentor
													</Badge>
												)}
											</div>
										)}
									</div>
								</div>
							</div>
						)
					})}
				</div>
			)}

			{queryStatus === 'CanLoadMore' && (
				<div className="mt-6 flex justify-center">
					<Button
						variant="outline"
						onClick={() => loadMore(50)}
						className="rounded-full px-6"
					>
						Load more
					</Button>
				</div>
			)}
		</div>
	)
}
