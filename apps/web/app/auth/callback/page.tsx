'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { LoadingLogo } from '@/components/ui/loading-logo'

function CasdoorCallbackContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code')
            const state = searchParams.get('state')
            const error = searchParams.get('error')

            if (error) {
                
                if (window.opener) {
                    window.opener.postMessage(
                        { type: 'CASDOOR_LOGIN_ERROR', error: error },
                        window.location.origin
                    )
                    setTimeout(() => window.close(), 1000)
                } else {
                    router.push('/login?error=' + encodeURIComponent(error))
                }
                return
            }

            if (!code) {
                
                if (window.opener) {
                    window.opener.postMessage(
                        { type: 'CASDOOR_LOGIN_ERROR', error: 'No authorization code received' },
                        window.location.origin
                    )
                    setTimeout(() => window.close(), 1000)
                } else {
                    router.push('/login?error=no_code')
                }
                return
            }

            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
                const response = await fetch(`${apiUrl}/auth/casdoor/callback`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code, state }),
                })

                if (!response.ok) {
                    throw new Error('Failed to authenticate')
                }

                const data = await response.json()

                const result = await signIn('credentials', {
                    redirect: false,
                    code: code,
                    state: state,
                    backendData: JSON.stringify(data),
                })

                if (result?.error) {
                    router.push('/login?error=signin_failed')
                    return
                }

                if (window.opener) {
                    window.opener.postMessage(
                        { type: 'CASDOOR_LOGIN_SUCCESS' },
                        window.location.origin
                    )
                    setTimeout(() => {
                        window.close()
                    }, 500)
                } else {
                    router.push('/dashboard')
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
                
                if (window.opener) {
                    window.opener.postMessage(
                        { type: 'CASDOOR_LOGIN_ERROR', error: errorMessage },
                        window.location.origin
                    )
                    setTimeout(() => window.close(), 1000)
                } else {
                    router.push('/login?error=auth_failed')
                }
            }
        }

        handleCallback()
    }, [searchParams, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <LoadingLogo size="lg" text="Completing authentication..." />
        </div>
    )
}

export default function CasdoorCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <LoadingLogo size="lg" text="Loading..." />
            </div>
        }>
            <CasdoorCallbackContent />
        </Suspense>
    )
}
