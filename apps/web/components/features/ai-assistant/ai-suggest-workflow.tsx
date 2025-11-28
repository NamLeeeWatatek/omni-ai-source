'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FiZap, FiLoader } from 'react-icons/fi'

interface AISuggestProps {
    onSuggest: (workflow: any) => void
}

export function AISuggestWorkflow({ onSuggest }: AISuggestProps) {
    const [description, setDescription] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSuggest = async () => {
        if (!description.trim()) {
            setError('Please enter a description')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
            
            // Get token from NextAuth session
            const { getSession } = await import('next-auth/react')
            const session = await getSession()
            const token = session?.accessToken

            const response = await fetch(`${apiUrl}/ai/workflow/suggest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    description: description
                })
            })

            if (!response.ok) {
                throw new Error('Failed to generate workflow suggestion')
            }

            const data = await response.json()
            onSuggest(data)
            setDescription('')
        } catch (err) {
            console.error('Error suggesting workflow:', err)
            setError('Failed to generate suggestion. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="glass rounded-xl p-6 border border-border/40">
            <div className="flex items-center gap-2 mb-4">
                <FiZap className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">AI Workflow Suggestion</h3>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
                Describe what you want your workflow to do, and AI will suggest a complete workflow for you.
            </p>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Describe your workflow
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Example: I want to automatically respond to customer support messages with AI and escalate urgent issues to my team..."
                        rows={4}
                        className="w-full glass rounded-lg px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                        disabled={isLoading}
                    />
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                        {error}
                    </div>
                )}

                <Button
                    onClick={handleSuggest}
                    disabled={isLoading || !description.trim()}
                    className="w-full"
                >
                    {isLoading ? (
                        <>
                            <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <FiZap className="w-4 h-4 mr-2" />
                            Generate Workflow
                        </>
                    )}
                </Button>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-muted/20 border border-border/20">
                <p className="text-xs text-muted-foreground">
                    <strong>Tip:</strong> Be specific about your use case. Mention keywords like "customer support", "sales", "orders", or "chatbot" for better suggestions.
                </p>
            </div>
        </div>
    )
}
