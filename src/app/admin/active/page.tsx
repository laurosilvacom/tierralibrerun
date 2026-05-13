'use client'

import { useConvexAuth, usePaginatedQuery } from 'convex/react'
import { format } from 'date-fns'
import { Trophy, Calendar, MapPin, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'

export default function ActiveAthletesPage() {
	const {
		isAuthenticated: isConvexAuthenticated,
		isLoading: isConvexAuthLoading,
	} = useConvexAuth()
	const { results, status, loadMore } = usePaginatedQuery(
		api.applications.listByStatus,
		isConvexAuthenticated ? { status: 'APPROVED' } : 'skip',
		{ initialNumItems: 50 },
	)

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Active Athletes</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					{results.length} approved athlete{results.length === 1 ? '' : 's'}
				</p>
			</div>

			{isConvexAuthLoading || status === 'LoadingFirstPage' ? (
				<div className="space-y-3">
					{[...Array(5)].map((_, i) => (
						<div key={i} className="bg-card h-16 animate-pulse rounded-xl" />
					))}
				</div>
			) : !isConvexAuthenticated ? (
				<div className="text-muted-foreground py-24 text-center">
					Refresh the page to reconnect your admin session.
				</div>
			) : results.length === 0 ? (
				<div className="text-muted-foreground flex flex-col items-center justify-center py-24 text-center">
					<Trophy className="mb-4 h-12 w-12 opacity-20" />
					<p className="text-lg font-medium">No active athletes yet</p>
					<p className="text-sm">Approve applications to see athletes here.</p>
				</div>
			) : (
				<div className="divide-y rounded-xl border">
					{results.map((app) => (
						<div
							key={app._id}
							className="hover:bg-muted/30 flex items-center gap-4 px-4 py-4 transition-colors"
						>
							{/* Info */}
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<span className="truncate font-medium">{app.name}</span>
									<Badge
										variant="outline"
										className="border-green-200 bg-green-50 text-xs text-green-700"
									>
										Approved
									</Badge>
									{app.wantsMentor && (
										<Badge variant="outline" className="text-xs">
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
								</div>
							</div>

							{/* Approved date */}
							<div className="text-muted-foreground shrink-0 text-xs">
								{app.reviewedAt
									? format(new Date(app.reviewedAt), 'MMM d')
									: ''}
							</div>

							<Link href={`/admin/applications/${app._id}`}>
								<Button size="sm" variant="ghost">
									<ChevronRight className="h-4 w-4" />
								</Button>
							</Link>
						</div>
					))}
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
