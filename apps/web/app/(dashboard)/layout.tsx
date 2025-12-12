'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { LoadingLogo } from '@/components/ui/LoadingLogo'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import toast from '@/lib/toast'
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Redux-managed layout state
    const [expandedSections, setExpandedSections] = useState<string[]>(['workflows'])
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [showLogoutDialog, setShowLogoutDialog] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)

    // Auth hooks
    const { isAuthenticated, isLoading, signOut, accessToken } = useAuth()
    const pathname = usePathname()
    const router = useRouter()

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <LoadingLogo size="lg" text="Loading dashboard..." />
            </div>
        )
    }

    // Handle authentication errors - redirect to login if not authenticated
    if (!isAuthenticated || !accessToken) {
        // Small delay to prevent flicker and ensure UI stability
        setTimeout(() => {
            router.push('/login?error=unauthorized');
        }, 100);
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <LoadingLogo size="lg" text="Redirecting to login..." />
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
        toast.promise(
            signOut(),
            {
                loading: 'Signing out...',
                success: 'Signed out successfully',
                error: 'Failed to sign out'
            }
        )
    }

    // Responsive page container logic
    // Write mode only: full width, no page-container
    const isEditMode = pathname.includes('mode=edit')
    // Other flow/ugc pages: no page-container but need padding
    const isFlowPage = pathname === '/flows' || pathname.startsWith('/flows/') || pathname.startsWith('/ugc-factory/')

    const isSpecialPage = isEditMode

    return (
        <div className="h-screen flex bg-background overflow-hidden">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar with optimized state management */}
            <DashboardSidebar
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
                onSignOutConfirm={() => setShowLogoutDialog(true)}
                sidebarOpen={sidebarOpen}
                onCloseSidebar={() => setSidebarOpen(false)}
            />

            {/* Main content area */}
            <main className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Header with Redux-managed features */}
                <DashboardHeader
                    showNotifications={showNotifications}
                    onToggleNotifications={handleToggleNotifications}
                    onToggleSidebar={handleToggleSidebar}
                />

                {/* Content area with conditional container classes */}
                <div className="flex-1 overflow-hidden relative min-h-0">
                    <div className={`h-full ${isSpecialPage ? '' : isFlowPage ? 'p-5 overflow-auto' : 'page-container overflow-auto'}`}>
                        {children}
                    </div>
                </div>
            </main>

            {/* Logout confirmation dialog */}
            <AlertDialogConfirm
                open={showLogoutDialog}
                onOpenChange={setShowLogoutDialog}
                title="Sign Out"
                description="Are you sure you want to sign out?"
                confirmText="Sign Out"
                cancelText="Cancel"
                onConfirm={handleSignOut}
                variant="destructive"
            />
        </div>
    )
}
