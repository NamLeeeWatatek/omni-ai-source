'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/hooks/useAuth'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { RoleBadge } from '@/components/auth/RoleBadge'
import {
    FiLayout,
    FiGitMerge,
    FiGrid,
    FiRadio,
    FiSettings,
    FiDatabase,
    FiChevronDown,
    FiLogOut,
} from 'react-icons/fi'
import { TiMessages } from "react-icons/ti"
import { RiRobot2Line } from "react-icons/ri"
import { MdAutoAwesome } from 'react-icons/md'
import { IconType } from 'react-icons'
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher'

interface NavigationItem {
    name: string
    href?: string
    icon: IconType
    children?: Array<{
        name: string
        href: string
    }>
}

interface DashboardSidebarProps {
    expandedSections: string[]
    onToggleSection: (section: string) => void
    onSignOutConfirm: () => void
    sidebarOpen: boolean
    onCloseSidebar?: () => void
}

const getTranslatedNavigation = (t: any): NavigationItem[] => [
    { name: t('dashboard.title'), href: '/dashboard', icon: FiLayout },
    { name: t('dashboard.ugcFactory'), href: '/ugc-factory', icon: FiGrid },
    { name: t('dashboard.conversations'), href: '/conversations', icon: FiGrid },
    {
        name: t('dashboard.workflows'),
        icon: FiGitMerge,
        children: [
            { name: t('dashboard.allWorkflows'), href: '/flows' },
            { name: t('dashboard.createNew'), href: '/flows/new?mode=edit' }
        ]
    },
    { name: t('dashboard.channels'), href: '/channels', icon: FiRadio },
    { name: t('dashboard.knowledgeBase'), href: '/knowledge-base/collections', icon: FiDatabase },
    { name: t('dashboard.bots'), href: '/bots', icon: RiRobot2Line },
    { name: t('dashboard.chatAI'), href: '/chat', icon: TiMessages },
    { name: t('settings'), href: '/settings', icon: FiSettings },
]

export const DashboardSidebar = React.memo<DashboardSidebarProps>(({
    expandedSections,
    onToggleSection,
    onSignOutConfirm,
    sidebarOpen,
    onCloseSidebar
}) => {
    const pathname = usePathname()
    const { t } = useTranslation()
    const { user } = useAuth()
    const { capabilities } = usePermissions()
    const navigation = getTranslatedNavigation(t)

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === href
        return pathname.startsWith(href)
    }

    const getUserName = () => {
        if (!user) return 'Loading...'
        return user.name || user.email || 'User'
    }

    const getUserEmail = () => {
        if (!user) return ''
        return user.email || ''
    }

    const getUserInitial = () => {
        const name = getUserName()
        return name.charAt(0).toUpperCase()
    }

    return (
        <aside className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
            w-64 border-r border-border/40 flex flex-col bg-background
            transition-transform duration-300 ease-in-out
        `}>
            {/* Header */}
            <div className="h-16 border-b border-border/40 flex items-center px-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-wata flex items-center justify-center mr-3 shadow-md">
                    <MdAutoAwesome className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold gradient-text">WataOmi</span>
            </div>

            {/* Workspace Switcher */}
            <div className="p-4 border-b border-border/40">
                <WorkspaceSwitcher />
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                    const active = item.href ? isActive(item.href) : false
                    const isExpanded = expandedSections.includes(item.name.toLowerCase())
                    const hasChildren = item.children && item.children.length > 0

                    return (
                        <div key={item.name} className="space-y-1">
                            {hasChildren ? (
                                <Button
                                    variant="ghost"
                                    onClick={() => onToggleSection(item.name.toLowerCase())}
                                    className="w-full justify-between h-auto px-3 py-2"
                                >
                                    <div className="flex items-center space-x-3">
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium" suppressHydrationWarning>{item.name}</span>
                                    </div>
                                    <FiChevronDown
                                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    />
                                </Button>
                            ) : (
                                <Link
                                    href={item.href!}
                                    onClick={onCloseSidebar}
                                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${active
                                        ? 'bg-gradient-wata text-white shadow-lg shadow-slate-700/20'
                                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                        }`}
                                    suppressHydrationWarning
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium" suppressHydrationWarning>{item.name}</span>
                                </Link>
                            )}

                            {hasChildren && isExpanded && (
                                <div className="pl-11 space-y-1">
                                    {item.children!.map((child) => {
                                        const isChildActive = isActive(child.href)
                                        return (
                                            <Link
                                                key={child.name}
                                                href={child.href}
                                                onClick={onCloseSidebar}
                                                className={`block px-3 py-2 rounded-lg text-sm transition-all ${isChildActive
                                                    ? 'text-primary bg-primary/10 font-medium'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                                                    }`}
                                            >
                                                {child.name}
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </nav>

 {/* User Profile */}
            <div className="p-4 border-t border-border/40">
                <div className="group rounded-xl border border-border/50 bg-card/30 p-4 backdrop-blur-xl transition-all duration-300 hover:bg-card/80 hover:shadow-lg hover:border-border/80">
                    {/* User Info Section */}
                    <div className="flex items-center gap-3 mb-4">
                        {/* Avatar */}
                        <div className="relative w-12 h-12 shrink-0">
                            <div className="absolute inset-0 rounded-full bg-gradient-wata opacity-80 blur-[2px] group-hover:blur-[4px] transition-all" />
                            <div className="relative w-full h-full rounded-full bg-gradient-wata flex items-center justify-center shadow-sm ring-2 ring-background">
                                <span className="text-white text-sm font-bold tracking-tight">
                                    {getUserInitial()}
                                </span>
                            </div>
                        </div>

                        {/* User Details */}
                        <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold truncate text-foreground/90 group-hover:text-foreground transition-colors">
                                    {getUserName()}
                                </p>
                                {capabilities && (
                                    <RoleBadge className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border-primary/20" />
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate opacity-80 group-hover:opacity-100 transition-opacity">
                                {getUserEmail()}
                            </p>
                        </div>
                    </div>

                    {/* Sign Out Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-lg group/btn border border-transparent hover:border-destructive/20"
                        onClick={onSignOutConfirm}
                    >
                        <FiLogOut className="w-4 h-4 mr-3 transition-transform group-hover/btn:-translate-x-0.5" />
                        <span className="text-sm font-medium">{t('dashboard.signOut')}</span>
                    </Button>
                </div>
            </div>
        </aside>
    )
})

DashboardSidebar.displayName = 'DashboardSidebar'
