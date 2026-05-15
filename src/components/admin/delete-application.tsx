'use client'

import { useMutation } from 'convex/react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import { type Id } from '@/convex/_generated/dataModel'

export function DeleteApplication({ id }: { id: Id<'fundApplications'> }) {
	const remove = useMutation(api.applications.remove)
	const router = useRouter()
	const [loading, setLoading] = useState(false)

	async function handleDelete() {
		setLoading(true)
		try {
			await remove({ id })
			toast.success('Application deleted')
			router.push('/admin/applications')
		} catch {
			toast.error('Failed to delete')
		} finally {
			setLoading(false)
		}
	}

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button size="sm" variant="destructive" disabled={loading}>
					<Trash2 className="h-4 w-4" />
					Delete application
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete application?</AlertDialogTitle>
					<AlertDialogDescription>
						This cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction variant="destructive" onClick={handleDelete}>
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
