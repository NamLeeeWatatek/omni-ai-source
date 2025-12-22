import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/Sonner'

import { ReduxProvider } from '@/lib/store/Provider'
import './globals.css'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { I18nProvider } from '@/components/providers/I18nProvider'
import { SessionProvider } from 'next-auth/react'
import { ThemeProviderWrapper } from '@/components/providers/ThemeProviderWrapper'
import { GlobalLoadingOverlay } from '@/components/providers/GlobalLoadingOverlay'
import { ErrorBoundary } from '@/components/providers/ErrorBoundary'

const inter = Inter({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'WataOmi - One AI. Every Channel. Zero Code.',
    description: 'AI-powered omnichannel customer engagement platform with zero-code flow builder and unified inbox.',
    keywords: ['AI', 'chatbot', 'omnichannel', 'customer engagement', 'automation', 'n8n'],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} font-sans antialiased`}>
                <I18nProvider>
                    <SessionProvider>
                        <QueryProvider>
                            <ThemeProviderWrapper>
                                <ReduxProvider>
                                    <ErrorBoundary>
                                        {children}
                                    </ErrorBoundary>
                                    <GlobalLoadingOverlay />
                                    <Toaster />
                                </ReduxProvider>
                            </ThemeProviderWrapper>
                        </QueryProvider>
                    </SessionProvider>
                </I18nProvider>
            </body>
        </html>
    )
}
