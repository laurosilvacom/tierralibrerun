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
import  { type Id } from '@/convex/_generated/dataModel'

export function DeleteUser({ userId }: { userId: Id<'users'> }) {
	const remove = useMutation(api.users.remove)
	const router = useRouter()
	const [loading, setLoading] = useState(false)

	async function handleDelete() {
		setLoading(true)
		try {
			await remove({ id: userId })
			toast.success('User deleted')
			router.push('/admin/users')
		} catch {
			toast.error('Failed to delete')
		} finally {
			setLoading(false)
		}
	}

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button
					size="sm"
					variant="ghost"
					disabled={loading}
					className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full"
				>
					<Trash2 className="mr-1 h-4 w-4" />
					Delete user
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete user?</AlertDialogTitle>
					<AlertDialogDescription>
						This will permanently delete the user and all their applications.
						This cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel className="rounded-full">
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDelete}
						className="bg-destructive hover:bg-destructive/90 rounded-full"
					>
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
