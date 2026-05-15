'use client'

import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { format } from 'date-fns'
import {
	ArrowLeft,
	Calendar,
	Check,
	Clock,
	Heart,
	Mail,
	MapPin,
	Trophy,
	X,
} from 'lucide-react'
import Link from 'next/link'
import { use, useState } from 'react'
import { toast } from 'sonner'
import { DeleteApplication } from '@/components/admin/delete-application'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/convex/_generated/api'
import { type Id } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'

type Status = 'PENDING' | 'APPROVED' | 'DENIED'

const STATUS_CONFIG: Record<
	Status,
	{
		label: string
		icon: typeof Clock
		dotColor: string
		textColor: string
		bgColor: string
	}
> = {
	PENDING: {
		label: 'Pending',
		icon: Clock,
		dotColor: 'bg-primary',
		textColor: 'text-primary',
		bgColor: 'bg-primary/10',
	},
	APPROVED: {
		label: 'Approved',
		icon: Check,
		dotColor: 'bg-chart-5',
		textColor: 'text-chart-5',
		bgColor: 'bg-chart-5/10',
	},
	DENIED: {
		label: 'Not selected',
		icon: X,
		dotColor: 'bg-muted-foreground',
		textColor: 'text-muted-foreground',
		bgColor: 'bg-muted',
	},
}

function SectionCard({
	title,
	children,
}: {
	title: string
	children: React.ReactNode
}) {
	return (
		<div className="border-border bg-card rounded-2xl border p-6">
			<h2 className="text-foreground mb-4 text-base font-semibold tracking-tight">
				{title}
			</h2>
			<div className="space-y-5">{children}</div>
		</div>
	)
}

