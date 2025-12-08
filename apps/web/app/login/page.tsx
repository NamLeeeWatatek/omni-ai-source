'use client'

import { Button } from '@/components/ui/button'
import { AlertBanner } from '@/components/ui/alert-banner'
import { MdAutoAwesome, MdCheckCircle, MdArrowBack } from 'react-icons/md'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { LoadingLogo } from '@/components/ui/loading-logo'

function LoginPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { isAuthenticated, isLoading } = useAuth()
    
    // ✅ State for errors from user actions (not from URL)
    const [userActionError, setUserActionError] = useState<string | null>(null)

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/dashboard')
        }
    }, [isAuthenticated, isLoading, router])

    // ✅ Read and process error from URL on mount only
    useEffect(() => {
        const urlError = searchParams.get('error')
        if (urlError) {
            const errorMessages: Record<string, string> = {
                'no_code': 'No authorization code received from Casdoor',
                'signin_failed': 'Failed to sign in. Please try again.',
                'auth_failed': 'Authentication failed. Please try again.',
            }
            const message = errorMessages[urlError] || decodeURIComponent(urlError)
            setUserActionError(message)
            
            // Clear URL immediately to prevent persistence
            window.history.replaceState({}, '', '/login')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Only run once on mount

    // ✅ Display error from user actions
    const configError = userActionError

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background force-light">
                <LoadingLogo size="lg" text="Please wait..." />
            </div>
        )
    }

    if (isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background force-light">
                <LoadingLogo size="lg" text="Redirecting..." />
            </div>
        )
    }

    const handleLogin = async () => {
        // Clear previous errors
        setUserActionError(null);
        
        try {
            // ✅ Validate frontend env variables first
            const endpoint = process.env.NEXT_PUBLIC_CASDOOR_ENDPOINT
            const clientId = process.env.NEXT_PUBLIC_CASDOOR_CLIENT_ID
            const orgName = process.env.NEXT_PUBLIC_CASDOOR_ORG_NAME
            const appName = process.env.NEXT_PUBLIC_CASDOOR_APP_NAME

            if (!endpoint || !clientId || !orgName || !appName) {
                const missing = []
                if (!endpoint) missing.push('NEXT_PUBLIC_CASDOOR_ENDPOINT')
                if (!clientId) missing.push('NEXT_PUBLIC_CASDOOR_CLIENT_ID')
                if (!orgName) missing.push('NEXT_PUBLIC_CASDOOR_ORG_NAME')
                if (!appName) missing.push('NEXT_PUBLIC_CASDOOR_APP_NAME')

                throw new Error(`Missing environment variables: ${missing.join(', ')}`)
            }
            
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            
            // ✅ Better error handling with detailed messages
            let response;
            try {
                response = await fetch(`${apiUrl}/auth/casdoor/login-url`);
            } catch (fetchError: any) {
                console.error('Network error:', fetchError);
                throw new Error(`Cannot connect to backend at ${apiUrl}. Please check if backend is running.`);
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Backend error:', response.status, errorText);
                throw new Error(`Backend returned error ${response.status}: ${errorText || 'Unknown error'}`);
            }

            const data = await response.json();
            const casdoorLoginUrl = data.loginUrl;

            console.log('Casdoor Login URL:', casdoorLoginUrl);
            
            // Extract redirect_uri from URL for debugging
            try {
                const url = new URL(casdoorLoginUrl);
                const redirectUri = url.searchParams.get('redirect_uri');
                console.log('Redirect URI:', redirectUri);
            } catch (e) {
                console.error('Failed to parse login URL:', e);
            }

            if (!casdoorLoginUrl || casdoorLoginUrl === 'undefined') {
                setUserActionError('Casdoor is not properly configured. Please check your environment variables.')
                return
            }

            // Direct redirect instead of popup for easier debugging
            console.log('Redirecting to Casdoor...')
            window.location.href = casdoorLoginUrl
        } catch (error: any) {
            console.error('Login error:', error);
            setUserActionError(error.message || 'Failed to initialize Casdoor login. Please check the console for details.')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background force-light relative overflow-hidden">
            {}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md p-6 relative z-10">
                <div className="card-hover p-8 bg-card/80 backdrop-blur-sm">
                    {}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-lg bg-gradient-wata mb-6 shadow-lg">
                            <MdAutoAwesome className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">
                            <span className="gradient-text">WataOmi</span>
                        </h1>
                        <p className="text-muted-foreground">
                            AI-Powered Omnichannel Platform
                        </p>
                    </div>

                    {}
                    {configError && (
                        <AlertBanner variant="error" title="Configuration Error" className="mb-6">
                            {configError}
                        </AlertBanner>
                    )}

                    {}
                    <div className="space-y-4">
                        <Button
                            onClick={handleLogin}
                            className="btn-primary btn-lg w-full"
                        >
                            Sign in with Casdoor
                        </Button>

                        <p className="text-xs text-center text-muted-foreground">
                            By signing in, you agree to our{' '}
                            <a href="#" className="text-primary hover:underline">Terms of Service</a>
                            {' '}and{' '}
                            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                        </p>
                    </div>

                    {}
                    <div className="mt-8 pt-6 divider">
                        <div className="grid gap-3">
                            {[
                                'AI-powered workflow automation',
                                'Omnichannel messaging',
                                'Advanced analytics & insights'
                            ].map((feature, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 text-sm text-muted-foreground fade-in"
                                    style={{ animationDelay: `${i * 100}ms` }}
                                >
                                    <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                                        <MdCheckCircle className="w-4 h-4 text-success" />
                                    </div>
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>

                    {}
                    <div className="mt-6 text-center">
                        <a href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                            <MdArrowBack className="w-4 h-4" />
                            Back to home
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background force-light">
                <LoadingLogo size="lg" text="Loading..." />
            </div>
        }>
            <LoginPageContent />
        </Suspense>
    )
}
