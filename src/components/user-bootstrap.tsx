'use client'

import { useUser } from '@clerk/nextjs'
import { useConvexAuth, useMutation } from 'convex/react'
import { useEffect, useRef } from 'react'
import { api } from '@/convex/_generated/api'

export function UserBootstrap() {
	const { user, isLoaded } = useUser()
	const { isAuthenticated, isLoading } = useConvexAuth()
	const getOrCreate = useMutation(api.users.getOrCreate)
	const bootstrappedClerkId = useRef<string | null>(null)

	useEffect(() => {
		if (!isLoaded || isLoading || !isAuthenticated || !user) return
		if (bootstrappedClerkId.current === user.id) return

		bootstrappedClerkId.current = user.id
		void getOrCreate().catch((error: unknown) => {
			bootstrappedClerkId.current = null
			console.error('Failed to bootstrap Convex user', error)
		})
	}, [getOrCreate, isAuthenticated, isLoaded, isLoading, user])

	return null
}
