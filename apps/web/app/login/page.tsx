'use client'

import { Button } from '@/components/ui/button'
import { AlertBanner } from '@/components/ui/alert-banner'
import { MdAutoAwesome, MdCheckCircle } from 'react-icons/md'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { LoadingLogo } from '@/components/ui/loading-logo'

export default function LoginPage() {
    const router = useRouter()
    const { isAuthenticated, isLoading } = useAuth()
    const [configError, setConfigError] = useState<string | null>(null)
    const [showSetupGuide, setShowSetupGuide] = useState(false)

    // Redirect if already authenticated
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/dashboard')
        }
    }, [isAuthenticated, isLoading, router])

    useEffect(() => {
        // Validate Casdoor configuration on mount
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

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-white">
                <LoadingLogo size="lg" text="Checking authentication..." />
            </div>
        )
    }

    // Don't render login form if already authenticated (will redirect)
    if (isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-white">
                <LoadingLogo size="lg" text="Redirecting to dashboard..." />
            </div>
        )
    }

    const handleLogin = async () => {
        try {
            // Get login URL from backend instead of using Casdoor SDK
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

            window.location.href = casdoorLoginUrl
        } catch (error) {
            console.error('Login error:', error);
            setConfigError('Failed to initialize Casdoor login. Please check the console for details.')
            setShowSetupGuide(true)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            <div className="w-full max-w-md p-6 relative z-10">
                <div className="glass rounded-xl p-8">
                    {/* Logo/Brand */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-lg bg-primary mb-6">
                            <MdAutoAwesome className="w-10 h-10 text-primary-foreground" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">
                            WataOmi
                        </h1>
                        <p className="text-muted-foreground">
                            AI-Powered Omnichannel Platform
                        </p>
                    </div>

                    {/* Error Message */}
                    {configError && (
                        <AlertBanner variant="error" title="Configuration Error" className="mb-6">
                            {configError}
                        </AlertBanner>
                    )}

                    {/* Login Button */}
                    <div className="space-y-4">
                        <Button
                            onClick={handleLogin}
                            className="w-full h-12 text-base font-semibold"
                            disabled={!!configError}
                        >
                            Sign in with Casdoor
                        </Button>

                        <p className="text-xs text-center text-muted-foreground">
                            By signing in, you agree to our Terms of Service and Privacy Policy
                        </p>
                    </div>

                    {/* Features */}
                    <div className="mt-8 pt-6 border-t border-border/40">
                        <div className="grid gap-3">
                            {[
                                'AI-powered workflow automation',
                                'Omnichannel messaging',
                                'Advanced analytics & insights'
                            ].map((feature, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 text-sm text-muted-foreground"
                                >
                                    <MdCheckCircle className="w-5 h-5 text-success" />
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
