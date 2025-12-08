'use client'

import { useEffect, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { LoadingLogo } from '@/components/ui/loading-logo'
import axios from 'axios'

function CasdoorCallbackContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const hasProcessed = useRef(false)

    useEffect(() => {
        // Log immediately when page loads
        console.log('=== Callback Page Loaded ===')
        console.log('Full URL:', window.location.href)
        console.log('Search params:', window.location.search)
        console.log('All params:', Object.fromEntries(searchParams.entries()))
        
        // Prevent double execution in development mode (React StrictMode)
        if (hasProcessed.current) {
            console.log('Already processed, skipping...')
            return
        }
        
        const handleCallback = async () => {
            hasProcessed.current = true
            
            const code = searchParams.get('code')
            const state = searchParams.get('state')
            const error = searchParams.get('error')
            
            console.log('Extracted params:', { code, state, error })

            if (error) {
                console.error('OAuth error:', error)
                router.push('/login?error=' + encodeURIComponent(error))
                return
            }

            if (!code) {
                console.error('No code received')
                router.push('/login?error=no_code')
                return
            }

            try {
                console.log('call api')
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
                
                // Debug logging
                console.log('API URL:', apiUrl)
                console.log('Code:', code)
                console.log('State:', state)
                console.log('Code type:', typeof code)
                console.log('State type:', typeof state)
                
                // Ensure proper types - searchParams.get returns string | null
                const payload: { code: string; state?: string } = {
                    code: code as string
                }
                
                // Only add state if it's a non-empty string
                if (state && state.trim()) {
                    payload.state = state
                }
                
                console.log('Payload to send:', JSON.stringify(payload, null, 2))
                console.log('Payload keys:', Object.keys(payload))
                console.log('Payload values:', Object.values(payload))
                console.log('Code value:', code)
                console.log('Code type:', typeof code)
                console.log('Code is string?', typeof code === 'string')
                
                // Ensure code is definitely a string
                const requestBody = {
                    code: String(code),
                    ...(state && { state: String(state) })
                }
                
                console.log('Final request body:', requestBody)
                console.log('Stringified:', JSON.stringify(requestBody))
                
                // Use fetch instead of axios to avoid any transformation issues
                const response = await fetch(`${apiUrl}/auth/casdoor/callback`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                })
                
                console.log('Response status:', response.status)
                console.log('Response ok:', response.ok)
                
                if (!response.ok) {
                    const errorText = await response.text()
                    console.error('Response error:', errorText)
                    throw new Error(`HTTP ${response.status}: ${errorText}`)
                }
                
                const data = await response.json()
                
                console.log('✅ Backend response received:', data)

                console.log('Calling NextAuth signIn with credentials...')
                const result = await signIn('credentials', {
                    redirect: false,
                    code: code,
                    state: state,
                    backendData: JSON.stringify(data),
                })

                console.log('NextAuth signIn result:', result)

                if (result?.error) {
                    console.error('❌ NextAuth signIn error:', result.error)
                    router.push('/login?error=signin_failed')
                    return
                }

                console.log('✅ Login successful! Redirecting to dashboard...')
                router.push('/dashboard')
            } catch (error) {
                console.error('Callback error:', error)
                
                let errorMessage = 'Authentication failed'
                if (axios.isAxiosError(error)) {
                    console.error('=== AXIOS ERROR ===')
                    console.error('Status:', error.response?.status)
                    console.error('Status Text:', error.response?.statusText)
                    console.error('Response Data:', JSON.stringify(error.response?.data, null, 2))
                    console.error('Request URL:', error.config?.url)
                    console.error('Request Data:', error.config?.data)
                    console.error('Error Message:', error.message)
                    
                    errorMessage = error.response?.data?.message || error.response?.data?.errors || error.message
                    
                    // Show validation errors if available
                    if (error.response?.data?.errors) {
                        console.error('Validation Errors:', error.response.data.errors)
                    }
                } else if (error instanceof Error) {
                    errorMessage = error.message
                }
                
                router.push('/login?error=' + encodeURIComponent(errorMessage))
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
