import { useRouter } from 'next/navigation'

export function useAuth() {
    const router = useRouter()

    const getToken = () => {
        if (typeof window === 'undefined') return null
        return localStorage.getItem('wataomi_token')
    }

    const getUser = () => {
        if (typeof window === 'undefined') return null
        const userStr = localStorage.getItem('wataomi_user')
        return userStr ? JSON.parse(userStr) : null
    }

    const isAuthenticated = () => {
        return !!getToken()
    }

    const login = (token: string, user: any) => {
        localStorage.setItem('wataomi_token', token)
        localStorage.setItem('wataomi_user', JSON.stringify(user))
    }

    const logout = async () => {
        try {
            // Call backend logout endpoint (optional, for session cleanup)
            const token = getToken()
            if (token) {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002/api/v1'}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }).catch(() => {
                    // Ignore errors - we'll clear local storage anyway
                })
            }
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            // Always clear local storage
            localStorage.removeItem('wataomi_token')
            localStorage.removeItem('wataomi_user')
            router.push('/login')
        }
    }

    const requireAuth = () => {
        if (!isAuthenticated()) {
            router.push('/login')
            return false
        }
        return true
    }

    return {
        getToken,
        getUser,
        isAuthenticated,
        login,
        logout,
        requireAuth
    }
}
