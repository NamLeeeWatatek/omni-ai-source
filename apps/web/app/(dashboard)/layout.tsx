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
    const { isAuthenticated, isLoading, signOut, accessToken, error } = useAuth()
    const pathname = usePathname()
    const router = useRouter()
    const { t } = useTranslation()

    // Handle session errors and redirects
    useEffect(() => {
        if (isLoading) return

        if (error === 'RefreshAccessTokenError') {
            toast.error('Session expired. Please log in again.')
            signOut()
            return
        }

        if (!isAuthenticated || !accessToken) {
            router.push('/login')
        }
    }, [isLoading, isAuthenticated, accessToken, error, router, signOut])

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <LoadingLogo size="lg" text={t('common.loading')} />
            </div>
        )
    }

    // Handle authentication errors - redirect to login if not authenticated
    // Middleware handles most of this, but if client-side check fails, just redirect silently
    if (!isAuthenticated || !accessToken) {
        return null
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
        toast.promise(
            signOut(),
            {
                loading: 'Signing out',
                success: 'Signed out successfully',
                error: 'Failed to sign out'
            }
        )
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
                            <CreationJobsProvider>
                                {children}
                                <ActiveJobsWidget />
                            </CreationJobsProvider>
                        </ErrorBoundary>
                    </div>
                </div>
            </main>

            {/* Progress Overlay for async operations */}
            <ProgressOverlay />
        </div>
    )
}
