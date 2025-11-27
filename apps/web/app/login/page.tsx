'use client'

import { casdoorSdk } from '@/lib/casdoor'
import { Button } from '@/components/ui/button'
import { MdAutoAwesome, MdWarning, MdInfo } from 'react-icons/md'
import { useState, useEffect } from 'react'

export default function LoginPage() {
    const [configError, setConfigError] = useState<string | null>(null)
    const [showSetupGuide, setShowSetupGuide] = useState(false)

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

    const handleLogin = () => {
        try {
            const casdoorLoginUrl = casdoorSdk.getSigninUrl()

            console.log('Casdoor Login URL:', casdoorLoginUrl)
            console.log('Casdoor Config:', {
                endpoint: process.env.NEXT_PUBLIC_CASDOOR_ENDPOINT,
                clientId: process.env.NEXT_PUBLIC_CASDOOR_CLIENT_ID,
                orgName: process.env.NEXT_PUBLIC_CASDOOR_ORG_NAME,
                appName: process.env.NEXT_PUBLIC_CASDOOR_APP_NAME
            })

            if (!casdoorLoginUrl || casdoorLoginUrl === 'undefined' || casdoorLoginUrl.includes('client_id=&')) {
                setConfigError('Casdoor is not properly configured. Please check your environment variables.')
                setShowSetupGuide(true)
                return
            }

            window.location.href = casdoorLoginUrl
        } catch (error) {
            console.error('Login error:', error)
            setConfigError('Failed to initialize Casdoor login. Please check the console for details.')
            setShowSetupGuide(true)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-full max-w-md p-8">
                <div className="glass rounded-2xl p-8 border border-border/40 shadow-2xl">
                    {/* Logo/Brand */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-800 mb-4">
                            <MdAutoAwesome className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2 bg-zinc-800 bg-clip-text text-transparent">
                            WataOmi
                        </h1>
                        <p className="text-muted-foreground">
                            AI-Powered Omnichannel Platform
                        </p>
                    </div>

                    {/* Error Message */}
                    {configError && (
                        <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                            <div className="flex items-start gap-3">
                                <MdWarning className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-yellow-500 mb-1">Configuration Error</h3>
                                    <p className="text-sm text-yellow-500/80">{configError}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Setup Guide */}
                    {showSetupGuide && (
                        <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <div className="flex items-start gap-3">
                                <MdInfo className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-blue-500 mb-2">Setup Instructions</h3>
                                    <ol className="text-sm text-blue-500/80 space-y-2 list-decimal list-inside">
                                        <li>Create <code className="px-1.5 py-0.5 rounded bg-blue-500/20">.env.local</code> file in <code className="px-1.5 py-0.5 rounded bg-blue-500/20">apps/web/</code></li>
                                        <li>Add required Casdoor environment variables</li>
                                        <li>Restart the development server</li>
                                    </ol>
                                    <p className="text-xs mt-3 text-blue-500/60">
                                        See <code className="px-1.5 py-0.5 rounded bg-blue-500/20">CASDOOR_SETUP.md</code> for detailed instructions
                                    </p>
                                </div>
                            </div>
                        </div>
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
                    <div className="mt-8 pt-8 border-t border-border/40">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                            What you get
                        </p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                AI-powered workflow automation
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Omnichannel messaging
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Advanced analytics & insights
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
