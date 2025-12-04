export interface OAuthProviderInterface {
    /**
     * Get the OAuth URL to redirect the user to
     */
    getOAuthUrl(redirectUri: string, state?: string): string;

    /**
     * Exchange the authorization code for an access token
     */
    exchangeCodeForToken(code: string, redirectUri: string): Promise<any>;

    /**
     * Get the user's profile or pages/accounts available to connect
     */
    getConnectableAccounts(accessToken: string): Promise<any[]>;
}
