'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { LoadingLogo } from '@/components/ui/loading-logo'

function CallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState('Processing login...')
    const processedCode = useRef<string | null>(null)

    useEffect(() => {
        const code = searchParams.get('code')
        const state = searchParams.get('state')

        if (code) {
            // Prevent double execution for the same code
            if (processedCode.current === code) return
            processedCode.current = code

            const handleLogin = async () => {
                try {
                    setStatus('Authenticating with NextAuth...')
                    
                    const result = await signIn('credentials', {
                        code,
                        state: state || '',
                        redirect: false,
                        callbackUrl: '/dashboard',
                    })

                    if (result?.error) {
                        throw new Error(result.error)
                    }

                    if (result?.ok) {
                        setStatus('Login successful! Redirecting...')
                        // Force a hard redirect to ensure session is loaded
                        window.location.href = '/dashboard'
                    } else {
                        throw new Error('Authentication failed')
                    }
                } catch (error: unknown) {
                    console.error('Login failed:', error)
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                    setStatus(`Login failed: ${errorMessage}`)
                    setTimeout(() => {
                        router.push('/login')
                    }, 2000)
                }
            }

            handleLogin()
        } else {
            setStatus('No code received. Redirecting to login...')
            setTimeout(() => {
                router.push('/login')
            }, 2000)
        }
    }, [searchParams, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="glass p-8 rounded-xl text-center min-w-[300px]">
                <LoadingLogo size="lg" />
                <h2 className="text-xl font-bold mt-6 mb-2">Authenticating</h2>
                <p className="text-sm text-muted-foreground">{status}</p>
            </div>
        </div>
    )
}

export default function CallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <LoadingLogo size="lg" text="Please wait..." />
            </div>
        }>
            <CallbackContent />
        </Suspense>
    )
}
