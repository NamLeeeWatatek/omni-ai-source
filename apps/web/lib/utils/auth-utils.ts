/**
 * Forcefully clears common authentication-related data from the browser.
 * This is a secondary fail-safe for next-auth's internal clearing.
 */
export function clearAuthBrowserData() {
    if (typeof window === 'undefined') return;

    try {
        // 1. Clear LocalStorage and SessionStorage
        localStorage.clear();
        sessionStorage.clear();

        // 2. Clear known non-HttpOnly cookies
        // We can't clear HttpOnly cookies (like the session token), 
        // but we can clear CSRF and callback-related ones.
        const cookies = document.cookie.split(";");

        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

            // Overwrite with expired date
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
            // Also try with common domain suffixes if needed
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
        }

        console.log('[AuthUtils] Browser auth data cleared');
    } catch (e) {
        console.warn('[AuthUtils] Error clearing browser data:', e);
    }
}
