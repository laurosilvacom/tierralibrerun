'use server'

import { auth } from '@clerk/nextjs/server'
import { fetchMutation } from 'convex/nextjs'
import { revalidatePath } from 'next/cache'
import { api } from '@/convex/_generated/api'
import { getAllRaceOptionsForApplication } from '@/lib/sanity/queries'

export interface SubmitFundApplicationInput {
	age: number
	zipcode: string
	bipocIdentity: boolean
	genderIdentity: string
	referralSource: string
	race: string
	firstRace: boolean
	experience: string
	reason: string
	goals?: string
	communityContribution: string
	tierraLibreContribution?: string
	additionalAssistanceNeeds?: string
	wantsMentor: boolean
	mentorGenderPreference?: string
}

/**
 * Resolve race date + location from Sanity for a given race name.
 * Called before submitting to Convex so we can pass the timestamps.
 */
export async function resolveRaceMetadata(raceName: string) {
	const raceOptions = await getAllRaceOptionsForApplication()
	const match = raceOptions?.find(
		(option) => `${option.raceSeries.name} - ${option.distance}` === raceName,
	)
	const raceDateRaw = match?.raceSeries?.date
	const raceDate =
		typeof raceDateRaw === 'string' && raceDateRaw.trim()
			? new Date(raceDateRaw)
			: null
	return {
		raceDate:
			raceDate && !isNaN(raceDate.getTime()) ? raceDate.getTime() : undefined,
		raceLocation: match?.raceSeries?.location ?? undefined,
	}
}

/**
 * Revalidate cached pages after a successful application submission.
 */
export async function revalidateApplicationPages() {
	revalidatePath('/dashboard')
	revalidatePath('/fund/apply')
}

export async function submitFundApplication(
	input: SubmitFundApplicationInput,
) {
	const { userId, getToken } = await auth()
	if (!userId) {
		throw new Error('Not authenticated')
	}

	const token = await getToken({ template: 'convex' })
	if (!token) {
		throw new Error(
			'Unable to verify your session for application submission. Refresh and try again.',
		)
	}

	const { raceDate, raceLocation } = await resolveRaceMetadata(input.race)

	await fetchMutation(
		api.applications.submit,
		{
			...input,
			raceDate,
			raceLocation,
		},
		{ token },
	)

	await revalidateApplicationPages()
}
