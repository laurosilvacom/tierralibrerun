import { currentUser } from '@clerk/nextjs/server'
import Link from 'next/link'
import { AuthButton } from '@/components/auth-button'
import { Button } from '@/components/ui/button'

interface FundApplyButtonProps {
	raceName?: string
	variant?: 'default' | 'outline' | 'secondary' | 'ghost'
	size?: 'default' | 'sm' | 'lg' | 'icon'
	className?: string
	fullWidth?: boolean
	label?: string
}

/**
 * Shows sign-in CTA for unauthenticated users, apply button otherwise.
 * Eligibility is validated in Convex when the form is submitted.
 */
export async function FundApplyButton({
	raceName,
	variant = 'default',
	size = 'default',
	className = '',
	fullWidth = false,
	label = 'Apply for Funding',
}: FundApplyButtonProps) {
	const user = await currentUser()

	const applyHref = raceName
		? `/fund/apply?race=${encodeURIComponent(raceName)}`
		: '/fund/apply'

	const cls = `${fullWidth ? 'w-full' : ''} ${className}`.trim()

	if (!user) {
		return (
			<AuthButton
				action="sign-up"
				label={label}
				variant={variant}
				size={size}
				className={cls}
				redirectTo={applyHref}
			/>
		)
	}

	return (
		<Button variant={variant} size={size} asChild className={cls}>
			<Link href={applyHref}>{label}</Link>
		</Button>
	)
}
