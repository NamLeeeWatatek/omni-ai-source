'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'

export default function IntegrationsRedirect() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to channels page
        router.replace('/channels')
    }, [router])

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center">
                <Spinner className="size-8 mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">
                    Redirecting to Channels & Integrations...
                </p>
            </div>
        </div>
    )
}
