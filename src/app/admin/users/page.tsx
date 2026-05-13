'use client'

import { useConvexAuth, usePaginatedQuery } from 'convex/react'
import { format } from 'date-fns'
import { Users } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'

function initials(name?: string | null) {
	if (!name) return '?'
	return name
		.split(' ')
		.map((n) => n[0])
		.join('')
		.toUpperCase()
		.slice(0, 2)
}

export default function UsersPage() {
	const {
		isAuthenticated: isConvexAuthenticated,
		isLoading: isConvexAuthLoading,
	} = useConvexAuth()
	const { results, status, loadMore } = usePaginatedQuery(
		api.users.list,
		isConvexAuthenticated ? {} : 'skip',
		{ initialNumItems: 50 },
	)

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Users</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					{results.length} user{results.length === 1 ? '' : 's'}
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
					<Users className="mb-4 h-12 w-12 opacity-20" />
					<p className="text-lg font-medium">No users yet</p>
				</div>
			) : (
				<div className="divide-y rounded-xl border">
					{results.map((user) => (
							<div
								key={user._id}
								className="hover:bg-muted/30 flex items-center gap-4 px-4 py-3 transition-colors"
							>
								<Avatar className="h-9 w-9 shrink-0">
									<AvatarImage src={user.profileImageUrl ?? undefined} />
									<AvatarFallback className="text-xs">
										{initials(user.name)}
									</AvatarFallback>
								</Avatar>

								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<span className="truncate font-medium">
											{user.name ?? 'Unnamed'}
										</span>
										{user.fundApplicationLimitExempt && (
											<Badge variant="outline" className="text-xs text-blue-600">
												Exempt
											</Badge>
										)}
									</div>
									<p className="text-muted-foreground truncate text-sm">
										{user.email}
									</p>
								</div>

								<div className="text-muted-foreground shrink-0 text-xs">
									{format(new Date(user._creationTime), 'MMM d, yyyy')}
								</div>

								<Link href={`/admin/users/${user._id}`}>
									<Button size="sm" variant="ghost" className="text-xs">
										View
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
