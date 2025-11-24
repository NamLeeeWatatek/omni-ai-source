'use client'

import { useState } from 'react'
import { Button } from '@wataomi/ui'
import { FiCopy, FiCheck } from 'react-icons/fi'

export default function SettingsPage() {
    const [copied, setCopied] = useState(false)
    const [bubbleColor, setBubbleColor] = useState('#8B5CF6')
    const [bubblePosition, setBubblePosition] = useState<'right' | 'left'>('right')

    const embedCode = `<script src="https://wataomi.com/watabubble.js"></script>
<script>
  WataBubble.init({
    botId: 'your-bot-id',
    color: '${bubbleColor}',
    position: '${bubblePosition}'
  });
</script>`

    const handleCopy = () => {
        navigator.clipboard.writeText(embedCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">Settings</h2>
                <p className="text-muted-foreground">
                    Configure your bots and WataBubble widget
                </p>
            </div>

            {/* WataBubble Customizer */}
            <div className="glass rounded-xl p-6 border border-border/40">
                <h3 className="text-lg font-semibold mb-4">WataBubble Widget Customizer</h3>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Bubble Color</label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="color"
                                    value={bubbleColor}
                                    onChange={(e) => setBubbleColor(e.target.value)}
                                    className="w-12 h-12 rounded-lg cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={bubbleColor}
                                    onChange={(e) => setBubbleColor(e.target.value)}
                                    className="flex-1 px-3 py-2 rounded-lg bg-muted text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Position</label>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setBubblePosition('left')}
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${bubblePosition === 'left'
                                        ? 'bg-gradient-wata text-white'
                                        : 'bg-muted hover:bg-accent'
                                        }`}
                                >
                                    Bottom Left
                                </button>
                                <button
                                    onClick={() => setBubblePosition('right')}
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${bubblePosition === 'right'
                                        ? 'bg-gradient-wata text-white'
                                        : 'bg-muted hover:bg-accent'
                                        }`}
                                >
                                    Bottom Right
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Embed Code</label>
                            <div className="relative">
                                <pre className="p-4 rounded-lg bg-muted text-sm overflow-x-auto">
                                    <code>{embedCode}</code>
                                </pre>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="absolute top-2 right-2"
                                    onClick={handleCopy}
                                >
                                    {copied ? (
                                        <FiCheck className="w-4 h-4" />
                                    ) : (
                                        <FiCopy className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div className="glass rounded-lg p-6 border border-border/40 relative h-96">
                        <div className="text-center text-sm text-muted-foreground mb-4">
                            Live Preview
                        </div>
                        <div className="absolute bottom-6 right-6 left-6 h-64 bg-background rounded-lg border border-border/40 flex items-center justify-center">
                            <p className="text-muted-foreground text-sm">Your website preview</p>
                        </div>
                        <button
                            className={`absolute ${bubblePosition === 'right' ? 'right-10' : 'left-10'
                                } bottom-10 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110`}
                            style={{ backgroundColor: bubbleColor }}
                        >
                            <svg
                                className="w-7 h-7 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Bot Settings */}
            <div className="glass rounded-xl p-6 border border-border/40">
                <h3 className="text-lg font-semibold mb-4">Bot Settings</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Default Bot Name</label>
                        <input
                            type="text"
                            defaultValue="WataBot"
                            className="w-full px-3 py-2 rounded-lg bg-muted text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block">Welcome Message</label>
                        <textarea
                            rows={3}
                            defaultValue="Hi! How can I help you today?"
                            className="w-full px-3 py-2 rounded-lg bg-muted text-sm resize-none"
                        />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                        <div>
                            <p className="font-medium text-sm">Enable AI Responses</p>
                            <p className="text-xs text-muted-foreground">Use AI to generate intelligent replies</p>
                        </div>
                        <button className="w-12 h-6 rounded-full bg-gradient-wata relative">
                            <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white" />
                        </button>
                    </div>
                    <Button>Save Settings</Button>
                </div>
            </div>
        </div>
    )
}
