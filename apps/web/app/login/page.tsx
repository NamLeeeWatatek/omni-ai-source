'use client'

import { Button } from '@/components/ui/button'
import { AlertBanner } from '@/components/ui/alert-banner'
import { MdAutoAwesome, MdCheckCircle, MdArrowBack } from 'react-icons/md'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { LoadingLogo } from '@/components/ui/loading-logo'

export default function LoginPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading } = useAuth()
    const [configError, setConfigError] = useState<string | null>(null)
    const [showSetupGuide, setShowSetupGuide] = useState(false)

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/dashboard')
        }
    }, [isAuthenticated, isLoading, router])

    useEffect(() => {
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

            setConfigError(`Missing environment variables: ${missing.join(', ')}`)
        }
    }, [])

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
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
            const response = await fetch(`${apiUrl}/auth/casdoor/login-url`);
            
            if (!response.ok) {
                throw new Error('Failed to get login URL from backend');
            }

            const data = await response.json();
            const casdoorLoginUrl = data.loginUrl;

            if (!casdoorLoginUrl || casdoorLoginUrl === 'undefined') {
                setConfigError('Casdoor is not properly configured. Please check your environment variables.')
                setShowSetupGuide(true)
                return
            }

            const width = 500
            const height = 650
            const left = window.screen.width / 2 - width / 2
            const top = window.screen.height / 2 - height / 2

            const popup = window.open(
                casdoorLoginUrl,
                'casdoor_login',
                `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
            )

            if (!popup) {
                setConfigError('Popup blocked! Please allow popups for this site.')
                return
            }

            const handleMessage = (event: MessageEvent) => {
                if (event.origin !== window.location.origin) return
                
                if (event.data.type === 'CASDOOR_LOGIN_SUCCESS') {
                    if (popup && !popup.closed) {
                        popup.close()
                    }
                    window.location.href = '/dashboard'
                }
                
                if (event.data.type === 'CASDOOR_LOGIN_ERROR') {
                    if (popup && !popup.closed) {
                        popup.close()
                    }
                    setConfigError(event.data.error || 'Login failed')
                }
            }

            window.addEventListener('message', handleMessage)

            const checkPopup = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkPopup)
                    window.removeEventListener('message', handleMessage)
                }
            }, 500)
        } catch (error) {
            setConfigError('Failed to initialize Casdoor login. Please check the console for details.')
            setShowSetupGuide(true)
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
                            disabled={!!configError}
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
