'use client'

import React from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/Button'
import { DashboardBreadcrumb } from './DashboardBreadcrumb'
import { DashboardNotifications } from './DashboardNotifications'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { Sun, Moon, Menu } from 'lucide-react'

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
        <header className="h-16 flex items-center justify-between px-6 flex-shrink-0 bg-background/50 backdrop-blur-xl border-b border-border/10 sticky top-0 z-40 transition-all duration-200">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleSidebar}
                    className="lg:hidden hover:bg-primary/5"
                >
                    <Menu className="w-5 h-5" />
                </Button>

                <DashboardBreadcrumb />
            </div>

            <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="relative w-9 h-9 rounded-full hover:bg-primary/5"
                    title="Toggle theme"
                >
                    {theme === 'dark' ? (
                        <Sun className="w-4 h-4" />
                    ) : (
                        <Moon className="w-4 h-4" />
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
