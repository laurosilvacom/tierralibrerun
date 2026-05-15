'use client'

import { useMutation } from 'convex/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { api } from '@/convex/_generated/api'
import  { type Id } from '@/convex/_generated/dataModel'

export function LimitExemptToggle({
	userId,
	currentValue,
}: {
	userId: Id<'users'>
	currentValue: boolean
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

	return (
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
	)
}
