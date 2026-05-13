'use client'

import { useConvexAuth, useMutation, usePaginatedQuery } from 'convex/react'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import  { type Id } from '@/convex/_generated/dataModel'

export default function ApplicationsPage() {
	const {
		isAuthenticated: isConvexAuthenticated,
		isLoading: isConvexAuthLoading,
	} = useConvexAuth()
	const [actionLoading, setActionLoading] = useState<string | null>(null)

	const { results, status, loadMore } = usePaginatedQuery(
		api.applications.listByStatus,
		isConvexAuthenticated ? { status: 'PENDING' } : 'skip',
		{ initialNumItems: 50 },
	)

	const approve = useMutation(api.applications.approve)
	const deny = useMutation(api.applications.deny)

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

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Applications</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						{results.length} pending{' '}
						{results.length === 1 ? 'application' : 'applications'}
					</p>
				</div>
			</div>

			{isConvexAuthLoading || status === 'LoadingFirstPage' ? (
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
					<CheckCircle className="mb-4 h-12 w-12 opacity-20" />
					<p className="text-lg font-medium">All caught up</p>
					<p className="text-sm">No pending applications right now.</p>
				</div>
			) : (
				<div className="divide-y rounded-xl border">
					{results.map((app) => {
						const isLoading = actionLoading === app._id
						return (
							<div
								key={app._id}
								className="hover:bg-muted/30 flex items-center gap-4 px-4 py-4 transition-colors"
							>
								{/* Info */}
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<span className="truncate font-medium">{app.name}</span>
										{app.firstRace && (
											<Badge variant="outline" className="text-xs">
												First race
											</Badge>
										)}
										{app.wantsMentor && (
											<Badge variant="outline" className="text-xs">
												Wants mentor
											</Badge>
										)}
									</div>
									<div className="text-muted-foreground mt-0.5 flex items-center gap-3 text-sm">
										<span className="truncate">{app.race}</span>
										<span>·</span>
										<span className="flex items-center gap-1">
											<Clock className="h-3 w-3" />
											{formatDistanceToNow(new Date(app._creationTime), {
												addSuffix: true,
											})}
										</span>
									</div>
								</div>

								{/* Actions */}
								<div className="flex shrink-0 items-center gap-2">
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

			{status === 'CanLoadMore' && (
				<div className="flex justify-center">
					<Button variant="outline" onClick={() => loadMore(50)}>
						Load more
					</Button>
				</div>
			)}
		</div>
	)
}
