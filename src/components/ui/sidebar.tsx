'use client'

import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'
import { cn } from '@/lib/utils'

function SidebarProvider({
	className,
	children,
	...props
}: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-provider"
			className={cn(
				'bg-background flex min-h-[calc(100dvh-4rem)] w-full',
				className,
			)}
			{...props}
		>
			{children}
		</div>
	)
}

function Sidebar({ className, ...props }: React.ComponentProps<'aside'>) {
	return (
		<aside
			data-slot="sidebar"
			className={cn(
				'bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-56 shrink-0 border-r md:block',
				className,
			)}
			{...props}
		/>
	)
}

function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-header"
			className={cn('border-sidebar-border border-b p-4', className)}
			{...props}
		/>
	)
}

function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-content"
			className={cn('flex min-h-0 flex-1 flex-col gap-2 p-3', className)}
			{...props}
		/>
	)
}

function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-group"
			className={cn('space-y-1', className)}
			{...props}
		/>
	)
}

function SidebarGroupLabel({ className, ...props }: React.ComponentProps<'p'>) {
	return (
		<p
			data-slot="sidebar-group-label"
			className={cn(
				'text-sidebar-foreground/65 px-2 py-1 text-xs font-medium tracking-[0.18em] uppercase',
				className,
			)}
			{...props}
		/>
	)
}

function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
	return (
		<ul
			data-slot="sidebar-menu"
			className={cn('space-y-1', className)}
			{...props}
		/>
	)
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
	return (
		<li
			data-slot="sidebar-menu-item"
			className={cn('list-none', className)}
			{...props}
		/>
	)
}

function SidebarMenuButton({
	className,
	isActive,
	asChild = false,
	...props
}: React.ComponentProps<'a'> & { isActive?: boolean; asChild?: boolean }) {
	const Comp = asChild ? Slot : 'a'

	return (
		<Comp
			data-slot="sidebar-menu-button"
			data-active={isActive}
			className={cn(
				'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors',
				isActive
					? 'bg-sidebar-primary text-sidebar-primary-foreground'
					: 'text-sidebar-foreground/75',
				className,
			)}
			{...props}
		/>
	)
}

function SidebarInset({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-inset"
			className={cn('min-w-0 flex-1', className)}
			{...props}
		/>
	)
}

export {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
}
