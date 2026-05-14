'use client'

import {
	useConvexAuth,
	useMutation,
	usePaginatedQuery,
	useQuery,
} from 'convex/react'
import { format, formatDistanceToNow } from 'date-fns'
import {
	CheckCircle,
	XCircle,
	Clock,
	ChevronRight,
	Trophy,
	Calendar,
	MapPin,
	Heart,
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import { type Id } from '@/convex/_generated/dataModel'

type Status = 'PENDING' | 'APPROVED' | 'DENIED'
type TabKey = 'all' | Status

const TABS: { key: TabKey; label: string }[] = [
	{ key: 'all', label: 'All' },
	{ key: 'PENDING', label: 'Pending' },
	{ key: 'APPROVED', label: 'Approved' },
	{ key: 'DENIED', label: 'Denied' },
]

const STATUS_STYLE: Record<Status, string> = {
	PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
	APPROVED: 'bg-green-50 text-green-700 border-green-200',
	DENIED: 'bg-red-50 text-red-700 border-red-200',
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

	function setTab(tab: TabKey) {
		const params = new URLSearchParams(searchParams.toString())
		if (tab === 'all') {
			params.delete('status')
		} else {
			params.set('status', tab)
		}
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

	const countFor = (tab: TabKey): number | undefined => {
		if (!counts) return undefined
		if (tab === 'all') return counts.total
		if (tab === 'PENDING') return counts.pending
		if (tab === 'APPROVED') return counts.approved
		if (tab === 'DENIED') return counts.denied
		return undefined
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Applications</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					{counts
						? `${counts.total} total — ${counts.pending} pending, ${counts.approved} approved, ${counts.denied} denied`
						: 'Loading counts...'}
				</p>
			</div>

			{/* Tabs */}
			<div className="flex gap-1 rounded-lg border p-1">
				{TABS.map((tab) => {
					const count = countFor(tab.key)
					const isActive = activeTab === tab.key
					return (
						<button
							key={tab.key}
							onClick={() => setTab(tab.key)}
							className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
								isActive
									? 'bg-foreground text-background'
									: 'text-muted-foreground hover:text-foreground hover:bg-muted'
							}`}
						>
							{tab.label}
							{count !== undefined && (
								<span
									className={`rounded-full px-1.5 py-0.5 text-xs ${
										isActive
											? 'bg-background/20 text-background'
											: 'bg-muted text-muted-foreground'
									}`}
								>
									{count}
								</span>
							)}
						</button>
					)
				})}
			</div>

			{/* List */}
			{isConvexAuthLoading || queryStatus === 'LoadingFirstPage' ? (
				<div className="space-y-3">
					{[...Array(5)].map((_, i) => (
						<div key={i} className="bg-card h-20 animate-pulse rounded-xl" />
					))}
				</div>
			) : !isConvexAuthenticated ? (
				<div className="text-muted-foreground py-24 text-center">
					Refresh the page to reconnect your admin session.
				</div>
			) : results.length === 0 ? (
				<div className="text-muted-foreground flex flex-col items-center justify-center py-24 text-center">
					<Trophy className="mb-4 h-12 w-12 opacity-20" />
					<p className="text-lg font-medium">No applications</p>
					<p className="text-sm">
						{activeTab === 'all'
							? 'No applications have been submitted yet.'
							: `No ${activeTab.toLowerCase()} applications.`}
					</p>
				</div>
			) : (
				<div className="divide-y rounded-xl border">
					{results.map((app) => {
						const isLoading = actionLoading === app._id
						const appStatus = app.status as Status
						return (
							<div
								key={app._id}
								className="hover:bg-muted/30 flex items-center gap-4 px-4 py-4 transition-colors"
							>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<span className="truncate font-medium">{app.name}</span>
										<span
											className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[appStatus]}`}
										>
											{appStatus}
										</span>
										{app.firstRace && (
											<Badge variant="outline" className="text-xs">
												First race
											</Badge>
										)}
										{app.wantsMentor && (
											<Badge variant="outline" className="text-xs">
												<Heart className="mr-1 h-3 w-3" />
												Mentor
											</Badge>
										)}
									</div>
									<div className="text-muted-foreground mt-0.5 flex items-center gap-3 text-sm">
										<span className="flex items-center gap-1 truncate">
											<Trophy className="h-3 w-3 shrink-0" />
											{app.race}
										</span>
										{app.raceDate && (
											<>
												<span>·</span>
												<span className="flex shrink-0 items-center gap-1">
													<Calendar className="h-3 w-3" />
													{format(new Date(app.raceDate), 'MMM d, yyyy')}
												</span>
											</>
										)}
										{app.raceLocation && (
											<>
												<span>·</span>
												<span className="flex shrink-0 items-center gap-1">
													<MapPin className="h-3 w-3" />
													{app.raceLocation}
												</span>
											</>
										)}
										<span>·</span>
										<span className="flex shrink-0 items-center gap-1">
											<Clock className="h-3 w-3" />
											{formatDistanceToNow(new Date(app._creationTime), {
												addSuffix: true,
											})}
										</span>
									</div>
								</div>

								<div className="flex shrink-0 items-center gap-2">
									{appStatus === 'PENDING' && (
										<>
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleDeny(app._id)}
												disabled={isLoading}
												className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
											>
												<XCircle className="mr-1 h-4 w-4" />
												Deny
											</Button>
											<Button
												size="sm"
												onClick={() => handleApprove(app._id)}
												disabled={isLoading}
												className="bg-green-600 text-white hover:bg-green-700"
											>
												<CheckCircle className="mr-1 h-4 w-4" />
												Approve
											</Button>
										</>
									)}
									{appStatus !== 'PENDING' && app.reviewedAt && (
										<span className="text-muted-foreground text-xs">
											{format(new Date(app.reviewedAt), 'MMM d')}
										</span>
									)}
									<Link href={`/admin/applications/${app._id}`}>
										<Button size="sm" variant="ghost">
											<ChevronRight className="h-4 w-4" />
										</Button>
									</Link>
								</div>
							</div>
						)
					})}
				</div>
			)}

			{queryStatus === 'CanLoadMore' && (
				<div className="flex justify-center">
					<Button variant="outline" onClick={() => loadMore(50)}>
						Load more
					</Button>
				</div>
			)}
		</div>
	)
}
