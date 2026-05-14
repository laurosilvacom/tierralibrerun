import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { type ReactNode } from 'react'

export default async function FundApplyLayout(props: { children: ReactNode }) {
	const { userId } = await auth()
	if (!userId) {
		redirect(`/?auth=sign-in&redirect_url=${encodeURIComponent('/fund/apply')}`)
	}
	return props.children
}
