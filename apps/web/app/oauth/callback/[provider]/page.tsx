'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui/spinner'
import { FiCheckCircle, FiXCircle } from 'react-icons/fi'

export default function OAuthCallbackPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const provider = window.location.pathname.split('/').pop()

        if (error) {
            setStatus('error')
            setMessage(`OAuth error: ${error}`)
            return
        }

        if (!code) {
            setStatus('error')
            setMessage('No authorization code received')
            return
        }

        // Send code to backend
        const handleCallback = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
                
                // Get token from NextAuth session
                const { getSession } = await import('next-auth/react')
                const session = await getSession()
                const token = session?.accessToken
                
                const res = await fetch(`${apiUrl}/oauth/callback/${provider}?code=${code}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                const data = await res.json()

                if (res.ok) {
                    setStatus('success')
                    setMessage(data.message || 'Channel connected successfully!')

                    // Redirect to channels page after 2 seconds
                    setTimeout(() => {
                        router.push('/channels')
                    }, 2000)
                } else {
                    setStatus('error')
                    setMessage(data.detail || 'Failed to connect channel')
                }
            } catch (err) {
                setStatus('error')
                setMessage('An error occurred while connecting the channel')
                console.error(err)
            }
        }

        handleCallback()
    }, [searchParams, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="glass rounded-xl p-8 max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <Spinner className="size-16 mx-auto mb-4 text-primary" />
                        <h2 className="text-2xl font-bold mb-2">Connecting Channel...</h2>
                        <p className="text-muted-foreground">Please wait while we complete the connection</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <FiCheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                        <h2 className="text-2xl font-bold mb-2 text-green-500">Success!</h2>
                        <p className="text-muted-foreground">{message}</p>
                        <p className="text-sm text-muted-foreground mt-2">Redirecting to channels...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <FiXCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                        <h2 className="text-2xl font-bold mb-2 text-red-500">Connection Failed</h2>
                        <p className="text-muted-foreground mb-4">{message}</p>
                        <button
                            onClick={() => router.push('/channels')}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                        >
                            Back to Channels
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
