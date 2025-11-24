'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { fetchAPI } from '@/lib/api'

function CallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState('Processing login...')

    const handleLogin = useCallback(async (code: string, state: string | null) => {
        try {
            setStatus('Exchanging code for token...')
            const response = await fetchAPI('/auth/casdoor/login', {
                method: 'POST',
                body: JSON.stringify({ code, state })
            })

            if (response.access_token) {
                localStorage.setItem('wataomi_token', response.access_token)
                if (response.user) {
                    localStorage.setItem('wataomi_user', JSON.stringify(response.user))
                }
                setStatus('Login successful! Redirecting...')
                router.push('/dashboard')
            } else {
                throw new Error('No access token received')
            }
        } catch (error: unknown) {
            console.error('Login failed:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            setStatus(`Login failed: ${errorMessage}`)
        }
    }, [router])

    useEffect(() => {
        const code = searchParams.get('code')
        const state = searchParams.get('state')

        if (code) {
            handleLogin(code, state)
        } else {
            setStatus('No code received. Redirecting to login...')
            setTimeout(() => {
                router.push('/login')
            }, 2000)
        }
    }, [searchParams, router, handleLogin])

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="glass p-8 rounded-xl text-center">
                <h2 className="text-xl font-bold mb-4">Authenticating...</h2>
                <p className="text-muted-foreground">{status}</p>
            </div>
        </div>
    )
}

export default function CallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="glass p-8 rounded-xl text-center">
                    <h2 className="text-xl font-bold mb-4">Loading...</h2>
                    <p className="text-muted-foreground">Please wait...</p>
                </div>
            </div>
        }>
            <CallbackContent />
        </Suspense>
    )
}
