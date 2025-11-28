import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
    // Get token from NextAuth session
    const session = await getSession();
    const token = session?.accessToken;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            // Try to parse error message
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `API Error: ${response.status} ${response.statusText}`);
        }

        // Return null for 204 No Content
        if (response.status === 204) return null;

        return response.json();
    } catch (error) {
        console.error(`API call failed: ${endpoint}`, error);
        throw error;
    }
}
