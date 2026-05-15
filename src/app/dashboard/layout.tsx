import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { type ReactNode } from 'react'
import { ensureConvexUserForCurrentSession } from '@/lib/convex-user'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout(props: { children: ReactNode }) {
	const { userId } = await auth()
	if (!userId) redirect('/?auth=sign-in')
	await ensureConvexUserForCurrentSession()
	return props.children
}
