import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { type ReactNode } from 'react'

export default async function DashboardLayout(props: { children: ReactNode }) {
	const { userId } = await auth()
	if (!userId) redirect('/?auth=sign-in')
	return props.children
}
