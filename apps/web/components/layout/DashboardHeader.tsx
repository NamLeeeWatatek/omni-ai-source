'use client'

import React from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/Button'
import { DashboardBreadcrumb } from './DashboardBreadcrumb'
import { DashboardNotifications } from './DashboardNotifications'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { FiSun, FiMoon, FiMenu } from 'react-icons/fi'

interface DashboardHeaderProps {
    showNotifications: boolean
    onToggleNotifications: () => void
    onToggleSidebar: () => void
}

export const DashboardHeader = React.memo<DashboardHeaderProps>(({
    showNotifications,
    onToggleNotifications,
    onToggleSidebar
}) => {
    const { theme, setTheme } = useTheme()

    return (
        <header className="h-16 border-b border-border/40 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleSidebar}
                    className="lg:hidden"
                >
                    <FiMenu className="w-6 h-6" />
                </Button>

                <DashboardBreadcrumb />
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
                {/* Theme Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="relative"
                    title="Toggle theme"
                >
                    {theme === 'dark' ? (
                        <FiSun className="w-5 h-5" />
                    ) : (
                        <FiMoon className="w-5 h-5" />
                    )}
                </Button>

                {/* Language Switcher */}
                <LanguageSwitcher />

                {/* Notifications */}
                <DashboardNotifications
                    showNotifications={showNotifications}
                    onToggle={onToggleNotifications}
                />
            </div>
        </header>
    )
})

DashboardHeader.displayName = 'DashboardHeader'
