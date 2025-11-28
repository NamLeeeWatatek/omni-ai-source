'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { useSession } from 'next-auth/react'

export default function TestAuthPage() {
  const { user, isAuthenticated, isLoading, accessToken } = useAuth()
  const { data: session, status } = useSession()

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">NextAuth Debug Page</h1>
          <div className="flex gap-2">
            {status === 'authenticated' ? (
              <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-sm font-medium">
                ✓ Authenticated
              </span>
            ) : status === 'loading' ? (
              <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-sm font-medium">
                ⏳ Loading...
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-500 text-sm font-medium">
                ✗ Not Authenticated
              </span>
            )}
          </div>
        </div>
        
        <div className="glass p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">useSession() Hook</h2>
          <div className="space-y-2">
            <p><strong>Status:</strong> <code className="px-2 py-1 bg-muted rounded">{status}</code></p>
            <p><strong>Session:</strong></p>
            <pre className="bg-black/20 p-4 rounded overflow-auto text-xs">
              {JSON.stringify(session, null, 2) || 'null'}
            </pre>
          </div>
        </div>

        <div className="glass p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">useAuth() Hook</h2>
          <div className="space-y-2">
            <p><strong>Is Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Is Loading:</strong> {isLoading ? '⏳ Yes' : '✓ No'}</p>
            <p><strong>User:</strong></p>
            <pre className="bg-black/20 p-4 rounded overflow-auto text-xs">
              {JSON.stringify(user, null, 2) || 'null'}
            </pre>
            <p><strong>Access Token:</strong></p>
            <pre className="bg-black/20 p-4 rounded overflow-auto text-xs">
              {accessToken?.substring(0, 50) + '...' || 'null'}
            </pre>
          </div>
        </div>

        <div className="glass p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2">
            <p><strong>API URL:</strong> <code className="px-2 py-1 bg-muted rounded text-xs">{process.env.NEXT_PUBLIC_API_URL}</code></p>
            <p><strong>Casdoor Endpoint:</strong> <code className="px-2 py-1 bg-muted rounded text-xs">{process.env.NEXT_PUBLIC_CASDOOR_ENDPOINT}</code></p>
            <p><strong>Casdoor Client ID:</strong> <code className="px-2 py-1 bg-muted rounded text-xs">{process.env.NEXT_PUBLIC_CASDOOR_CLIENT_ID}</code></p>
          </div>
        </div>

        <div className="glass p-6 rounded-lg border-l-4 border-blue-500">
          <h2 className="text-xl font-semibold mb-4">💡 Instructions</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold mb-1">If Status is "unauthenticated":</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                <li>Go to <code className="px-1.5 py-0.5 bg-muted rounded">/login</code></li>
                <li>Click "Sign in with Casdoor"</li>
                <li>Login at Casdoor</li>
                <li>You will be redirected back</li>
              </ol>
            </div>
            <div>
              <p className="font-semibold mb-1">If Status is "authenticated":</p>
              <p className="text-green-500">✅ NextAuth is working correctly!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
