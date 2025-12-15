'use client'

import { Button } from '@/components/ui/Button'
import { MdAutoAwesome, MdCheckCircle, MdArrowBack } from 'react-icons/md'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/lib/hooks/useAuth'
import { LoadingLogo } from '@/components/ui/LoadingLogo'

function LoginPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { t } = useTranslation()
    const { isAuthenticated, isLoading } = useAuth()

    // âœ… State for errors from user actions (not from URL)
    const [userActionError, setUserActionError] = useState<string | null>(null)

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/dashboard')
        }
    }, [isAuthenticated, isLoading, router])

    // âœ… Read and process error from URL on mount only
    useEffect(() => {
        const urlError = searchParams.get('error')
        if (urlError) {
            const errorMessages: Record<string, string> = {
                'no_code': t('login.errors.noCode'),
                'signin_failed': t('login.errors.signinFailed'),
                'auth_failed': t('login.errors.authFailed'),
            }
            const message = errorMessages[urlError] || decodeURIComponent(urlError)
            setUserActionError(message)

            // Clear URL immediately to prevent persistence
            window.history.replaceState({}, '', '/login')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t]) // Only run once on mount

    // âœ… Display error from user actions
    const configError = userActionError

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background force-light">
                <LoadingLogo size="lg" text={t('login.pleaseWait')} />
            </div>
        )
    }

    if (isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background force-light">
                <LoadingLogo size="lg" text={t('login.redirecting')} />
            </div>
        )
    }

    const handleLogin = async () => {
        // Clear previous errors
        setUserActionError(null);

        try {
            // âœ… Validate frontend env variables first
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

            // âœ… Better error handling with detailed messages
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
                setUserActionError(t('login.errors.casdoorConfig'))
                return
            }

            // Direct redirect instead of popup for easier debugging
            console.log('Redirecting to Casdoor...')
            window.location.href = casdoorLoginUrl
        } catch (error: any) {
            console.error('Login error:', error);
            setUserActionError(error.message || t('login.errors.loginInitFailed'))
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background force-light relative overflow-hidden">
            { }
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md p-6 relative z-10">
                <div className="card-hover p-8 bg-card/80 backdrop-blur-sm">
                    { }
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-lg bg-gradient-wata mb-6 shadow-lg">
                            <MdAutoAwesome className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">
                            <span className="gradient-text">WataOmi</span>
                        </h1>
                        <p className="text-muted-foreground" suppressHydrationWarning>
                            {t('login.title')}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Button
                            onClick={handleLogin}
                            className="btn-primary btn-lg w-full"
                            suppressHydrationWarning
                        >
                            {t('login.signInWithCasdoor')}
                        </Button>

                        <p className="text-xs text-center text-muted-foreground" suppressHydrationWarning>
                            {t('login.termsAgreement')}{' '}
                            <a href="#" className="text-primary hover:underline">{t('login.termsOfService')}</a>
                            {' '}{t('login.and')}{' '}
                            <a href="#" className="text-primary hover:underline">{t('login.privacyPolicy')}</a>
                        </p>
                    </div>

                    { }
                    <div className="mt-8 pt-6 divider">
                        <div className="grid gap-3">
                            {[
                                t('login.features.aiWorkflow'),
                                t('login.features.omnichannel'),
                                t('login.features.analytics')
                            ].map((feature, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 text-sm text-muted-foreground fade-in"
                                    style={{ animationDelay: `${i * 100}ms` }}
                                    suppressHydrationWarning
                                >
                                    <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                                        <MdCheckCircle className="w-4 h-4 text-success" />
                                    </div>
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>

                    { }
                    <div className="mt-6 text-center">
                        <a href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors" suppressHydrationWarning>
                            <MdArrowBack className="w-4 h-4" />
                            {t('login.backToHome')}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    const { t } = useTranslation()

    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background force-light">
                <LoadingLogo size="lg" text={t('login.loading')} />
            </div>
        }>
            <LoginPageContent />
        </Suspense>
    )
}
