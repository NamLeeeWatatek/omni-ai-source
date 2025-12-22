'use client'

import React from 'react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger
} from '@/components/ui/DropdownMenu'
import { Label } from '@/components/ui/Label'
import { Spinner } from '@/components/ui/Spinner'
import { FiChevronDown } from 'react-icons/fi'
import { cn } from '@/lib/utils'
import axiosClient from '@/lib/axios-client'
import { useFileUpload } from '@/lib/hooks/use-file-upload'
import { KeyValueEditor } from '../workflow/KeyValueEditor'
import { useState, useEffect } from 'react'

interface FormField {
    id: string
    name?: string
    type: 'text' | 'url' | 'textarea' | 'json' | 'select' | 'boolean' | 'switch' | 'number' | 'file' | 'files' | 'image' | 'key-value' | 'multi-select' | 'dynamic-form' | 'channel-select' | 'ai-model-select'
    label: string
    displayName?: string
    description?: string
    helpText?: string
    hint?: string
    placeholder?: string
    required?: boolean
    defaultValue?: any
    options?: Array<{ value: string; label: string }>
    accept?: string
    multiple?: boolean
    min?: number
    max?: number
}

interface DynamicFormFieldProps {
    field: FormField
    value: any
    onChange: (value: any) => void
    className?: string
}



