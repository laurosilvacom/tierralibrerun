'use client'

import { useConvexAuth, useQuery } from 'convex/react'
import { format } from 'date-fns'
import { ArrowLeft, Mail, CheckCircle, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'
import { DeleteUser } from '@/components/admin/delete-user'
import { LimitExemptToggle } from '@/components/admin/limit-exempt'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/convex/_generated/api'
import { type Id } from '@/convex/_generated/dataModel'

function initials(name?: string | null) {
	if (!name) return '?'
	return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

const STATUS_ICONS = {
	PENDING: <Clock className="h-4 w-4 text-amber-500" />,
	APPROVED: <CheckCircle className="h-4 w-4 text-green-500" />,
	DENIED: <XCircle className="h-4 w-4 text-slate-400" />,
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
				<div className="bg-card h-8 w-40 animate-pulse rounded" />
				<div className="bg-card h-48 animate-pulse rounded-xl" />
			</div>
		)
	}

	if (!isConvexAuthenticated) {
		return (
			<div className="text-muted-foreground py-24 text-center">
				Refresh the page to reconnect your admin session.
			</div>
		)
	}

	if (user === null) {
		return <div className="text-muted-foreground py-24 text-center">User not found.</div>
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Link href="/admin/users">
					<Button variant="ghost" size="sm">
						<ArrowLeft className="mr-1 h-4 w-4" />
						Back
					</Button>
				</Link>
				<div className="flex items-center gap-3">
					<Avatar className="h-10 w-10">
						<AvatarFallback>{initials(user.name)}</AvatarFallback>
					</Avatar>
					<div>
						<h1 className="font-bold">{user.name ?? 'Unnamed'}</h1>
						<p className="text-muted-foreground text-sm">{user.email}</p>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="space-y-4 lg:col-span-2">
					{/* Applications */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Fund Applications</CardTitle>
						</CardHeader>
						<CardContent>
							{!userApps || userApps.length === 0 ? (
								<p className="text-muted-foreground text-sm">No applications yet.</p>
							) : (
								<div className="divide-y">
									{userApps.map((app: { _id: string; status: string; race: string; _creationTime: number }) => (
										<div key={app._id} className="flex items-center gap-3 py-3">
											{STATUS_ICONS[app.status as keyof typeof STATUS_ICONS]}
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													<span className="truncate text-sm font-medium">{app.race}</span>
													<Badge variant="outline" className="text-xs">{app.status}</Badge>
												</div>
												<p className="text-muted-foreground text-xs">
													{format(new Date(app._creationTime), 'MMM d, yyyy')}
												</p>
											</div>
											<Link href={`/admin/applications/${app._id}`}>
												<Button size="sm" variant="ghost" className="text-xs">View</Button>
											</Link>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				<div className="space-y-4">
					{/* Profile */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Profile</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<div className="flex items-center gap-2 text-muted-foreground">
								<Mail className="h-4 w-4" />
								{user.email}
							</div>
							<div className="flex flex-wrap gap-1.5 pt-1">
								{user.fundApplicationLimitExempt && (
									<Badge variant="outline" className="border-blue-200 text-blue-700">
										Limit exempt
									</Badge>
								)}
							</div>
							<p className="text-muted-foreground text-xs pt-1">
								Joined {format(new Date(user._creationTime), 'MMMM d, yyyy')}
							</p>
						</CardContent>
					</Card>

					{/* Admin controls */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Admin Controls</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<LimitExemptToggle
								userId={user._id}
								currentValue={user.fundApplicationLimitExempt}
							/>
							<DeleteUser userId={user._id} />
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
