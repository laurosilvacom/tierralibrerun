'use client'

import { useMutation } from 'convex/react'
import { format } from 'date-fns'
import { Clock, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { api } from '@/convex/_generated/api'
import { type Id } from '@/convex/_generated/dataModel'

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000

export function LimitExemptToggle({
	userId,
	currentValue,
	lastApplicationAt,
}: {
	userId: Id<'users'>
	currentValue: boolean
	lastApplicationAt: number | null
}) {
	const setExempt = useMutation(api.users.setLimitExempt)
	const [loading, setLoading] = useState(false)

	async function handleToggle(checked: boolean) {
		setLoading(true)
		try {
			await setExempt({ userId, exempt: checked })
			toast.success(checked ? 'Exemption granted' : 'Exemption removed')
		} catch {
			toast.error('Failed to update exemption')
		} finally {
			setLoading(false)
		}
	}

	const cooldownEndsAt = lastApplicationAt
		? lastApplicationAt + SIX_MONTHS_MS
		: null
	const isInCooldown = !!cooldownEndsAt && cooldownEndsAt > Date.now()

	return (
		<div className="space-y-4">
			{currentValue ? (
				<div className="border-chart-5/30 bg-chart-5/10 flex items-start gap-3 rounded-lg border p-3">
					<ShieldCheck className="text-chart-5 mt-0.5 h-4 w-4 shrink-0" />
					<div className="text-xs leading-relaxed">
						<p className="text-foreground font-medium">Exemption active</p>
						<p className="text-muted-foreground mt-0.5">
							This user can submit applications at any time, bypassing the
							six-month cooldown.
						</p>
					</div>
				</div>
			) : isInCooldown ? (
				<div className="border-border bg-muted/40 flex items-start gap-3 rounded-lg border p-3">
					<Clock className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
					<div className="text-xs leading-relaxed">
						<p className="text-foreground font-medium">In cooldown</p>
						<p className="text-muted-foreground mt-0.5">
							Last applied{' '}
							{format(new Date(lastApplicationAt!), 'MMM d, yyyy')}. Eligible
							again {format(new Date(cooldownEndsAt!), 'MMM d, yyyy')}.
						</p>
					</div>
				</div>
			) : (
				<div className="border-border bg-muted/40 flex items-start gap-3 rounded-lg border p-3">
					<Clock className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
					<div className="text-xs leading-relaxed">
						<p className="text-foreground font-medium">No cooldown active</p>
						<p className="text-muted-foreground mt-0.5">
							{lastApplicationAt
								? `Last applied ${format(new Date(lastApplicationAt), 'MMM d, yyyy')}. Eligible to apply now.`
								: 'No applications yet.'}
						</p>
					</div>
				</div>
			)}

			<div className="flex items-start gap-3">
				<Switch
					id="exempt"
					checked={currentValue}
					onCheckedChange={handleToggle}
					disabled={loading}
					className="mt-0.5"
				/>
				<div>
					<Label htmlFor="exempt" className="text-sm font-medium">
						Exempt from application limit
					</Label>
					<p className="text-muted-foreground mt-1 text-xs leading-relaxed">
						Lets this user apply more than once every six months.
					</p>
				</div>
			</div>
		</div>
	)
}
