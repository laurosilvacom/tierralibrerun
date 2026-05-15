'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const ITEMS = [
	{ href: '/admin/applications', label: 'Applications' },
	{ href: '/admin/users', label: 'Users' },
]

export function AdminSidebarNav() {
	const pathname = usePathname() ?? ''

	return (
		<nav className="space-y-1 p-4" aria-label="Admin">
			<p className="text-muted-foreground mb-3 px-3 text-xs font-medium tracking-[0.18em] uppercase">
				Admin
			</p>
			{ITEMS.map((item) => {
				const active = pathname.startsWith(item.href)
				return (
					<Link
						key={item.href}
						href={item.href}
						aria-current={active ? 'page' : undefined}
						className={cn(
							'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
							active
								? 'bg-primary/10 text-foreground'
								: 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
						)}
					>
						{item.label}
					</Link>
				)
			})}
		</nav>
	)
}
