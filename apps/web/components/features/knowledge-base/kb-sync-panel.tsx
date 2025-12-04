import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FiRefreshCw, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi'
import { axiosClient } from '@/lib/axios-client'
import { toast } from 'sonner'

interface SyncPanelProps {
    knowledgeBaseId: string
}

interface VerifyResult {
    totalChunks: number
    missingVectors: number
    failedEmbeddings: number
}

export function KBSyncPanel({ knowledgeBaseId }: SyncPanelProps) {
    const [verifying, setVerifying] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [rebuilding, setRebuilding] = useState(false)
    const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null)

    const handleVerify = async () => {
        setVerifying(true)
        try {
            const result = await (await axiosClient.get(`/knowledge-bases/${knowledgeBaseId}/verify-collection`)).data
            setVerifyResult(result)

            if (result.missingVectors === 0 && result.failedEmbeddings === 0) {
                toast.success('Collection is healthy!')
            } else {
                toast.warning(`Found ${result.missingVectors} missing vectors and ${result.failedEmbeddings} failed embeddings`)
            }
        } catch {
            toast.error('Failed to verify collection')

        } finally {
            setVerifying(false)
        }
    }

    const handleSyncMissing = async () => {
        setSyncing(true)
        try {
            const result = await axiosClient(`/knowledge-bases/${knowledgeBaseId}/sync-missing`, {
                method: 'POST',
            })

            toast.success(`Synced ${result.data.synced} vectors (${result.data.errors} errors)`)

            handleVerify()
        } catch {
            toast.error('Failed to sync missing vectors')

        } finally {
            setSyncing(false)
        }
    }

    const handleRebuild = async () => {
        if (!confirm('This will regenerate ALL embeddings. Continue?')) {
            return
        }

        setRebuilding(true)
        try {
            const result = await axiosClient(`/knowledge-bases/${knowledgeBaseId}/rebuild-collection`, {
                method: 'POST',
            })

            toast.success(`Rebuilt ${result.data.chunksProcessed} chunks (${result.data.errors} errors)`)

            handleVerify()
        } catch {
            toast.error('Failed to rebuild collection')

        } finally {
            setRebuilding(false)
        }
    }

    const isHealthy = verifyResult && verifyResult.missingVectors === 0 && verifyResult.failedEmbeddings === 0

    return (
        <Card className="p-4">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Collection Sync</h3>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleVerify}
                        disabled={verifying}
                    >
                        {verifying ? (
                            <>
                                <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            <>
                                <FiRefreshCw className="w-4 h-4 mr-2" />
                                Verify
                            </>
                        )}
                    </Button>
                </div>

                {verifyResult && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            {isHealthy ? (
                                <Badge variant="default" className="gap-1">
                                    <FiCheckCircle className="w-3 h-3" />
                                    Healthy
                                </Badge>
                            ) : (
                                <Badge variant="destructive" className="gap-1">
                                    <FiAlertTriangle className="w-3 h-3" />
                                    Issues Found
                                </Badge>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="p-2 bg-muted rounded">
                                <div className="text-muted-foreground text-xs">Total Chunks</div>
                                <div className="font-semibold">{verifyResult.totalChunks}</div>
                            </div>
                            <div className="p-2 bg-muted rounded">
                                <div className="text-muted-foreground text-xs">Missing</div>
                                <div className="font-semibold text-orange-600">
                                    {verifyResult.missingVectors}
                                </div>
                            </div>
                            <div className="p-2 bg-muted rounded">
                                <div className="text-muted-foreground text-xs">Failed</div>
                                <div className="font-semibold text-red-600">
                                    {verifyResult.failedEmbeddings}
                                </div>
                            </div>
                        </div>

                        {!isHealthy && (
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleSyncMissing}
                                    disabled={syncing || rebuilding}
                                    className="flex-1"
                                >
                                    {syncing ? (
                                        <>
                                            <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Syncing...
                                        </>
                                    ) : (
                                        'Sync Missing'
                                    )}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={handleRebuild}
                                    disabled={syncing || rebuilding}
                                    className="flex-1"
                                >
                                    {rebuilding ? (
                                        <>
                                            <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Rebuilding...
                                        </>
                                    ) : (
                                        'Rebuild All'
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                <div className="text-xs text-muted-foreground">
                    <p className="mb-1">Use this panel to:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Verify: Check collection health</li>
                        <li>Sync Missing: Fix missing/failed vectors</li>
                        <li>Rebuild All: Regenerate entire collection</li>
                    </ul>
                </div>
            </div>
        </Card>
    )
}