export function DynamicInput({
    field,
    value,
    onChange,
    className,
}: DynamicFormFieldProps) {
    const fieldId = `field-${field.id}`
    const [jsonError, setJsonError] = useState<string | null>(null)

    // File upload hook
    const { uploadFile, uploadMultipleFiles, uploading: fileUploading } = useFileUpload({
        bucket: 'images',
        onSuccess: (fileUrl) => {
            // File uploaded successfully, update value with URL (single file)
            onChange(fileUrl)
        },
    })

    const handleSingleFileChange = async (files: File[]) => {
        if (files.length > 0) {
            try {
                const result = await uploadFile(files[0])
                // onSuccess callback will handle setting the value
            } catch (error) {
                console.error('File upload failed:', error)
                // You might want to show an error toast here
            }
        }
    }

    const handleMultipleFileChange = async (files: File[]) => {
        if (files.length > 0) {
            try {
                const results = await uploadMultipleFiles(files)
                // Set array of URLs as value
                const urls = results.map(r => r.fileUrl)
                onChange(urls)
            } catch (error) {
                console.error('Multiple file upload failed:', error)
                // You might want to show an error toast here
            }
        }
    }

    // Text Input
    if (field.type === 'text') {
        return (
            <Input
                id={fieldId}
                value={value !== undefined ? value : field.defaultValue ?? ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className={className}
            />
        )
    }

    // Textarea
    if (field.type === 'textarea') {
        return (
            <Textarea
                id={fieldId}
                value={value !== undefined ? value : field.defaultValue ?? ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                rows={4}
                className={className}
            />
        )
    }

    // Select Dropdown
    if (field.type === 'select') {
        return (
            <Select
                value={value || field.defaultValue}
                onValueChange={onChange}
            >
                <SelectTrigger id={fieldId} className={className}>
                    <SelectValue placeholder={field.placeholder || 'Select...'} />
                </SelectTrigger>
                <SelectContent>
                    {(Array.isArray(field.options) ? field.options.map((opt) =>
                        typeof opt === 'string' ? { value: opt, label: opt }
                            : typeof opt === 'object' ? opt
                                : { value: String(opt), label: String(opt) }
                    ) : [])?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        )
    }

    // Number Input
    if (field.type === 'number') {
        return (
            <Input
                id={fieldId}
                type="number"
                value={value ?? field.defaultValue ?? ''}
                onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                required={field.required}
                className={className}
            />
        )
    }

    // Image Upload
    if (field.type === 'image') {
        return (
            <div className={cn("space-y-2", className)}>
                <Input
                    id={fieldId}
                    type="file"
                    onChange={(e) => {
                        const files = e.target.files
                        if (files && files.length > 0) {
                            if (field.multiple) {
                                handleMultipleFileChange(Array.from(files))
                            } else {
                                handleSingleFileChange(Array.from(files))
                            }
                        }
                    }}
                    accept={field.accept || 'image/*'}
                    multiple={field.multiple}
                    required={field.required && !value}
                    disabled={fileUploading}
                />
                {fileUploading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Spinner className="w-4 h-4" />
                        Uploading image...
                    </div>
                )}
                {value && ((typeof value === 'string') || (Array.isArray(value) && value.length > 0)) && !fileUploading && (
                    <div className="text-xs text-green-600">
                        {field.multiple ? `${Array.isArray(value) ? value.length : 0} images` : 'Image'} uploaded successfully
                    </div>
                )}
            </div>
        )
    }

    // Switch/Toggle
    if (field.type === 'switch') {
        return (
            <div className={cn("flex items-center space-x-2", className)}>
                <Switch
                    id={fieldId}
                    checked={value ?? field.defaultValue ?? false}
                    onCheckedChange={onChange}
                />
                <Label
                    htmlFor={fieldId}
                    className="text-sm font-normal cursor-pointer"
                >
                    {field.placeholder || 'Enable'}
                </Label>
            </div>
        )
    }

    // File Upload (Single)
    if (field.type === 'file') {
        return (
            <div className={cn("space-y-2", className)}>
                <Input
                    id={fieldId}
                    type="file"
                    onChange={(e) => {
                        const files = e.target.files
                        if (files && files.length > 0) {
                            handleSingleFileChange(Array.from(files))
                        }
                    }}
                    accept={field.accept}
                    multiple={false}
                    required={field.required && !value}
                    disabled={fileUploading}
                />
                {fileUploading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Spinner className="w-4 h-4" />
                        Uploading file...
                    </div>
                )}
                {value && typeof value === 'string' && !fileUploading && (
                    <div className="text-xs text-green-600">
                        File uploaded successfully
                    </div>
                )}
            </div>
        )
    }

    // Files Upload (Multiple)
    if (field.type === 'files') {
        return (
            <div className={cn("space-y-2", className)}>
                <Input
                    id={fieldId}
                    type="file"
                    onChange={(e) => {
                        const files = e.target.files
                        if (files && files.length > 0) {
                            handleMultipleFileChange(Array.from(files))
                        }
                    }}
                    accept={field.accept}
                    multiple={true}
                    required={field.required && (!value || (Array.isArray(value) && value.length === 0))}
                    disabled={fileUploading}
                />
                {fileUploading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Spinner className="w-4 h-4" />
                        Uploading files...
                    </div>
                )}
                {value && Array.isArray(value) && value.length > 0 && !fileUploading && (
                    <div className="text-xs text-green-600">
                        {value.length} files uploaded successfully
                    </div>
                )}
            </div>
        )
    }

    // Multi-Select
    if (field.type === 'multi-select') {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        id={fieldId}
                        className={cn(
                            "w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                            className
                        )}
                    >
                        <span className={Array.isArray(value) && value.length > 0 ? "" : "text-muted-foreground"}>
                            {Array.isArray(value) && value.length > 0
                                ? `${value.length} selected`
                                : (field.placeholder || "Select options...")}
                        </span>
                        <FiChevronDown className="w-4 h-4 opacity-50" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full min-w-[200px] max-h-60 overflow-y-auto">
                    {field.options?.length === 0 && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            No options available
                        </div>
                    )}
                    {(Array.isArray(field.options) ? field.options.map((opt) =>
                        typeof opt === 'string' ? { value: opt, label: opt }
                            : typeof opt === 'object' ? opt
                                : { value: String(opt), label: String(opt) }
                    ) : [])?.map((option) => {
                        const isChecked = Array.isArray(value) && value.includes(option.value)

                        return (
                            <DropdownMenuCheckboxItem
                                key={option.value}
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                    const currentValues = Array.isArray(value) ? [...value] : []
                                    if (checked) {
                                        onChange([...currentValues, option.value])
                                    } else {
                                        onChange(currentValues.filter((v: string) => v !== option.value))
                                    }
                                }}
                            >
                                {option.label}
                            </DropdownMenuCheckboxItem>
                        )
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    // Channel Select
    if (field.type === 'channel-select') {
        return (
            <ChannelSelector
                value={value}
                onChange={onChange}
                multiple={field.multiple}
                required={field.required}
            />
        )
    }

    // AI Model Select
    if (field.type === 'ai-model-select') {
        return (
            <AIModelSelector
                value={value}
                onChange={onChange}
                required={field.required}
            />
        )
    }



    // JSON Input
    if (field.type === 'json') {
        return (
            <div>
                <Textarea
                    id={fieldId}
                    value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                    onChange={(e) => {
                        const val = e.target.value
                        try {
                            const parsed = JSON.parse(val)
                            // If valid JSON, propagate parsed object
                            onChange(parsed)
                            setJsonError(null)
                        } catch (err) {
                            // If invalid, propagate string but show error
                            // Note: We might want to NOT propagate invalid JSON if parent expects object
                            // checking react-hook-form behavior: it stores what we pass.
                            onChange(val)
                            setJsonError('Invalid JSON format')
                        }
                    }}
                    className={cn(
                        "font-mono text-xs",
                        jsonError ? 'border-red-500' : '',
                        className
                    )}
                    rows={8}
                    placeholder='{"key": "value"}'
                    required={field.required}
                />
                {jsonError && (
                    <p className="text-xs text-destructive mt-1">{jsonError}</p>
                )}
            </div>
        )
    }

    // Key-Value Editor
    if (field.type === 'key-value') {
        return (
            <KeyValueEditor
                value={value || {}}
                onChange={onChange}
                placeholder={typeof field.placeholder === 'object' ? field.placeholder : undefined}
            />
        )
    }

    return null
}

export function DynamicFormField({
    field,
    value,
    onChange,
    className,
}: DynamicFormFieldProps) {
    const fieldId = `field-${field.id}`

    return (
        <div className={cn('space-y-2', className)}>
            <Label htmlFor={fieldId} className="block text-sm font-medium mb-1">
                {field.displayName || field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>

            {field.hint && (
                <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-semibold mb-1.5">{field.hint}</p>
            )}

            <DynamicInput
                field={field}
                value={value}
                onChange={onChange}
            />

            {(field.helpText || field.description) && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {field.helpText || field.description}
                </p>
            )}
        </div>
    )
}

// Channel Selector Component - loads channels from API
function ChannelSelector({
    value,
    onChange,
    multiple = false,
    required = false
}: {
    value: any
    onChange: (value: any) => void
    multiple?: boolean
    required?: boolean
}) {
    const [channels, setChannels] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        loadChannels()
    }, [])

    const loadChannels = async () => {
        try {
            setLoading(true)
            console.log('[ChannelSelector] Loading channels...')
            // Use axiosClient with auth - should include JWT token
            const data = await axiosClient.get('/channels')
            console.log('[ChannelSelector] Channels loaded:', data)
            console.log('[ChannelSelector] Data type:', typeof data, Array.isArray(data) ? 'array' : 'not array')

            // Ensure we have the expected channel structure
            const channelList = Array.isArray(data) ? data : []
            console.log('[ChannelSelector] Channel count:', channelList.length)

            setChannels(channelList)
        } catch (error: any) {
            console.error('[ChannelSelector] Failed to load channels:', error)
            console.error('[ChannelSelector] Error details:', error?.response?.status, error?.response?.data)
            setChannels([])

            // If 401 or auth related error, user needs to login
            if (error?.response?.status === 401) {
                console.warn('[ChannelSelector] Auth required for loading channels')
            }
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="text-sm text-muted-foreground">Loading channels...</div>
    }

    if (multiple) {
        return (
            <div className="space-y-2 border rounded-lg p-3">
                {channels.map((channel) => {
                    const isChecked = Array.isArray(value) && value.includes(channel.id)

                    return (
                        <div key={channel.id} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id={`channel-${channel.id}`}
                                checked={isChecked}
                                onChange={(e) => {
                                    const currentValues = Array.isArray(value) ? [...value] : []
                                    if (e.target.checked) {
                                        onChange([...currentValues, channel.id])
                                    } else {
                                        onChange(currentValues.filter((v) => v !== channel.id))
                                    }
                                }}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <label
                                htmlFor={`channel-${channel.id}`}
                                className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                            >
                                {channel.name}
                            </label>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
                <SelectValue placeholder="Select a channel..." />
            </SelectTrigger>
            <SelectContent>
                {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                        <div className="flex items-center gap-2">
                            {channel.name}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

// AI Model Selector Component - loads AI models from API
function AIModelSelector({
    value,
    onChange,
    required = false
}: {
    value: any
    onChange: (value: any) => void
    required?: boolean
}) {
    const [models, setModels] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        loadModels()
    }, [])

    const loadModels = async () => {
        try {
            setLoading(true)
            console.log('[AIModelSelector] Loading AI models...')
            // Try user models first, fallback to available providers
            const data = await axiosClient.get('/ai-providers/user/models')
            console.log('[AIModelSelector] Models loaded:', data)

            // Flatten models from all providers
            const allModels: any[] = []
            if (Array.isArray(data)) {
                data.forEach((provider: any) => {
                    if (provider.models && Array.isArray(provider.models)) {
                        provider.models.forEach((model: string) => {
                            allModels.push({
                                value: `${provider.providerKey}/${model}`,
                                label: `${provider.providerName} - ${model}`,
                                provider: provider.providerKey,
                                model: model
                            })
                        })
                    }
                })
            }

            console.log('[AIModelSelector] Flattened models:', allModels)
            setModels(allModels)
        } catch (error: any) {
            console.error('[AIModelSelector] Failed to load models:', error)
            console.error('[AIModelSelector] Error details:', error?.response?.status, error?.response?.data)
            setModels([])

            // If 401 or auth related error, user needs to login
            if (error?.response?.status === 401) {
                console.warn('[AIModelSelector] Auth required for loading models')
            }
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="text-sm text-muted-foreground">Loading AI models...</div>
    }

    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
                <SelectValue placeholder="Select an AI model..." />
            </SelectTrigger>
            <SelectContent>
                {models.length === 0 ? (
                    <SelectItem value="" disabled>
                        No models available - configure AI providers first
                    </SelectItem>
                ) : (
                    models.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{model.label}</span>
                            </div>
                        </SelectItem>
                    ))
                )}
            </SelectContent>
        </Select>
    )
}
