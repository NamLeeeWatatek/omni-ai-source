'use client'

import { useParams, usePathname, useRouter } from 'next/navigation'
import { FiSettings, FiCode, FiArrowLeft } from 'react-icons/fi'
import { Button } from '@/components/ui/button'

const tabs = [
    { value: 'settings', label: 'Configuration', icon: FiSettings, path: '' },
    { value: 'widget', label: 'Widget', icon: FiCode, path: '/widget' },
]

export default function BotDetailLayout({ children }: { children: React.ReactNode }) {
    const params = useParams()
    const pathname = usePathname()
    const router = useRouter()
    const botId = params.id as string

    const currentTab = pathname.endsWith('/widget') ? 'widget' : 'settings'

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/bots')}
                >
                    <FiArrowLeft className="w-4 h-4 mr-2" />
                    Back to Bots
                </Button>
            </div>

            <div className="border-b">
                <nav className="flex gap-4">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = currentTab === tab.value
                        return (
                            <button
                                key={tab.value}
                                onClick={() => router.push(`/bots/${botId}${tab.path}`)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                                    isActive
                                        ? 'border-primary text-primary font-medium'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        )
                    })}
                </nav>
            </div>

            {children}
        </div>
    )
}
