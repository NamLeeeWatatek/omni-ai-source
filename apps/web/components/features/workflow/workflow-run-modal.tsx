import React, { useState } from 'react'
import { FiX, FiUpload, FiPlay, FiCheck, FiFile } from 'react-icons/fi'
import toast from '@/lib/toast'
import { Button } from '@/components/ui/button'

interface InputField {
    id: string
    label: string
    key: string
    type: 'text' | 'number' | 'boolean' | 'file'
    required: boolean
}

interface WorkflowRunModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: Record<string, any>) => void
    inputFields: InputField[]
    workflowName: string
}

export function WorkflowRunModal({ isOpen, onClose, onSubmit, inputFields, workflowName }: WorkflowRunModalProps) {
    const [formData, setFormData] = useState<Record<string, any>>({})
    const [uploading, setUploading] = useState<Record<string, boolean>>({})

    if (!isOpen) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Validate required fields
        const missing = inputFields.filter(f => f.required && (formData[f.key] === undefined || formData[f.key] === ''))
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

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('wataomi_token')}`
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
                            <div key={field.id}>
                                <label className="block text-sm font-medium mb-1.5">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>

                                {field.type === 'text' && (
                                    <input
                                        type="text"
                                        className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={formData[field.key] || ''}
                                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                                    />
                                )}

                                {field.type === 'number' && (
                                    <input
                                        type="number"
                                        className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        value={formData[field.key] || ''}
                                        onChange={e => setFormData({ ...formData, [field.key]: Number(e.target.value) })}
                                    />
                                )}

                                {field.type === 'boolean' && (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded border-border/40"
                                            checked={formData[field.key] || false}
                                            onChange={e => setFormData({ ...formData, [field.key]: e.target.checked })}
                                        />
                                        <span className="text-sm text-muted-foreground">Yes, enable this option</span>
                                    </label>
                                )}

                                {field.type === 'file' && (
                                    <div className="relative">
                                        <input
                                            type="file"
                                            className="hidden"
                                            id={`file-${field.id}`}
                                            onChange={e => e.target.files?.[0] && handleFileUpload(field.key, e.target.files[0])}
                                        />
                                        <label
                                            htmlFor={`file-${field.id}`}
                                            className={`flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${formData[field.key]
                                                    ? 'border-green-500/50 bg-green-500/5 text-green-500'
                                                    : 'border-border/40 hover:border-primary/40 hover:bg-muted/30'
                                                }`}
                                        >
                                            {uploading[field.key] ? (
                                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            ) : formData[field.key] ? (
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
                                        {formData[field.key] && (
                                            <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                                                <FiFile className="w-3 h-3" />
                                                <span className="truncate max-w-[200px]">{formData[field.key]}</span>
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
