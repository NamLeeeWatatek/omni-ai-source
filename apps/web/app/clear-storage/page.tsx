'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { STORAGE_KEYS } from '@/lib/constants/storage'

export default function ClearStoragePage() {
  const [cleared, setCleared] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const clearAll = async () => {
      // Clear legacy localStorage (if any)
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
      
      // Clear NextAuth session
      await signOut({ redirect: false })
      
      setCleared(true)
    }

    clearAll()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-8 border rounded-xl">
        <h1 className="text-2xl font-bold mb-4">
          {cleared ? '✅ Storage Cleared' : '🔄 Clearing...'}
        </h1>
        <p className="text-muted-foreground mb-4">
          {cleared 
            ? 'All authentication data has been cleared.' 
            : 'Clearing localStorage and NextAuth session...'}
        </p>
        {cleared && (
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  )
}
