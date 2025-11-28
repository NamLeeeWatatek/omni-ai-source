'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
    FiLayout,
    FiGitMerge,
    FiInbox,
    FiRadio,
    FiBarChart2,
    FiSettings,
    FiChevronDown,
    FiLogOut,
    FiSun,
    FiMoon,
    FiBell,
    FiX,
    FiCheck,
    FiHome,
    FiMenu,
    FiChevronsLeft,
    FiChevronsRight
} from 'react-icons/fi'
import { MdAutoAwesome } from 'react-icons/md'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import toast from '@/lib/toast'
import { AIFloatingButton } from '@/components/features/ai-assistant/ai-floating-button'

// Notification type
interface Notification {
    id: string
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    read: boolean
    createdAt: Date
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const { theme, setTheme } = useTheme()
    const { getUser, logout, requireAuth } = useAuth()
    const [workspaceName] = useState('My Workspace')
    const [expandedSections, setExpandedSections] = useState<string[]>(['workflows'])
    const [user, setUser] = useState<{
        displayName?: string;
        name?: string;
        email?: string;
    } | null>(null)

    // Sidebar state - default closed on mobile, open on desktop
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Notifications state
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: '1',
            title: 'Welcome to WataOmi!',
            message: 'Start by creating your first workflow or connecting a channel.',
            type: 'info',
            read: false,
            createdAt: new Date()
        }
    ])
    const [showNotifications, setShowNotifications] = useState(false)

    // Check authentication on mount
    useEffect(() => {
        if (!requireAuth()) {
            return
        }
        const currentUser = getUser()
        setUser(currentUser)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Mark notification as read
    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    }

    // Mark all as read
    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    // Clear notification
    const clearNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    // Unread count
    const unreadCount = notifications.filter(n => !n.read).length

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
        { name: 'Channels & Integrations', href: '/channels', icon: FiRadio },
        {
            name: 'Management',
            icon: FiSettings,
            children: [
                { name: 'Bots', href: '/bots' },
                { name: 'Team', href: '/team' },
                { name: 'Archives', href: '/archives' }
            ]
        },
        { name: 'Analytics', href: '/analytics', icon: FiBarChart2 },
        { name: 'AI Assistant', href: '/ai-assistant', icon: MdAutoAwesome },
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
        toast(
            (t) => (
                <div className="flex flex-col gap-4">
                    <p className="font-medium">Are you sure you want to sign out?</p>
                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="ghost"
                            onClick={() => toast.dismiss(t.id)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                toast.dismiss(t.id)
                                toast.loading('Signing out...', { duration: 2000 })
                                logout()
                            }}
                            className="bg-slate-700 hover:bg-slate-700/90"
                        >
                            Sign Out
                        </Button>
                    </div>
                </div>
            ),
            {
                duration: 10000,
                style: {
                    maxWidth: '400px',
                    padding: '16px',
                    borderRadius: '12px',
                },
            }
        )
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
        <div className="h-screen flex bg-background overflow-hidden">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Responsive with Tailwind */}
            <aside className={`
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
                w-64 border-r border-border/40 flex flex-col bg-background
                transition-transform duration-300 ease-in-out
            `}>
                {/* Logo */}
                <div className="h-16 border-b border-border/40 flex items-center px-6">
                    <MdAutoAwesome className="w-6 h-6 text-slate-400 mr-2" />
                    <span className="text-xl font-bold gradient-text">WataOmi</span>
                </div>

                {/* Workspace Selector */}
                <div className="p-4 border-b border-border/40">
                    <Button variant="ghost" className="w-full justify-between h-auto p-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-wata flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                    {workspaceName.charAt(0)}
                                </span>
                            </div>
                            <span className="font-medium text-sm">{workspaceName}</span>
                        </div>
                        <FiChevronDown className="w-4 h-4 text-muted-foreground" />
                    </Button>
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
                                        onClick={() => toggleSection(item.name.toLowerCase())}
                                        className="w-full justify-between h-auto px-3 py-2"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <item.icon className="w-5 h-5" />
                                            <span className="font-medium">{item.name}</span>
                                        </div>
                                        <FiChevronDown
                                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''
                                                }`}
                                        />
                                    </Button>
                                ) : (
                                    <Link
                                        href={item.href!}
                                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${active
                                            ? 'bg-gradient-wata text-white shadow-lg shadow-slate-700/20/20'
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
                                                        ? 'text-slate-400 bg-slate-700/10 font-medium'
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
                    <div className="rounded-lg border border-border/40 bg-card p-3">
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
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Top Bar */}
                <header className="h-16 border-b border-border/40 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
                    {/* Left side */}
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden"
                        >
                            <FiMenu className="w-6 h-6" />
                        </Button>

                        {/* Desktop Sidebar Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="hidden lg:flex"
                        >
                            {sidebarOpen ? (
                                <FiChevronsLeft className="w-5 h-5" />
                            ) : (
                                <FiChevronsRight className="w-5 h-5" />
                            )}
                        </Button>

                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/dashboard" className="flex items-center gap-2">
                                            <FiHome className="w-4 h-4" />
                                            <span>Home</span>
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                {(() => {
                                    const currentPage = navigation.find(item => item.href === pathname)
                                    const parentWithChild = navigation.find(item =>
                                        item.children?.some(child => child.href === pathname)
                                    )
                                    const currentChild = parentWithChild?.children?.find(child => child.href === pathname)
                                    const pathSegments = pathname.split('/').filter(Boolean)

                                    if (pathname === '/dashboard') {
                                        return null
                                    }

                                    if (currentChild && parentWithChild) {
                                        return (
                                            <>
                                                <BreadcrumbSeparator />
                                                <BreadcrumbItem>
                                                    <BreadcrumbLink asChild>
                                                        <Link href="#" className="flex items-center gap-2">
                                                            <parentWithChild.icon className="w-4 h-4" />
                                                            <span>{parentWithChild.name}</span>
                                                        </Link>
                                                    </BreadcrumbLink>
                                                </BreadcrumbItem>
                                                <BreadcrumbSeparator />
                                                <BreadcrumbItem>
                                                    <BreadcrumbPage className="flex items-center gap-2">
                                                        {currentChild.name}
                                                    </BreadcrumbPage>
                                                </BreadcrumbItem>
                                            </>
                                        )
                                    }

                                    if (currentPage) {
                                        return (
                                            <>
                                                <BreadcrumbSeparator />
                                                <BreadcrumbItem>
                                                    <BreadcrumbPage className="flex items-center gap-2">
                                                        <currentPage.icon className="w-4 h-4" />
                                                        <span>{currentPage.name}</span>
                                                    </BreadcrumbPage>
                                                </BreadcrumbItem>
                                            </>
                                        )
                                    }

                                    if (pathSegments.length > 1) {
                                        const baseSegment = pathSegments[0]
                                        const basePage = navigation.find(item =>
                                            item.href?.includes(`/${baseSegment}`) ||
                                            item.children?.some(child => child.href?.includes(`/${baseSegment}`))
                                        )

                                        if (basePage) {
                                            const isEdit = pathSegments.includes('edit')
                                            const isNew = pathSegments.includes('new')
                                            const actionText = isEdit ? 'Edit' : isNew ? 'Create New' : 'View'

                                            return (
                                                <>
                                                    <BreadcrumbSeparator />
                                                    <BreadcrumbItem>
                                                        <BreadcrumbLink asChild>
                                                            <Link href={basePage.href || `/${baseSegment}`} className="flex items-center gap-2">
                                                                <basePage.icon className="w-4 h-4" />
                                                                <span>{basePage.name}</span>
                                                            </Link>
                                                        </BreadcrumbLink>
                                                    </BreadcrumbItem>
                                                    <BreadcrumbSeparator />
                                                    <BreadcrumbItem>
                                                        <BreadcrumbPage className="flex items-center gap-2">
                                                            {actionText}
                                                        </BreadcrumbPage>
                                                    </BreadcrumbItem>
                                                </>
                                            )
                                        }
                                    }

                                    return (
                                        <>
                                            <BreadcrumbSeparator />
                                            <BreadcrumbItem>
                                                <BreadcrumbPage>
                                                    {pathSegments[pathSegments.length - 1]?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </BreadcrumbPage>
                                            </BreadcrumbItem>
                                        </>
                                    )
                                })()}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Theme Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="relative"
                            title={mounted && theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {!mounted ? (
                                <FiSun className="w-5 h-5" />
                            ) : theme === 'dark' ? (
                                <FiSun className="w-5 h-5" />
                            ) : (
                                <FiMoon className="w-5 h-5" />
                            )}
                        </Button>

                        {/* Notifications */}
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative"
                            >
                                <FiBell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </Button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className="absolute right-0 top-12 w-80 rounded-xl border border-border bg-popover shadow-xl z-50">
                                    <div className="p-3 border-b border-border/40 flex items-center justify-between">
                                        <h3 className="font-semibold">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <Button
                                                variant="link"
                                                size="sm"
                                                onClick={markAllAsRead}
                                                className="h-auto p-0 text-xs"
                                            >
                                                Mark all as read
                                            </Button>
                                        )}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center text-muted-foreground text-sm">
                                                No notifications
                                            </div>
                                        ) : (
                                            notifications.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={`p-3 border-b border-border/20 hover:bg-muted/30 transition-colors ${!notification.read ? 'bg-primary/5' : ''
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notification.type === 'success' ? 'bg-green-500' :
                                                            notification.type === 'warning' ? 'bg-yellow-500' :
                                                                notification.type === 'error' ? 'bg-red-500' :
                                                                    'bg-blue-500'
                                                            }`} />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium">{notification.title}</p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                {notification.message}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {!notification.read && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => markAsRead(notification.id)}
                                                                    className="h-6 w-6"
                                                                    title="Mark as read"
                                                                >
                                                                    <FiCheck className="w-3 h-3" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => clearNotification(notification.id)}
                                                                className="h-6 w-6 text-muted-foreground"
                                                                title="Dismiss"
                                                            >
                                                                <FiX className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto relative">
                    <div className={`h-full ${pathname.includes('/edit') ||
                        pathname === '/ai-assistant' ||
                        pathname === '/inbox'
                        ? ''
                        : 'page-container'
                        }`}>
                        {children}
                    </div>
                </div>
            </main>

            {/* AI Floating Button */}
            <AIFloatingButton />
        </div>
    )
}
