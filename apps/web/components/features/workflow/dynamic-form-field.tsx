'use client'

import { useState, useEffect, memo } from 'react'
import { KeyValueEditor } from './key-value-editor'
import { FiUpload, FiX } from 'react-icons/fi'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchAPI } from '@/lib/api'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { FiChevronDown } from 'react-icons/fi'

interface FormFieldProps {
    field: {
        name: string
        label: string
        type: string
        required?: boolean
        placeholder?: string | { key?: string; value?: string }
        description?: string
        default?: any
        options?: Array<{ value: string; label: string } | string>
        showWhen?: Record<string, any>
        accept?: string // For file upload
        multiple?: boolean // For multiple file upload
    }
    value: any
    onChange: (key: string, value: any) => void
    allValues?: Record<string, any>
}

export const DynamicFormField = memo(function DynamicFormField({ field, value, onChange, allValues = {} }: FormFieldProps) {
    const [jsonError, setJsonError] = useState<string | null>(null)
    const [uploadingFiles, setUploadingFiles] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [dynamicOptions, setDynamicOptions] = useState<any[]>([])
    const [loadingOptions, setLoadingOptions] = useState(false)

    // Check showWhen condition
    if (field.showWhen) {
        const conditionMet = Object.entries(field.showWhen).every(
            ([key, val]) => allValues[key] === val
        )
        if (!conditionMet) return null
    }

    const currentValue = value !== undefined ? value : field.default

    // Load dynamic options if needed
    useEffect(() => {
        const options = field.options
        if (typeof options === 'string' && (options as string).startsWith('dynamic:')) {
            loadDynamicOptions()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [field.name]) // Only reload when field name changes, not options

    const loadDynamicOptions = async () => {
        const options = field.options
        if (typeof options !== 'string') return

        const optionsConfig = (options as string).replace('dynamic:', '')

        try {
            setLoadingOptions(true)

            // Handle ai-models:provider format
            if (optionsConfig.startsWith('ai-models:')) {
                const provider = optionsConfig.split(':')[1]
                const data = await fetchAPI('/ai/models')
                const providerData = data.find((p: any) => p.provider === provider)

                if (providerData) {
                    const options = providerData.models
                        .filter((m: any) => m.is_available)
                        .map((m: any) => ({
                            value: m.model_name,
                            label: m.display_name
                        }))
                    setDynamicOptions(options)
                }
            }
            // Handle channels format
            else if (optionsConfig === 'channels') {
                const data = await fetchAPI('/channels/')
                const options = data.map((c: any) => ({
                    value: c.id.toString(),
                    label: c.name
                }))
                setDynamicOptions(options)
            }
        } catch (error) {
            console.error('Failed to load dynamic options:', error)
        } finally {
            setLoadingOptions(false)
        }
    }

    // Handle file upload to Cloudinary
    const handleFileUpload = async (files: FileList) => {
        setUploadingFiles(true)
        setUploadError(null)

        try {
            const uploadedUrls: string[] = []

            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const formData = new FormData()
                formData.append('file', file)

                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
                
                // Get token from NextAuth session
                const { getSession } = await import('next-auth/react')
                const session = await getSession()
                const token = session?.accessToken

                const response = await fetch(`${API_URL}/media/upload/file`, {
                    method: 'POST',
                    headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: formData
                })

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    throw new Error(errorData.detail || 'Upload failed')
                }

                const data = await response.json()
                uploadedUrls.push(data.url)
            }

            // If multiple files, return array; otherwise return single URL
            if (field.multiple) {
                onChange(field.name, uploadedUrls)
            } else {
                onChange(field.name, uploadedUrls[0])
            }
        } catch (error) {
            console.error('File upload error:', error)
            setUploadError(error instanceof Error ? error.message : 'Upload failed')
        } finally {
            setUploadingFiles(false)
        }
    }


    const renderField = () => {
        switch (field.type) {
            case 'text':
            case 'url':
                return (
                    <input
                        type={field.type}
                        value={currentValue || ''}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder={typeof field.placeholder === 'string' ? field.placeholder : undefined}
                        required={field.required}
                    />
                )

            case 'textarea':
                return (
                    <textarea
                        value={currentValue || ''}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        rows={4}
                        placeholder={typeof field.placeholder === 'string' ? field.placeholder : undefined}
                        required={field.required}
                    />
                )

            case 'json':
                return (
                    <div>
                        <textarea
                            value={typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue, null, 2)}
                            onChange={(e) => {
                                const val = e.target.value
                                try {
                                    // Try to parse as JSON
                                    const parsed = JSON.parse(val)
                                    onChange(field.name, parsed)
                                    setJsonError(null)
                                } catch (err) {
                                    // If not valid JSON, store as string
                                    onChange(field.name, val)
                                    setJsonError('Invalid JSON format')
                                }
                            }}
                            className={`w-full glass rounded-lg px-3 py-2 border ${jsonError ? 'border-red-500' : 'border-border/40'
                                } focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-xs`}
                            rows={6}
                            placeholder={typeof field.placeholder === 'string' ? field.placeholder : '{\n  "key": "value"\n}'}
                            required={field.required}
                        />
                        {jsonError && (
                            <p className="text-xs text-red-500 mt-1">{jsonError}</p>
                        )}
                    </div>
                )

            case 'key-value':
                return (
                    <KeyValueEditor
                        value={currentValue || {}}
                        onChange={(value) => onChange(field.name, value)}
                        placeholder={
                            field.placeholder ?
                                (typeof field.placeholder === 'object' ? field.placeholder : undefined) :
                                undefined
                        }
                    />
                )

            case 'select':
                const options = typeof field.options === 'string' && (field.options as string).startsWith('dynamic:')
                    ? dynamicOptions
                    : (field.options as any[]) || []

                // Ensure value is a string and exists in options
                const selectValue = currentValue ? String(currentValue) : undefined

                return (
                    <Select
                        value={selectValue}
                        onValueChange={(value) => onChange(field.name, value)}
                        disabled={loadingOptions}
                    >
                        <SelectTrigger className="w-full glass border-border/40">
                            <SelectValue placeholder={loadingOptions ? "Loading..." : "Select..."} />
                        </SelectTrigger>
                        <SelectContent>
                            {options.length === 0 && !loadingOptions && (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    No options available
                                </div>
                            )}
                            {options.map((opt: any) => {
                                const optValue = typeof opt === 'string' ? opt : opt.value
                                const optLabel = typeof opt === 'string' ? opt : opt.label
                                return (
                                    <SelectItem key={optValue} value={String(optValue)}>
                                        {optLabel}
                                    </SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>
                )

            case 'boolean':
                return (
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={currentValue || false}
                            onChange={(e) => onChange(field.name, e.target.checked)}
                            className="rounded"
                        />
                        <span className="text-sm">{field.label}</span>
                    </label>
                )

            case 'number':
                return (
                    <input
                        type="number"
                        value={currentValue || ''}
                        onChange={(e) => onChange(field.name, parseFloat(e.target.value))}
                        className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder={typeof field.placeholder === 'string' ? field.placeholder : undefined}
                        required={field.required}
                    />
                )

            case 'file':
                return (
                    <div className="space-y-2">
                        <div className="relative">
                            <input
                                type="file"
                                id={`file-${field.name}`}
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        handleFileUpload(e.target.files)
                                    }
                                }}
                                className="hidden"
                                accept={field.accept || 'image/*,video/*'}
                                multiple={field.multiple}
                                disabled={uploadingFiles}
                            />
                            <label
                                htmlFor={`file-${field.name}`}
                                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploadingFiles
                                    ? 'border-gray-400 bg-gray-50 cursor-not-allowed'
                                    : 'border-border/40 hover:border-primary/50 hover:bg-muted/20'
                                    }`}
                            >
                                {uploadingFiles ? (
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-2" />
                                        <span className="text-sm text-muted-foreground">Uploading...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <FiUpload className="w-8 h-8 text-muted-foreground mb-2" />
                                        <span className="text-sm text-muted-foreground">
                                            Click to upload {field.multiple ? 'files' : 'a file'}
                                        </span>
                                        <span className="text-xs text-muted-foreground mt-1">
                                            {field.accept || 'Images and videos'}
                                        </span>
                                    </div>
                                )}
                            </label>
                        </div>

                        {/* Display uploaded files with image preview */}
                        {currentValue && (
                            <div className="space-y-2">
                                {Array.isArray(currentValue) ? (
                                    // Multiple files - show grid of previews
                                    <div className="grid grid-cols-2 gap-2">
                                        {currentValue.map((url, idx) => {
                                            const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)
                                            return (
                                                <div key={idx} className="relative group">
                                                    {isImage ? (
                                                        <div className="relative aspect-square rounded-lg overflow-hidden border border-border/40 bg-muted/20">
                                                            <img
                                                                src={url}
                                                                alt={`Upload ${idx + 1}`}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    // Fallback if image fails to load
                                                                    e.currentTarget.style.display = 'none'
                                                                    e.currentTarget.parentElement!.innerHTML = `<div class="flex items-center justify-center h-full text-xs text-muted-foreground p-2 break-all">${url}</div>`
                                                                }}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newUrls = currentValue.filter((_: any, i: number) => i !== idx)
                                                                    onChange(field.name, newUrls.length > 0 ? newUrls : null)
                                                                }}
                                                                className="absolute top-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                            >
                                                                <FiX className="w-3 h-3 text-white" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border/40">
                                                            <span className="text-xs flex-1 truncate">{url}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newUrls = currentValue.filter((_: any, i: number) => i !== idx)
                                                                    onChange(field.name, newUrls.length > 0 ? newUrls : null)
                                                                }}
                                                                className="p-1 hover:bg-red-500/10 rounded"
                                                            >
                                                                <FiX className="w-4 h-4 text-red-500" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    // Single file - show larger preview
                                    (() => {
                                        const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(currentValue)
                                        return isImage ? (
                                            <div className="relative group">
                                                <div className="relative w-full rounded-lg overflow-hidden border border-border/40 bg-muted/20">
                                                    <img
                                                        src={currentValue}
                                                        alt="Uploaded image"
                                                        className="w-full h-auto max-h-64 object-contain"
                                                        onError={(e) => {
                                                            // Fallback if image fails to load
                                                            e.currentTarget.style.display = 'none'
                                                            e.currentTarget.parentElement!.innerHTML = `<div class="flex items-center justify-center p-4 text-xs text-muted-foreground break-all">${currentValue}</div>`
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => onChange(field.name, null)}
                                                        className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                    >
                                                        <FiX className="w-4 h-4 text-white" />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 truncate">{currentValue}</p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border/40">
                                                <span className="text-xs flex-1 truncate">{currentValue}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => onChange(field.name, null)}
                                                    className="p-1 hover:bg-red-500/10 rounded"
                                                >
                                                    <FiX className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        )
                                    })()
                                )}
                            </div>
                        )}

                        {/* Display upload error */}
                        {uploadError && (
                            <p className="text-xs text-red-500">{uploadError}</p>
                        )}
                    </div>
                )

            case 'multi-select':
                const multiOptions = typeof field.options === 'string' && (field.options as string).startsWith('dynamic:')
                    ? dynamicOptions
                    : (field.options as any[]) || []

                const selectedValues = Array.isArray(currentValue) ? currentValue : []

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="w-full flex items-center justify-between glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm text-left">
                                <span className={selectedValues.length === 0 ? "text-muted-foreground" : ""}>
                                    {selectedValues.length === 0
                                        ? "Select options..."
                                        : `${selectedValues.length} selected`}
                                </span>
                                <FiChevronDown className="w-4 h-4 opacity-50" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
                            {multiOptions.length === 0 && !loadingOptions && (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    No options available
                                </div>
                            )}
                            {multiOptions.map((opt: any) => {
                                const optValue = typeof opt === 'string' ? opt : opt.value
                                const optLabel = typeof opt === 'string' ? opt : opt.label
                                const isChecked = selectedValues.includes(String(optValue))

                                return (
                                    <DropdownMenuCheckboxItem
                                        key={optValue}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                            let newValues
                                            if (checked) {
                                                newValues = [...selectedValues, String(optValue)]
                                            } else {
                                                newValues = selectedValues.filter((v: string) => v !== String(optValue))
                                            }
                                            onChange(field.name, newValues)
                                        }}
                                    >
                                        {optLabel}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )

            default:
                return (
                    <div className="text-sm text-muted-foreground">
                        Unsupported field type: {field.type}
                    </div>
                )
        }
    }

    // For boolean type, render differently (no separate label)
    if (field.type === 'boolean') {
        return (
            <div key={field.name} className="mb-4">
                {renderField()}
                {field.description && (
                    <p className="text-xs text-muted-foreground mt-1 ml-6">{field.description}</p>
                )}
            </div>
        )
    }

    return (
        <div key={field.name} className="mb-4">
            <label className="block text-sm font-medium mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField()}
            {field.description && (
                <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
            )}
        </div>
    )
})
