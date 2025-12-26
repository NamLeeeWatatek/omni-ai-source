'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { LoadingLogo } from '@/components/ui/LoadingLogo'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Sheet, SheetContent } from '@/components/ui/Sheet'
import { ProgressOverlay } from '@/components/ui/ProgressOverlay'
import toast from '@/lib/toast'

import { useTranslation } from 'react-i18next'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'
import { CreationJobsProvider } from '@/components/providers/CreationJobsProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ActiveJobsWidget } from '@/components/features/creation-tools/ActiveJobsWidget'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Redux-managed layout state
    const [expandedSections, setExpandedSections] = useState<string[]>([])
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)

    // Auth hooks
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const { isAuthenticated, isLoading, signOut, accessToken, error } = useAuth()
    const pathname = usePathname()
    const router = useRouter()
    const { t } = useTranslation()

    // Handle session errors and redirects
    useEffect(() => {
        if (isLoading) return

        if (!isAuthenticated || !accessToken) {
            const currentPath = window.location.pathname + window.location.search
            router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}` as any)
        }
    }, [isLoading, isAuthenticated, accessToken, router])

    // While loading session OR performing logout, show global loading screen
    if (isLoading || isLoggingOut) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <LoadingLogo size="lg" text={isLoggingOut ? t('dashboard.confirm.signingOut') : t('common.loading')} />
            </div>
        )
    }

    // Rely on middleware for protection. 
    // If we reach here and not authenticated, we redirect.
    if (!isAuthenticated || !accessToken) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <LoadingLogo size="lg" text={t('login.redirecting')} />
            </div>
        )
    }

    // Layout action handlers
    const toggleSection = (sectionName: string) => {
        setExpandedSections(prev =>
            prev.includes(sectionName)
                ? prev.filter(s => s !== sectionName)
                : [...prev, sectionName]
        )
    }

    const handleToggleSidebar = () => {
        setSidebarOpen(!sidebarOpen)
    }

    const handleToggleNotifications = () => {
        setShowNotifications(!showNotifications)
    }


    const handleSignOut = async () => {
        setIsLoggingOut(true);
        try {
            // Clean logout with redirect to login
            await signOut({ redirect: true, callbackUrl: '/login' });
        } catch (err) {
            console.error('Logout failed:', err);
            setIsLoggingOut(false);
            if (typeof window !== 'undefined') (window as any)._isSigningOut = false;
        }
    }

    // Responsive page container logic
    // Write mode only: full width, no page-container
    const isEditMode = pathname.includes('mode=edit')
    // Other flow/ugc pages: no page-container but need padding
    const isFlowPage = pathname.startsWith('/ugc-factory/')

    const isSpecialPage = isEditMode

    return (
        <div className="h-screen flex bg-background overflow-hidden">
            {/* Mobile Sheet Navigation */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetContent side="left" className="p-0 w-72 border-r border-border/40 bg-background/95 backdrop-blur-xl">
                    <DashboardSidebar
                        expandedSections={expandedSections}
                        onToggleSection={toggleSection}
                        onSignOutConfirm={() => {
                            setSidebarOpen(false);
                            handleSignOut();
                        }}
                        sidebarOpen={true}
                        onCloseSidebar={() => setSidebarOpen(false)}
                    />
                </SheetContent>
            </Sheet>

            {/* Desktop Sidebar (hidden on mobile) */}
            <div className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50">
                <DashboardSidebar
                    expandedSections={expandedSections}
                    onToggleSection={toggleSection}
                    onSignOutConfirm={handleSignOut}
                    sidebarOpen={true}
                />
            </div>

            {/* Main content area */}
            <main className="flex-1 flex flex-col lg:pl-64 overflow-hidden min-w-0 transition-all duration-300">
                <QueryProvider>
                    <CreationJobsProvider>
                        {/* Header with Redux-managed features */}
                        <DashboardHeader
                            showNotifications={showNotifications}
                            onToggleNotifications={handleToggleNotifications}
                            onToggleSidebar={handleToggleSidebar}
                        />

                        {/* Content area with conditional container classes */}
                        <div className="flex-1 overflow-hidden relative min-h-0">
                            <div className={`h-full ${isSpecialPage ? '' : isFlowPage ? 'page-container-full overflow-auto' : 'page-container overflow-auto'}`}>
                                <ErrorBoundary>
                                    {children}
                                </ErrorBoundary>
                            </div>
                        </div>
                        <ActiveJobsWidget />
                    </CreationJobsProvider>
                </QueryProvider>
            </main >

            {/* Progress Overlay for async operations */}
            < ProgressOverlay />
        </div >
    )
}
