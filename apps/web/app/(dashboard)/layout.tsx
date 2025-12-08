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
    FiGrid,
    FiRadio,
    FiSettings,
    FiDatabase,
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
    FiChevronsRight,
    FiMessageCircle
} from 'react-icons/fi'
import { TiMessages } from "react-icons/ti";
import { RiRobot2Line } from "react-icons/ri";
import { MdAutoAwesome } from 'react-icons/md'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { RoleBadge } from '@/components/auth/RoleBadge'
import toast from '@/lib/toast'
import { LoadingLogo } from '@/components/ui/loading-logo'
import { AlertDialogConfirm } from '@/components/ui/alert-dialog-confirm'
import { WorkspaceSwitcher } from '@/components/workspace/workspace-switcher'

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
    const { user, isAuthenticated, isLoading, signOut } = useAuth()
    const { capabilities, canAccessWidget } = usePermissions()
    const [workspaceName] = useState('My Workspace')
    const [expandedSections, setExpandedSections] = useState<string[]>(['workflows'])

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [showLogoutDialog, setShowLogoutDialog] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

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

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <LoadingLogo size="lg" text="Loading dashboard..." />
            </div>
        )
    }

    if (!isAuthenticated) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <LoadingLogo size="lg" text="Redirecting to login..." />
            </div>
        )
    }

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    }

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    const clearNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    const unreadCount = notifications.filter(n => !n.read).length

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: FiLayout },
        { name: 'Conversations', href: '/conversations', icon: FiMessageCircle },
        {
            name: 'Workflows',
            icon: FiGitMerge,
            children: [
                { name: 'All Workflows', href: '/flows' },
                { name: 'Create New', href: '/flows/new/edit' }
            ]
        },
        { name: 'Channels', href: '/channels', icon: FiRadio },
        { name: 'Templates', href: '/templates', icon: FiGrid },
        { name: 'Knowledge Base', href: '/knowledge-base/collections', icon: FiDatabase },
        { name: 'Bots', href: '/bots', icon: RiRobot2Line },
        { name: 'Chat AI', href: '/chat', icon: TiMessages },
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

    const handleLogout = async () => {
        toast.promise(
            signOut(),
            {
                loading: 'Signing out...',
                success: 'Signed out successfully',
                error: 'Failed to sign out'
            }
        )
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
        <div className="h-screen flex bg-background overflow-hidden">
            {}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {}
            <aside className={`
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
                w-64 border-r border-border/40 flex flex-col bg-background
                transition-transform duration-300 ease-in-out
            `}>
                {}
                <div className="h-16 border-b border-border/40 flex items-center px-6">
                    <div className="w-8 h-8 rounded-lg bg-gradient-wata flex items-center justify-center mr-3 shadow-md">
                        <MdAutoAwesome className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold gradient-text">WataOmi</span>
                </div>

                {}
                <div className="p-4 border-b border-border/40">
                    <WorkspaceSwitcher />
                </div>

                {}
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
                                            ? 'bg-gradient-wata text-white shadow-lg shadow-slate-700/20'
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

                {}
                <div className="p-4 border-t border-border/40">
                    <div className="rounded-lg border border-border/40 bg-card/50 backdrop-blur-sm p-4 hover:bg-card/80 transition-all duration-200">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-wata flex items-center justify-center shadow-md flex-shrink-0">
                                <span className="text-white font-semibold">
                                    {getUserInitial()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate mb-0.5">{getUserName()}</p>
                                {capabilities && <RoleBadge className="mb-1.5" />}
                                <p className="text-xs text-muted-foreground truncate">{getUserEmail()}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={() => setShowLogoutDialog(true)}
                        >
                            <FiLogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </aside>

            {}
            <main className="flex-1 flex flex-col overflow-hidden min-w-0">
                {}
                <header className="h-16 border-b border-border/40 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
                    {}
                    <div className="flex items-center gap-3">
                        {}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden"
                        >
                            <FiMenu className="w-6 h-6" />
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

                    {}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {}
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

                        {}
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="relative"
                            >
                                <FiBell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </Button>

                            {}
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
                                                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notification.type === 'success' ? 'bg-green-500 dark:bg-green-400' :
                                                            notification.type === 'warning' ? 'bg-yellow-500 dark:bg-yellow-400' :
                                                                notification.type === 'error' ? 'bg-red-500 dark:bg-red-400' :
                                                                    'bg-blue-500 dark:bg-blue-400'
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

                {}
                <div className="flex-1 overflow-hidden relative min-h-0">
                    <div className={`h-full ${pathname.includes('/edit') ||
                        pathname === '/ai-assistant' ||
                        pathname === '/inbox' ||
                        pathname === '/chat' ||
                        pathname === '/conversations'
                        ? ''
                        : 'page-container overflow-auto'
                        }`}>
                        {children}
                    </div>
                </div>
            </main>

            {}
            <AlertDialogConfirm
                open={showLogoutDialog}
                onOpenChange={setShowLogoutDialog}
                title="Sign Out"
                description="Are you sure you want to sign out?"
                confirmText="Sign Out"
                cancelText="Cancel"
                onConfirm={handleLogout}
                variant="destructive"
            />
        </div>
    )
}
