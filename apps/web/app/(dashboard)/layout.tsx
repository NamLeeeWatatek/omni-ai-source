'use client'

import { useState, useEffect } from 'react'
import { Button } from '@wataomi/ui'
import {
    FiLayout,
    FiGitMerge,
    FiInbox,
    FiRadio,
    FiBarChart2,
    FiSettings,
    FiChevronDown,
    FiUser,
    FiLogOut,
    FiPlus
} from 'react-icons/fi'
import { MdAutoAwesome } from 'react-icons/md'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const { getUser, logout, requireAuth } = useAuth()
    const [workspaceName] = useState('My Workspace')
    const [expandedSections, setExpandedSections] = useState<string[]>(['workflows'])
    const [user, setUser] = useState<any>(null)

    // Check authentication on mount
    useEffect(() => {
        if (!requireAuth()) {
            return
        }
        const currentUser = getUser()
        setUser(currentUser)
    }, [])

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: FiLayout },
        {
            name: 'Workflows',
            icon: FiGitMerge,
            children: [
                { name: 'All Workflows', href: '/flows' },
                { name: 'Create New', href: '/flows/new/edit' }
            ]
        },
        { name: 'OmniInbox', href: '/inbox', icon: FiInbox },
        { name: 'Channels', href: '/channels', icon: FiRadio },
        {
            name: 'Management',
            icon: FiSettings,
            children: [
                { name: 'Bots', href: '/bots' },
                { name: 'Team', href: '/team' },
                { name: 'Integrations', href: '/integrations' }
            ]
        },
        { name: 'Analytics', href: '/analytics', icon: FiBarChart2 },
        { name: 'Settings', href: '/settings', icon: FiSettings },
    ]

    const toggleSection = (sectionName: string) => {
        setExpandedSections(prev =>
            prev.includes(sectionName)
                ? prev.filter(s => s !== sectionName)
                : [...prev, sectionName]
        )
    }

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === href
        return pathname.startsWith(href)
    }

    const handleLogout = () => {
        if (confirm('Are you sure you want to sign out?')) {
            logout()
        }
    }

    // Get user display info
    const getUserName = () => {
        if (!user) return 'Loading...'
        return user.displayName || user.name || user.email || 'User'
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
        <div className="h-screen flex bg-background">
            {/* Sidebar */}
            <div className="w-64 border-r border-border/40 flex flex-col">
                {/* Logo */}
                <div className="h-16 border-b border-border/40 flex items-center px-6">
                    <MdAutoAwesome className="w-6 h-6 text-wata-purple mr-2" />
                    <span className="text-xl font-bold gradient-text">WataOmi</span>
                </div>

                {/* Workspace Selector */}
                <div className="p-4 border-b border-border/40">
                    <button className="w-full glass rounded-lg p-3 flex items-center justify-between hover:bg-accent transition-colors">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-wata flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                    {workspaceName.charAt(0)}
                                </span>
                            </div>
                            <span className="font-medium text-sm">{workspaceName}</span>
                        </div>
                        <FiChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navigation.map((item) => {
                        const active = item.href ? isActive(item.href) : false
                        const isExpanded = expandedSections.includes(item.name.toLowerCase())
                        const hasChildren = item.children && item.children.length > 0

                        return (
                            <div key={item.name} className="space-y-1">
                                {hasChildren ? (
                                    <button
                                        onClick={() => toggleSection(item.name.toLowerCase())}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-muted-foreground hover:bg-accent hover:text-foreground`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <item.icon className="w-5 h-5" />
                                            <span className="font-medium">{item.name}</span>
                                        </div>
                                        <FiChevronDown
                                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''
                                                }`}
                                        />
                                    </button>
                                ) : (
                                    <Link
                                        href={item.href!}
                                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${active
                                            ? 'bg-gradient-wata text-white shadow-lg shadow-wata-purple/20'
                                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium">{item.name}</span>
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
                                                    className={`block px-3 py-2 rounded-lg text-sm transition-all ${isChildActive
                                                        ? 'text-wata-purple bg-wata-purple/10 font-medium'
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

                {/* User Menu */}
                <div className="p-4 border-t border-border/40">
                    <div className="glass rounded-lg p-3">
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-wata flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                    {getUserInitial()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{getUserName()}</p>
                                <p className="text-xs text-muted-foreground truncate">{getUserEmail()}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={handleLogout}
                        >
                            <FiLogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <div className="h-16 border-b border-border/40 flex items-center justify-between px-6">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
                        </h1>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Button size="sm">
                            <FiPlus className="w-4 h-4 mr-2" />
                            New Bot
                        </Button>
                    </div>
                </div>

                {/* Page Content */}
                <div className="flex-1 overflow-auto">
                    {children}
                </div>
            </div>
        </div>
    )
}
