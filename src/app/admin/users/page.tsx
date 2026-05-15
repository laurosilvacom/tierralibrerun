'use client'

import { useConvexAuth, usePaginatedQuery } from 'convex/react'
import { format } from 'date-fns'
import { ChevronRight, Users } from 'lucide-react'
import Link from 'next/link'
import { AdminPage, AdminPageHeader } from '@/components/admin/admin-page'
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

	const isLoading = isConvexAuthLoading || status === 'LoadingFirstPage'

	return (
		<AdminPage>
			<AdminPageHeader
				title="Users."
				description="Everyone signed in to Tierra Libre Run."
			/>

			{isLoading ? (
				<div className="space-y-3">
					{[...Array(5)].map((_, i) => (
						<div key={i} className="bg-muted h-20 animate-pulse rounded-2xl" />
					))}
				</div>
			) : !isConvexAuthenticated ? (
				<div className="text-muted-foreground py-24 text-center text-sm">
					Refresh the page to reconnect your admin session.
				</div>
			) : results.length === 0 ? (
				<div className="border-border bg-card rounded-2xl border p-12 text-center">
					<div className="bg-accent mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full">
						<Users className="text-primary h-5 w-5" strokeWidth={2} />
					</div>
					<h3 className="text-card-foreground text-base font-medium">
						No users yet
					</h3>
				</div>
			) : (
				<div className="space-y-3">
					{results.map((user) => (
						<Link
							key={user._id}
							href={`/admin/users/${user._id}`}
							className="border-border bg-card hover:border-ring/50 group flex items-center gap-4 rounded-2xl border p-5 transition-colors"
						>
							<Avatar className="h-10 w-10 shrink-0">
								<AvatarImage src={user.profileImageUrl ?? undefined} />
								<AvatarFallback className="text-xs font-medium">
									{initials(user.name)}
								</AvatarFallback>
							</Avatar>

							<div className="min-w-0 flex-1">
								<div className="flex flex-wrap items-center gap-2">
									<p className="text-card-foreground truncate text-base font-medium">
										{user.name ?? 'Unnamed'}
									</p>
									{user.fundApplicationLimitExempt && (
										<Badge variant="outline" className="text-xs font-normal">
											Exempt
										</Badge>
									)}
								</div>
								<p className="text-muted-foreground mt-0.5 truncate text-sm">
									{user.email}
								</p>
							</div>

							<div className="text-muted-foreground hidden text-right text-xs sm:block">
								<p>Joined</p>
								<p className="text-card-foreground mt-0.5 text-sm font-medium">
									{format(new Date(user._creationTime), 'MMM d, yyyy')}
								</p>
							</div>

							<ChevronRight className="text-muted-foreground group-hover:text-card-foreground h-4 w-4 shrink-0 transition-colors" />
						</Link>
					))}
				</div>
			)}

			{status === 'CanLoadMore' && (
				<div className="mt-6 flex justify-center">
					<Button variant="outline" onClick={() => loadMore(50)}>
						Load more
					</Button>
				</div>
			)}
		</AdminPage>
	)
}