function Essay({ label, content }: { label: string; content?: string }) {
	if (!content) return null
	return (
		<div>
			<p className="text-muted-foreground mb-1.5 text-xs font-medium">
				{label}
			</p>
			<p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
				{content}
			</p>
		</div>
	)
}

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

	const [notes, setNotes] = useState<string | null>(null)
	const [loading, setLoading] = useState<'approve' | 'deny' | 'notes' | null>(
		null,
	)

	if (isConvexAuthLoading || app === undefined) {
		return (
			<div className="space-y-4">
				<div className="bg-muted h-6 w-32 animate-pulse rounded" />
				<div className="bg-muted h-10 w-72 animate-pulse rounded" />
				<div className="bg-muted mt-6 h-64 animate-pulse rounded-2xl" />
			</div>
		)
	}

	if (!isConvexAuthenticated) {
		return (
			<div className="text-muted-foreground py-24 text-center text-sm">
				Refresh the page to reconnect your admin session.
			</div>
		)
	}

	if (app === null) {
		return (
			<div className="animate-fade-in-up py-24 text-center">
				<p className="text-foreground text-lg font-medium">
					Application not found.
				</p>
				<div className="mt-6">
					<Button asChild variant="ghost" className="rounded-full">
						<Link href="/admin/applications">
							<ArrowLeft className="mr-1 h-4 w-4" />
							Back to applications
						</Link>
					</Button>
				</div>
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
			const notesValue = notes ?? app.adminNotes
			await approve({ id: app._id, adminNotes: notesValue || undefined })
			toast.success('Application approved')
			setNotes(null)
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
			const notesValue = notes ?? app.adminNotes
			await deny({ id: app._id, adminNotes: notesValue || undefined })
			toast.success('Application denied')
			setNotes(null)
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
			await updateNotes({ id: app._id, adminNotes: notes ?? '' })
			toast.success('Notes saved')
		} catch {
			toast.error('Failed to save notes')
		} finally {
			setLoading(null)
		}
	}

	const config = STATUS_CONFIG[app.status as Status] ?? STATUS_CONFIG.PENDING
	const isPending = app.status === 'PENDING'

	return (
		<div className="animate-fade-in-up">
			{/* Back */}
			<Link
				href="/admin/applications"
				className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium"
			>
				<ArrowLeft className="h-4 w-4" />
				Applications
			</Link>

			{/* Header */}
			<header className="mt-6 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
				<div>
					<div className="flex items-center gap-3">
						<h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
							{app.name}
						</h1>
					</div>
					<div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
						<span
							className={cn(
								'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
								config.bgColor,
								config.textColor,
							)}
						>
							<span className={cn('h-1.5 w-1.5 rounded-full', config.dotColor)} />
							{config.label}
						</span>
						<span>·</span>
						<span>{app.race}</span>
						{app.raceDate && (
							<>
								<span aria-hidden>·</span>
								<span>{format(new Date(app.raceDate), 'MMM d, yyyy')}</span>
							</>
						)}
					</div>
				</div>

				{isPending && (
					<div className="flex shrink-0 gap-2">
						<Button
							variant="ghost"
							onClick={handleDeny}
							disabled={!!loading}
							className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full"
						>
							Deny
						</Button>
						<Button
							onClick={handleApprove}
							disabled={!!loading}
							className="bg-chart-5 hover:bg-chart-5/90 rounded-full text-white"
						>
							Approve
						</Button>
					</div>
				)}
			</header>

			<div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
				{/* Main */}
				<div className="space-y-5 lg:col-span-2">
					<SectionCard title="About them">
						<Essay label="Why this race" content={app.reason} />
						<Essay
							label="Access to trail running"
							content={app.experience}
						/>
						<Essay label="Goals" content={app.goals} />
					</SectionCard>

					<SectionCard title="Community impact">
						<Essay
							label="Community contribution"
							content={app.communityContribution}
						/>
						<Essay
							label="Tierra Libre contribution"
							content={app.tierraLibreContribution}
						/>
						<Essay
							label="Additional assistance needs"
							content={app.additionalAssistanceNeeds}
						/>
					</SectionCard>
				</div>

				{/* Sidebar */}
				<div className="space-y-5">
					<SectionCard title="Applicant">
						<div className="space-y-3 text-sm">
							<div className="flex items-center gap-2">
								<Mail className="text-muted-foreground h-4 w-4 shrink-0" />
								<span className="break-words">{app.email}</span>
							</div>
							{app.age > 0 && (
								<div className="text-muted-foreground flex items-center gap-2 text-xs">
									<span>Age</span>
									<span className="text-foreground text-sm">{app.age}</span>
								</div>
							)}
							{app.zipcode && app.zipcode !== 'Not specified' && (
								<div className="flex items-center gap-2">
									<MapPin className="text-muted-foreground h-4 w-4 shrink-0" />
									<span>{app.zipcode}</span>
								</div>
							)}
						</div>
						<div className="flex flex-wrap gap-1.5">
							{app.bipocIdentity && (
								<Badge variant="outline" className="text-xs font-normal">
									BIPOC
								</Badge>
							)}
							{app.genderIdentity &&
								app.genderIdentity !== 'Not specified' && (
									<Badge variant="outline" className="text-xs font-normal">
										{app.genderIdentity}
									</Badge>
								)}
							{app.firstRace && (
								<Badge variant="outline" className="text-xs font-normal">
									First trail race
								</Badge>
							)}
							{app.wantsMentor && (
								<Badge variant="outline" className="text-xs font-normal">
									<Heart className="mr-1 h-3 w-3" />
									Wants mentor
								</Badge>
							)}
						</div>
					</SectionCard>

					<SectionCard title="Race">
						<div className="space-y-3 text-sm">
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
						</div>
					</SectionCard>

					<SectionCard title="Submitted">
						<p className="text-muted-foreground text-sm">
							{format(new Date(app._creationTime), 'MMMM d, yyyy · h:mm a')}
						</p>
						{app.reviewedAt && (
							<p className="text-muted-foreground text-sm">
								Reviewed {format(new Date(app.reviewedAt), 'MMM d, yyyy')}
							</p>
						)}
					</SectionCard>

					<SectionCard title="Admin notes">
						<Textarea
							placeholder="Notes on this application…"
							value={notes ?? app.adminNotes ?? ''}
							onChange={(e) => setNotes(e.target.value)}
							rows={4}
							className="resize-none text-sm leading-relaxed"
						/>
						<Button
							size="sm"
							variant="outline"
							onClick={handleSaveNotes}
							disabled={loading === 'notes'}
							className="w-full rounded-full"
						>
							Save notes
						</Button>
					</SectionCard>

					<div className="px-2">
						<DeleteApplication id={app._id} />
					</div>
				</div>
			</div>
		</div>
	)
}
