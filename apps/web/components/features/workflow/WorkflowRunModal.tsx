import React, { useState } from 'react'
import { FiX, FiUpload, FiPlay, FiCheck, FiFile } from 'react-icons/fi'
import toast from '@/lib/toast'
import { Button } from '@/components/ui/Button'
import { LoadingLogo } from '@/components/ui/LoadingLogo'
import type { NodeProperty } from '@/lib/types/flow'

interface WorkflowRunModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: Record<string, any>) => void
    inputFields: NodeProperty[]
    workflowName: string
}

export function WorkflowRunModal({ isOpen, onClose, onSubmit, inputFields, workflowName }: WorkflowRunModalProps) {
    const [formData, setFormData] = useState<Record<string, any>>({})
    const [uploading, setUploading] = useState<Record<string, boolean>>({})

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const missing = inputFields.filter(f => f.required && (formData[f.name] === undefined || formData[f.name] === ''))
        if (missing.length > 0) {
            toast.error(`Please fill in required fields: ${missing.map(f => f.label).join(', ')}`)
            return
        }
        onSubmit(formData)
    }

    const handleFileUpload = async (key: string, file: File) => {
        if (!file) return

        try {
            setUploading(prev => ({ ...prev, [key]: true }))
            const formDataUpload = new FormData()
            formDataUpload.append('file', file)

            const endpoint = file.type.startsWith('image/') ? '/media/upload/image' : '/media/upload/file'

            const { getSession } = await import('next-auth/react')
            const session = await getSession()
            const token = session?.accessToken

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataUpload
            })

            if (!response.ok) throw new Error('Upload failed')

            const result = await response.json()

            setFormData(prev => ({ ...prev, [key]: result.secure_url }))
            toast.success('File uploaded!')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error'
            toast.error('Upload failed: ' + message)
        } finally {
            setUploading(prev => ({ ...prev, [key]: false }))
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background border border-border/40 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/30">
                    <h3 className="font-semibold truncate pr-4">Run {workflowName}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors shrink-0">
                        <FiX className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {inputFields.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                            This workflow has no input fields. Click Run to start.
                        </p>
                    ) : (
                        inputFields.map(field => (
                            <div key={field.name}>
                                <label className="block text-sm font-medium mb-1.5">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>

                                {(field.type === 'string' || field.type === 'text') && (
                                    <input
                                        type="text"
                                        className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={formData[field.name] || ''}
                                        onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
                                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                                        required={field.required}
                                    />
                                )}

                                {field.type === 'number' && (
                                    <input
                                        type="number"
                                        className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={formData[field.name] || ''}
                                        onChange={e => setFormData({ ...formData, [field.name]: Number(e.target.value) })}
                                        required={field.required}
                                    />
                                )}

                                {field.type === 'boolean' && (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded border-border/40"
                                            checked={formData[field.name] || false}
                                            onChange={e => setFormData({ ...formData, [field.name]: e.target.checked })}
                                        />
                                        <span className="text-sm text-muted-foreground">Yes, enable this option</span>
                                    </label>
                                )}

                                {(field.type === 'file' || field.type === 'files') && (
                                    <div className="relative">
                                        <input
                                            type="file"
                                            className="hidden"
                                            id={`file-${field.name}`}
                                            onChange={e => e.target.files?.[0] && handleFileUpload(field.name, e.target.files[0])}
                                            accept={field.accept}
                                        />
                                        <label
                                            htmlFor={`file-${field.name}`}
                                            className={`flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${formData[field.name]
                                                ? 'border-green-500/50 bg-green-500/5 text-green-500'
                                                : 'border-border/40 hover:border-primary/40 hover:bg-muted/30'
                                                }`}
                                        >
                                            {uploading[field.name] ? (
                                                <LoadingLogo size="xs" />
                                            ) : formData[field.name] ? (
                                                <>
                                                    <FiCheck className="w-4 h-4" />
                                                    <span className="text-sm font-medium">File Uploaded</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FiUpload className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Upload File</span>
                                                </>
                                            )}
                                        </label>
                                        {formData[field.name] && (
                                            <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                                                <FiFile className="w-3 h-3" />
                                                <span className="truncate max-w-[200px]">{formData[field.name]}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            <FiPlay className="w-4 h-4 mr-2" />
                            Run Workflow
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

