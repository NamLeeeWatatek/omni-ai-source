'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

/**
 * Monitors the session for errors (like RefreshAccessTokenError)
 * and automatically logs the user out.
 */
export function SessionWatcher() {
    const { error, signOut } = useAuth();

    useEffect(() => {
        if (error === 'RefreshAccessTokenError') {
            console.warn('[SessionWatcher] Refresh token expired, signing out...');

            // Prevent multiple sign-outs
            if (typeof window !== 'undefined' && !(window as any)._isSigningOut) {
                (window as any)._isSigningOut = true;
                signOut();
            }
        }
    }, [error, signOut]);

    return null;
}
