import { type ComponentProps, type ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

function AdminPage({ className, ...props }: ComponentProps<'div'>) {
	return (
		<div
			className={cn('animate-fade-in-up space-y-10', className)}
			{...props}
		/>
	)
}

function AdminPageHeader({
	label = 'Admin',
	title,
	description,
	media,
	className,
	children,
}: {
	label?: string
	title: string
	description?: string
	media?: ReactNode
	className?: string
	children?: ReactNode
}) {
	return (
		<header
			className={cn(
				'flex flex-col items-start justify-between gap-6 md:flex-row md:items-end',
				className,
			)}
		>
			<div className="flex min-w-0 items-center gap-4">
				{media}
				<div className="min-w-0">
					<p className="text-muted-foreground text-sm font-medium">{label}</p>
					<h1 className="text-foreground mt-1 truncate text-3xl font-semibold tracking-tight md:text-4xl">
						{title}
					</h1>
					{description && (
						<p className="text-muted-foreground mt-2 truncate text-base leading-relaxed md:text-lg">
							{description}
						</p>
					)}
				</div>
			</div>
			{children}
		</header>
	)
}

function AdminSectionCard({
	title,
	children,
	className,
	contentClassName,
}: {
	title: string
	children: ReactNode
	className?: string
	contentClassName?: string
}) {
	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
			</CardHeader>
			<CardContent className={cn('space-y-5', contentClassName)}>
				{children}
			</CardContent>
		</Card>
	)
}

export { AdminPage, AdminPageHeader, AdminSectionCard }
