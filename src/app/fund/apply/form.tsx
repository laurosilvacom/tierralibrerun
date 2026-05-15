'use client'

import {
	ChevronLeft,
	Check,
	ArrowRight,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { submitFundApplication } from './server'
import RaceSelector from '@/components/race-selector'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { type RaceOptionForApplication } from '@/lib/sanity/types'
import { cn } from '@/lib/utils'

/* =======================================================
   Types & Constants
   ======================================================= */

interface ApplicationFormProps {
	userData: {
		name: string
		email: string
		userId: string
	}
	applicationStatus: {
		applications: Array<{
			id: string
			race: string
			status: string
			workflowStage?: string
			createdAt: Date
		}>
		applicationCount: number
		remainingApplications: number
		appliedRaces: string[]
	}
	raceOptions: RaceOptionForApplication[]
}

interface ApplicationFormData {
	bipocIdentity: string
	genderIdentity: string
	age: string
	zipcode: string
	referralSource: string
	race: string
	firstRace: string
	reason: string
	experience: string
	goals: string
	communityContribution: string
	tierraLibreContribution: string
	wantsMentor: string
	mentorGenderPreference: string
	needsAssistance: string
}

const TOTAL_STEPS = 7
const DRAFT_KEY = 'app-fund-application-draft-v4'

const CHAR_MIN_STANDARD = 300
const CHAR_MIN_RACE = 300
const CHAR_MIN_COMMUNITY = 350
const CHAR_MIN_MENTOR_DETAIL = 150

const CHAR_MAX_LONG = 2000
const CHAR_MAX_MEDIUM = 1500

const STEP_LABELS = [
	'About you',
	'Your race',
	'Your story',
	'Why this race',
	'The ripple',
	'Mentorship',
	'Review',
] as const

const STEP_SUBTITLES = [
	'A few quick details so we know who you are.',
	'Pick the race you’d like us to support.',
	'Help us understand your relationship with trail running.',
	'What makes this race matter to you right now?',
	'How will this experience move beyond you?',
	'Optional, but encouraged.',
	'A final look before you submit.',
] as const

const REFERRAL_OPTIONS = [
	'Instagram',
	'Friend or family',
	'Trail running event',
	'Another athlete',
	'Coach or running club',
	'Web search',
	'Other',
]

const GENDER_OPTIONS = [
	'Woman',
	'Man',
	'Non-binary',
	'Genderqueer',
	'Agender',
	'Two-spirit',
	'Prefer to self-describe',
	'Prefer not to say',
]

/* =======================================================
   Component
   ======================================================= */

export default function ApplicationForm({
	userData,
	applicationStatus,
	raceOptions,
}: ApplicationFormProps) {
	const [started, setStarted] = useState(false)
	const [currentStep, setCurrentStep] = useState(1)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [formData, setFormData] = useState<ApplicationFormData>({
		bipocIdentity: '',
		genderIdentity: '',
		age: '',
		zipcode: '',
		referralSource: '',
		race: '',
		firstRace: '',
		reason: '',
		experience: '',
		goals: '',
		communityContribution: '',
		tierraLibreContribution: '',
		wantsMentor: '',
		mentorGenderPreference: '',
		needsAssistance: '',
	})
	const router = useRouter()
	const searchParams = useSearchParams()
	const contentRef = useRef<HTMLDivElement>(null)
	const canStartApplication = applicationStatus.remainingApplications > 0

	const scrollToTop = useCallback(() => {
		contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
	}, [])

	useEffect(() => {
		const raceParam = searchParams.get('race')
		if (raceParam && !formData.race && raceOptions.length > 0) {
			const decoded = decodeURIComponent(raceParam)
			const match =
				raceOptions.find(
					(o) => `${o.raceSeries.name} - ${o.distance}` === decoded,
				) ??
				raceOptions.find(
					(o) =>
						o.raceSeries.name.toLowerCase().includes(decoded.toLowerCase()) ||
						o.distance.toLowerCase().includes(decoded.toLowerCase()),
				)
			if (match) {
				setFormData((prev) => ({
					...prev,
					race: `${match.raceSeries.name} - ${match.distance}`,
				}))
			}
		}
	}, [searchParams, formData.race, raceOptions])

	useEffect(() => {
		const timer = setTimeout(() => {
			try {
				sessionStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
			} catch {
				/* ignore */
			}
		}, 1000)
		return () => clearTimeout(timer)
	}, [formData])

	useEffect(() => {
		try {
			const saved = sessionStorage.getItem(DRAFT_KEY)
			if (saved) {
				const parsed = JSON.parse(saved)
				if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
					setFormData((prev) => {
						const merged = { ...prev, ...parsed }
						// Preserve a URL-prefilled race (set by the race-prefill effect
						// above, which runs first) over a stale draft.
						if (prev.race) merged.race = prev.race
						return merged
					})
				}
			}
		} catch {
			/* ignore */
		}
	}, [])

	const updateField = (field: keyof ApplicationFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
	}

	/* =======================================================
	   Validation
	   ======================================================= */

	const isStepComplete = (step: number): boolean => {
		switch (step) {
			case 1: {
				const age = parseInt(formData.age)
				return !!(
					formData.bipocIdentity &&
					formData.genderIdentity &&
					formData.age &&
					!isNaN(age) &&
					age >= 18 &&
					formData.zipcode?.trim().length >= 3 &&
					formData.referralSource
				)
			}
			case 2:
				return !!(formData.race && formData.firstRace)
			case 3:
				return !!(
					formData.reason.length >= CHAR_MIN_STANDARD &&
					formData.experience.length >= CHAR_MIN_STANDARD
				)
			case 4:
				return formData.goals.length >= CHAR_MIN_RACE
			case 5:
				return formData.communityContribution.length >= CHAR_MIN_COMMUNITY
			case 6: {
				if (!formData.wantsMentor) return false
				if (
					formData.wantsMentor === 'yes' &&
					formData.tierraLibreContribution.length < CHAR_MIN_MENTOR_DETAIL
				) {
					return false
				}
				return true
			}
			default:
				return true
		}
	}

	const nextStep = () => {
		if (currentStep < TOTAL_STEPS && isStepComplete(currentStep)) {
			setCurrentStep((prev) => prev + 1)
			scrollToTop()
		}
	}

	const prevStep = () => {
		if (currentStep > 1) {
			setCurrentStep((prev) => prev - 1)
			scrollToTop()
		}
	}

	const goToStep = (step: number) => {
		if (step >= 1 && step <= TOTAL_STEPS) {
			setCurrentStep(step)
			scrollToTop()
		}
	}

	const handleSubmit = async () => {
		setIsSubmitting(true)
		try {
			await submitFundApplication({
				bipocIdentity: formData.bipocIdentity === 'yes',
				genderIdentity: formData.genderIdentity,
				age: parseInt(formData.age),
				zipcode: formData.zipcode.trim(),
				referralSource: formData.referralSource,
				race: formData.race,
				firstRace: formData.firstRace === 'yes',
				experience: formData.experience,
				reason: formData.reason,
				goals: formData.goals || undefined,
				communityContribution: formData.communityContribution,
				tierraLibreContribution: formData.tierraLibreContribution || undefined,
				additionalAssistanceNeeds: formData.needsAssistance || undefined,
				wantsMentor: formData.wantsMentor === 'yes',
				mentorGenderPreference:
					formData.wantsMentor === 'yes'
						? formData.mentorGenderPreference || 'no-preference'
						: undefined,
			})

			try {
				sessionStorage.removeItem(DRAFT_KEY)
			} catch {
				/* ignore */
			}
			toast.success('Application submitted successfully!')
			router.push('/fund/apply/success')
		} catch (error) {
			const msg =
				error instanceof Error ? error.message : 'Failed to submit application'
			toast.error(msg)
			console.error('Application submission error:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	const isLastStep = currentStep === TOTAL_STEPS
	const submitDisabled = isSubmitting || !isStepComplete(currentStep)

	/* =======================================================
	   UI primitives
	   ======================================================= */

	const CharCount = ({
		text,
		min,
		max,
	}: {
		text: string
		min?: number
		max: number
	}) => {
		const len = text.length
		const over = len > max
		const short = !!min && len > 0 && len < min
		return (
			<div className="text-muted-foreground mt-2 flex justify-end text-xs tabular-nums">
				<span
					className={cn(
						over && 'text-destructive',
						!over && !short && min && len >= min && 'text-chart-5',
					)}
				>
					{len.toLocaleString()} / {max.toLocaleString()}
					{short && (
						<span className="text-muted-foreground">
							{' '}
							· {min! - len} more
						</span>
					)}
				</span>
			</div>
		)
	}

	const ChoiceCard = ({
		value,
		current,
		label,
		desc,
		onChange,
	}: {
		value: string
		current: string
		label: string
		desc?: string
		onChange: (value: string) => void
	}) => (
		<button
			type="button"
			aria-pressed={current === value}
			onClick={() => onChange(value)}
			className={cn(
				'group flex w-full items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left transition-all',
				current === value
					? 'border-primary bg-primary/5 ring-primary/10 ring-4'
					: 'border-border bg-card hover:border-foreground/20',
			)}
		>
			<div className="min-w-0">
				<p className="text-base font-medium">{label}</p>
				{desc && (
					<p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">
						{desc}
					</p>
				)}
			</div>
			<span
				className={cn(
					'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors',
					current === value
						? 'border-primary bg-primary text-primary-foreground'
						: 'border-border bg-background',
				)}
			>
				{current === value && (
					<Check className="h-3.5 w-3.5" strokeWidth={3} />
				)}
			</span>
		</button>
	)

	/* =======================================================
	   Welcome screen
	   ======================================================= */

	if (!started) {
		return (
			<div className="bg-background flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-6 py-12">
				<div className="animate-fade-in-up mx-auto w-full max-w-lg text-center">
					<h1 className="text-foreground text-4xl font-semibold tracking-tight md:text-5xl">
						Apply for race entry.
					</h1>
					<p className="text-muted-foreground mx-auto mt-5 max-w-md text-lg leading-relaxed md:text-xl">
						Seven questions. About fifteen minutes. Your progress saves
						automatically as you go.
					</p>

					{canStartApplication ? (
						<div className="mt-12 flex flex-col items-center gap-4">
							<Button
								size="lg"
								onClick={() => setStarted(true)}
								className="rounded-full px-8 text-base"
							>
								Get started
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
							<p className="text-muted-foreground text-xs">
								{TOTAL_STEPS} questions · ~15 minutes · Saves automatically
							</p>
						</div>
					) : (
						<div className="bg-muted text-muted-foreground mt-12 rounded-2xl p-6 text-left text-sm leading-relaxed">
							<p className="text-foreground font-medium">
								You&apos;ve already applied this cycle.
							</p>
							<p className="mt-2">
								You can submit one application every six months. Check your
								dashboard for updates, or refresh this page if an admin has
								exempted your account.
							</p>
						</div>
					)}
				</div>
			</div>
		)
	}

	/* =======================================================
	   Step content
	   ======================================================= */

	const renderStep = () => {
		switch (currentStep) {
			case 1:
				return (
					<div className="space-y-8">
						<div className="space-y-3">
							<div>
								<p className="text-base font-medium">
									Do you identify as a person of color?
								</p>
								<p className="text-muted-foreground mt-1 text-sm">
									The Athlete Fund supports Black, Indigenous, and people of
									color in trail running.
								</p>
							</div>
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
								<ChoiceCard
									value="yes"
									current={formData.bipocIdentity}
									label="Yes"
									onChange={(v) => updateField('bipocIdentity', v)}
								/>
								<ChoiceCard
									value="no"
									current={formData.bipocIdentity}
									label="No"
									onChange={(v) => updateField('bipocIdentity', v)}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="gender-identity">Gender identity</Label>
							<Select
								value={formData.genderIdentity}
								onValueChange={(v) => updateField('genderIdentity', v)}
							>
								<SelectTrigger id="gender-identity" className="h-11 w-full">
									<SelectValue placeholder="Select" />
								</SelectTrigger>
								<SelectContent>
									{GENDER_OPTIONS.map((opt) => (
										<SelectItem key={opt} value={opt}>
											{opt}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="age">Age</Label>
								<Input
									id="age"
									type="number"
									min="18"
									max="100"
									value={formData.age}
									onChange={(e) => updateField('age', e.target.value)}
									placeholder="28"
									className="h-11"
								/>
								{formData.age && parseInt(formData.age) < 18 && (
									<p className="text-destructive text-xs">
										Must be at least 18.
									</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="zipcode">ZIP code</Label>
								<Input
									id="zipcode"
									type="text"
									value={formData.zipcode}
									onChange={(e) => updateField('zipcode', e.target.value)}
									placeholder="94103"
									className="h-11"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="referral-source">
								How did you hear about us?
							</Label>
							<Select
								value={formData.referralSource}
								onValueChange={(v) => updateField('referralSource', v)}
							>
								<SelectTrigger id="referral-source" className="h-11 w-full">
									<SelectValue placeholder="Select" />
								</SelectTrigger>
								<SelectContent>
									{REFERRAL_OPTIONS.map((opt) => (
										<SelectItem key={opt} value={opt}>
											{opt}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				)

			case 2:
				return (
					<div className="space-y-8">
						<RaceSelector
							raceOptions={raceOptions}
							appliedRaces={applicationStatus.appliedRaces}
							selectedRace={formData.race}
							onRaceSelectAction={(race) => updateField('race', race)}
						/>

						<div className="space-y-3">
							<p className="text-base font-medium">
								Is this your first trail race?
							</p>
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
								<ChoiceCard
									value="yes"
									current={formData.firstRace}
									label="Yes, my first"
									onChange={(v) => updateField('firstRace', v)}
								/>
								<ChoiceCard
									value="no"
									current={formData.firstRace}
									label="I've raced before"
									onChange={(v) => updateField('firstRace', v)}
								/>
							</div>
						</div>
					</div>
				)

			case 3:
				return (
					<div className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="reason">
								Who are you, beyond an athlete?
							</Label>
							<p className="text-muted-foreground text-sm">
								What communities do you belong to, and what role does the
								outdoors play in your life?
							</p>
							<Textarea
								id="reason"
								value={formData.reason}
								onChange={(e) => updateField('reason', e.target.value)}
								rows={5}
								required
								maxLength={CHAR_MAX_LONG}
								className="resize-none text-base leading-relaxed"
							/>
							<CharCount
								text={formData.reason}
								min={CHAR_MIN_STANDARD}
								max={CHAR_MAX_LONG}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="experience">
								What&apos;s your relationship with trail running?
							</Label>
							<p className="text-muted-foreground text-sm">
								What&apos;s made it easy or hard to access the sport?
							</p>
							<Textarea
								id="experience"
								value={formData.experience}
								onChange={(e) => updateField('experience', e.target.value)}
								rows={5}
								required
								maxLength={CHAR_MAX_LONG}
								className="resize-none text-base leading-relaxed"
							/>
							<CharCount
								text={formData.experience}
								min={CHAR_MIN_STANDARD}
								max={CHAR_MAX_LONG}
							/>
						</div>
					</div>
				)

			case 4:
				return (
					<div className="space-y-2">
						<Label htmlFor="goals">
							Why this race, and why now?
						</Label>
						<p className="text-muted-foreground text-sm">
							What would it mean for you to cross that finish line?
						</p>
						<Textarea
							id="goals"
							value={formData.goals}
							onChange={(e) => updateField('goals', e.target.value)}
							rows={9}
							required
							maxLength={CHAR_MAX_MEDIUM}
							className="resize-none text-base leading-relaxed"
						/>
						<CharCount
							text={formData.goals}
							min={CHAR_MIN_RACE}
							max={CHAR_MAX_MEDIUM}
						/>
					</div>
				)

			case 5:
				return (
					<div className="space-y-2">
						<Label htmlFor="communityContribution">
							How does this experience create a ripple?
						</Label>
						<p className="text-muted-foreground text-sm">
							In your life, your community, and in trail running. We prioritize
							athletes who see this as a beginning, not a one-time event.
						</p>
						<Textarea
							id="communityContribution"
							value={formData.communityContribution}
							onChange={(e) =>
								updateField('communityContribution', e.target.value)
							}
							rows={9}
							required
							maxLength={CHAR_MAX_LONG}
							className="resize-none text-base leading-relaxed"
						/>
						<CharCount
							text={formData.communityContribution}
							min={CHAR_MIN_COMMUNITY}
							max={CHAR_MAX_LONG}
						/>
					</div>
				)

			case 6:
				return (
					<div className="space-y-6">
						<div className="space-y-3">
							<div>
								<p className="text-base font-medium">
									Would you like a mentor?
								</p>
								<p className="text-muted-foreground mt-1 text-sm leading-relaxed">
									An experienced athlete pairs with you for check-ins leading
									up to race day — usually every two weeks, about 30 minutes.
								</p>
							</div>
							<div className="space-y-3">
								<ChoiceCard
									value="yes"
									current={formData.wantsMentor}
									label="Yes, I'd love a mentor"
									desc="Connect me with someone who can share advice and encouragement."
									onChange={(v) => {
										updateField('wantsMentor', v)
										if (!formData.mentorGenderPreference) {
											updateField('mentorGenderPreference', 'no-preference')
										}
									}}
								/>
								<ChoiceCard
									value="no"
									current={formData.wantsMentor}
									label="No thanks"
									desc="I'd rather prepare on my own or already have support."
									onChange={(v) => {
										updateField('wantsMentor', v)
										updateField('mentorGenderPreference', '')
										updateField('tierraLibreContribution', '')
									}}
								/>
							</div>
						</div>

						{formData.wantsMentor === 'yes' && (
							<div className="animate-fade-in-up space-y-6">
								<div className="space-y-2">
									<Label htmlFor="tierraLibreContribution">
										What would help you feel ready?
									</Label>
									<Textarea
										id="tierraLibreContribution"
										value={formData.tierraLibreContribution}
										onChange={(e) =>
											updateField('tierraLibreContribution', e.target.value)
										}
										rows={4}
										required
										maxLength={CHAR_MAX_MEDIUM}
										className="resize-none text-base leading-relaxed"
									/>
									<CharCount
										text={formData.tierraLibreContribution}
										min={CHAR_MIN_MENTOR_DETAIL}
										max={CHAR_MAX_MEDIUM}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="mentorGenderPreference">
										Mentor preference
									</Label>
									<Select
										value={formData.mentorGenderPreference}
										onValueChange={(v) =>
											updateField('mentorGenderPreference', v)
										}
									>
										<SelectTrigger
											id="mentorGenderPreference"
											className="h-11 w-full"
										>
											<SelectValue placeholder="Select preference" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="no-preference">
												No preference
											</SelectItem>
											<SelectItem value="same-gender">
												Same gender identity
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						)}
					</div>
				)

			case 7: {
				const sections = [
					{ title: 'About you', content: formData.reason, step: 3 },
					{
						title: 'Trail running',
						content: formData.experience,
						step: 3,
					},
					{ title: 'Why this race', content: formData.goals, step: 4 },
					{
						title: 'The ripple',
						content: formData.communityContribution,
						step: 5,
					},
				]

				return (
					<div className="space-y-4">
						<div className="border-border grid grid-cols-1 gap-x-6 gap-y-4 rounded-2xl border p-5 sm:grid-cols-2">
							<div>
								<p className="text-muted-foreground text-xs">Name</p>
								<p className="mt-1 text-sm font-medium">{userData.name}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Email</p>
								<p className="mt-1 text-sm font-medium break-words">
									{userData.email}
								</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">Race</p>
								<p className="mt-1 text-sm font-medium">{formData.race}</p>
							</div>
							<div>
								<p className="text-muted-foreground text-xs">First trail race</p>
								<p className="mt-1 text-sm font-medium">
									{formData.firstRace === 'yes' ? 'Yes' : 'No'}
								</p>
							</div>
						</div>

						{sections.map((section) => (
							<div
								key={section.title}
								className="border-border rounded-2xl border p-5"
							>
								<div className="mb-2 flex items-center justify-between">
									<h4 className="text-sm font-semibold">{section.title}</h4>
									<button
										type="button"
										onClick={() => goToStep(section.step)}
										className="text-primary text-xs font-medium hover:underline"
									>
										Edit
									</button>
								</div>
								<p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
									{section.content}
								</p>
							</div>
						))}

						<div className="border-border rounded-2xl border p-5">
							<div className="mb-2 flex items-center justify-between">
								<h4 className="text-sm font-semibold">Mentorship</h4>
								<button
									type="button"
									onClick={() => goToStep(6)}
									className="text-primary text-xs font-medium hover:underline"
								>
									Edit
								</button>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<Badge
									variant={
										formData.wantsMentor === 'yes' ? 'default' : 'secondary'
									}
								>
									{formData.wantsMentor === 'yes' ? 'Wants mentor' : 'No mentor'}
								</Badge>
								{formData.wantsMentor === 'yes' &&
									formData.mentorGenderPreference && (
										<Badge variant="outline">
											{formData.mentorGenderPreference === 'same-gender'
												? 'Same gender preferred'
												: 'No preference'}
										</Badge>
									)}
							</div>
						</div>

						<p className="text-muted-foreground pt-2 text-center text-xs leading-relaxed">
							By submitting, you confirm this information is accurate.
						</p>
					</div>
				)
			}

			default:
				return null
		}
	}

	/* =======================================================
	   Form shell
	   ======================================================= */

	return (
		<div className="bg-background flex min-h-[calc(100dvh-4rem)] flex-col">
			{/* Top: progress */}
			<div className="border-border/60 border-b px-6 py-4">
				<div className="mx-auto flex max-w-2xl items-center gap-4">
					<span className="text-muted-foreground text-xs font-medium tabular-nums">
						{currentStep} of {TOTAL_STEPS}
					</span>
					<div
						className="bg-muted h-1 flex-1 overflow-hidden rounded-full"
						role="progressbar"
						aria-valuenow={currentStep}
						aria-valuemin={1}
						aria-valuemax={TOTAL_STEPS}
					>
						<div
							className="bg-foreground h-full rounded-full transition-all duration-500 ease-out"
							style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
						/>
					</div>
					<span className="text-muted-foreground hidden text-xs font-medium sm:inline">
						{STEP_LABELS[currentStep - 1]}
					</span>
				</div>
			</div>

			{/* Content */}
			<div
				ref={contentRef}
				className="min-h-0 flex-1 overflow-y-auto px-6 py-10 md:py-14"
			>
				<div
					key={currentStep}
					className="animate-fade-in-up mx-auto w-full max-w-2xl"
				>
					<header className="mb-8 md:mb-10">
						<h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
							{STEP_LABELS[currentStep - 1]}
						</h1>
						<p className="text-muted-foreground mt-2 text-base leading-relaxed md:text-lg">
							{STEP_SUBTITLES[currentStep - 1]}
						</p>
					</header>

					{renderStep()}
				</div>
			</div>

			{/* Bottom: actions */}
			<div className="border-border/60 bg-background/95 border-t px-6 py-4 backdrop-blur">
				<div className="mx-auto flex max-w-2xl items-center justify-between">
					<Button
						variant="ghost"
						onClick={prevStep}
						disabled={currentStep === 1}
					>
						<ChevronLeft className="mr-1 h-4 w-4" />
						Back
					</Button>

					{!isLastStep ? (
						<Button
							size="lg"
							onClick={nextStep}
							disabled={!isStepComplete(currentStep)}
							className="rounded-full px-8"
						>
							Continue
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					) : (
						<Button
							size="lg"
							onClick={handleSubmit}
							disabled={submitDisabled}
							className="rounded-full px-8"
						>
							{isSubmitting ? (
								<span aria-live="polite">Submitting…</span>
							) : (
								<>
									Submit
									<Check className="ml-2 h-4 w-4" strokeWidth={3} />
								</>
							)}
						</Button>
					)}
				</div>
			</div>
		</div>
	)
}
