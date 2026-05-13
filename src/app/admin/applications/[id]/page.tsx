'use client'

import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { format } from 'date-fns'
import {
	ArrowLeft,
	CheckCircle,
	XCircle,
	User,
	MapPin,
	Calendar,
	Heart,
	Trophy,
} from 'lucide-react'
import Link from 'next/link'
import { use, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/convex/_generated/api'
import  { type Id } from '@/convex/_generated/dataModel'

export default function ApplicationDetailPage({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const {
		isAuthenticated: isConvexAuthenticated,
		isLoading: isConvexAuthLoading,
	} = useConvexAuth()
	const { id } = use(params)
	const app = useQuery(
		api.applications.getById,
		isConvexAuthenticated ? { id: id as Id<'fundApplications'> } : 'skip',
	)

	const approve = useMutation(api.applications.approve)
	const deny = useMutation(api.applications.deny)
	const updateNotes = useMutation(api.applications.updateNotes)

	const [notes, setNotes] = useState('')
	const [loading, setLoading] = useState<'approve' | 'deny' | 'notes' | null>(
		null,
	)

	if (isConvexAuthLoading || app === undefined) {
		return (
			<div className="space-y-4">
				<div className="bg-card h-8 w-48 animate-pulse rounded" />
				<div className="bg-card h-64 animate-pulse rounded-xl" />
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

	if (app === null) {
		return (
			<div className="text-muted-foreground py-24 text-center">
				Application not found.
			</div>
		)
	}

	async function handleApprove() {
		if (!app) return
		if (!isConvexAuthenticated) {
			toast.error('Your admin session is not ready. Refresh and try again.')
			return
		}
		setLoading('approve')
		try {
			await approve({ id: app._id, adminNotes: notes || undefined })
			toast.success('Application approved')
			setNotes('')
		} catch {
			toast.error('Failed to approve')
		} finally {
			setLoading(null)
		}
	}

	async function handleDeny() {
		if (!app) return
		if (!isConvexAuthenticated) {
			toast.error('Your admin session is not ready. Refresh and try again.')
			return
		}
		setLoading('deny')
		try {
			await deny({ id: app._id, adminNotes: notes || undefined })
			toast.success('Application denied')
			setNotes('')
		} catch {
			toast.error('Failed to deny')
		} finally {
			setLoading(null)
		}
	}

	async function handleSaveNotes() {
		if (!app) return
		if (!isConvexAuthenticated) {
			toast.error('Your admin session is not ready. Refresh and try again.')
			return
		}
		setLoading('notes')
		try {
			await updateNotes({ id: app._id, adminNotes: notes })
			toast.success('Notes saved')
		} catch {
			toast.error('Failed to save notes')
		} finally {
			setLoading(null)
		}
	}

	const STATUS_COLOR = {
		PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
		APPROVED: 'bg-green-50 text-green-700 border-green-200',
		DENIED: 'bg-red-50 text-red-700 border-red-200',
	} as const
	const statusColor = STATUS_COLOR[app.status as keyof typeof STATUS_COLOR] ?? STATUS_COLOR.PENDING

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-center gap-3">
					<Link href="/admin/applications">
						<Button variant="ghost" size="sm">
							<ArrowLeft className="mr-1 h-4 w-4" />
							Back
						</Button>
					</Link>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-xl font-bold">{app.name}</h1>
							<span
								className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
							>
								{app.status}
							</span>
						</div>
						<p className="text-muted-foreground text-sm">
							{app.race}
							{app.raceDate
								? ` · ${format(new Date(app.raceDate), 'MMM d, yyyy')}`
								: ''}
						</p>
					</div>
				</div>

				{app.status === 'PENDING' && (
					<div className="flex gap-2">
						<Button
							variant="outline"
							onClick={handleDeny}
							disabled={!!loading}
							className="border-red-200 text-red-600 hover:bg-red-50"
						>
							<XCircle className="mr-1 h-4 w-4" />
							Deny
						</Button>
						<Button
							onClick={handleApprove}
							disabled={!!loading}
							className="bg-green-600 text-white hover:bg-green-700"
						>
							<CheckCircle className="mr-1 h-4 w-4" />
							Approve
						</Button>
					</div>
				)}
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Main content */}
				<div className="space-y-6 lg:col-span-2">
					{/* About the applicant */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">About Them</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
									Why this race
								</p>
								<p className="text-sm leading-relaxed whitespace-pre-line">
									{app.reason}
								</p>
							</div>
							{app.experience && (
								<div>
									<p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
										Access to trail running
									</p>
									<p className="text-sm leading-relaxed whitespace-pre-line">
										{app.experience}
									</p>
								</div>
							)}
							{app.goals && (
								<div>
									<p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
										Goals
									</p>
									<p className="text-sm leading-relaxed whitespace-pre-line">
										{app.goals}
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Community */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Community Impact</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
									Community contribution
								</p>
								<p className="text-sm leading-relaxed whitespace-pre-line">
									{app.communityContribution}
								</p>
							</div>
							{app.tierraLibreContribution && (
								<div>
									<p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
										Tierra Libre contribution
									</p>
									<p className="text-sm leading-relaxed whitespace-pre-line">
										{app.tierraLibreContribution}
									</p>
								</div>
							)}
							{app.additionalAssistanceNeeds && (
								<div>
									<p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wide">
										Additional assistance needs
									</p>
									<p className="text-sm leading-relaxed whitespace-pre-line">
										{app.additionalAssistanceNeeds}
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Sidebar */}
				<div className="space-y-4">
					{/* Demographics */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Applicant Info</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3 text-sm">
							<div className="flex items-center gap-2">
								<User className="text-muted-foreground h-4 w-4 shrink-0" />
								<span>{app.email}</span>
							</div>
							{app.age > 0 && (
								<div className="flex items-center gap-2">
									<span className="text-muted-foreground text-xs">Age</span>
									<span>{app.age}</span>
								</div>
							)}
							{app.zipcode && app.zipcode !== 'Not specified' && (
								<div className="flex items-center gap-2">
									<MapPin className="text-muted-foreground h-4 w-4 shrink-0" />
									<span>{app.zipcode}</span>
								</div>
							)}
							<Separator />
							<div className="flex flex-wrap gap-1.5">
								{app.bipocIdentity && (
									<Badge variant="outline" className="text-xs">
										BIPOC
									</Badge>
								)}
								{app.genderIdentity &&
									app.genderIdentity !== 'Not specified' && (
										<Badge variant="outline" className="text-xs">
											{app.genderIdentity}
										</Badge>
									)}
								{app.firstRace && (
									<Badge variant="outline" className="text-xs">
										First trail race
									</Badge>
								)}
								{app.wantsMentor && (
									<Badge variant="outline" className="text-xs">
										<Heart className="mr-1 h-3 w-3" />
										Wants mentor
									</Badge>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Race info */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Race</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<div className="flex items-start gap-2">
								<Trophy className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
								<span>{app.race}</span>
							</div>
							{app.raceDate && (
								<div className="flex items-center gap-2">
									<Calendar className="text-muted-foreground h-4 w-4 shrink-0" />
									<span>{format(new Date(app.raceDate), 'MMMM d, yyyy')}</span>
								</div>
							)}
							{app.raceLocation && (
								<div className="flex items-center gap-2">
									<MapPin className="text-muted-foreground h-4 w-4 shrink-0" />
									<span>{app.raceLocation}</span>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Submitted */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Submitted</CardTitle>
						</CardHeader>
						<CardContent className="text-sm">
							<p className="text-muted-foreground">
								{format(new Date(app._creationTime), 'MMMM d, yyyy h:mm a')}
							</p>
							{app.reviewedAt && (
								<p className="text-muted-foreground mt-1">
									Reviewed {format(new Date(app.reviewedAt), 'MMM d, yyyy')}
								</p>
							)}
						</CardContent>
					</Card>

					{/* Admin notes */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Admin Notes</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<Textarea
								placeholder="Add notes about this application..."
								value={notes || app.adminNotes || ''}
								onChange={(e) => setNotes(e.target.value)}
								rows={4}
								className="text-sm"
							/>
							<Button
								size="sm"
								variant="outline"
								onClick={handleSaveNotes}
								disabled={loading === 'notes'}
								className="w-full"
							>
								Save notes
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
