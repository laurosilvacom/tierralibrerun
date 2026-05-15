'use client'

import { FileText, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'

const ITEMS = [
	{ href: '/admin/applications', label: 'Applications', icon: FileText },
	{ href: '/admin/users', label: 'Users', icon: Users },
]

export function AdminSidebarNav() {
	const pathname = usePathname() ?? ''

	return (
		<SidebarContent>
			<SidebarGroup>
				<SidebarGroupLabel>Admin</SidebarGroupLabel>
				<SidebarMenu aria-label="Admin">
					{ITEMS.map((item) => {
						const Icon = item.icon
						const active = pathname.startsWith(item.href)
						return (
							<SidebarMenuItem key={item.href}>
								<SidebarMenuButton asChild isActive={active}>
									<Link
										href={item.href}
										aria-current={active ? 'page' : undefined}
									>
										<Icon className="h-4 w-4" />
										<span>{item.label}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						)
					})}
				</SidebarMenu>
			</SidebarGroup>
		</SidebarContent>
	)
}
