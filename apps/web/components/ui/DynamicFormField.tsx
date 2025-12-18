'use client'

import { useState, useEffect, memo } from 'react'
import { FiUpload, FiX, FiArrowRight } from 'react-icons/fi'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select'
import { Spinner } from './Spinner'
import { axiosClient } from '@/lib/axios-client'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger
} from './DropdownMenu'
import { FiChevronDown } from 'react-icons/fi'
import { Input } from './Input'
import { Textarea } from './Textarea'
import { Label } from './Label'
import { useFileUpload } from '@/lib/hooks/use-file-upload'
import { cn } from '@/lib/utils'
import { KeyValueEditor } from '../features/workflow/KeyValueEditor'

// NodeProperty type from backend - this should match the backend definition
interface NodeProperty {
    name: string
    label: string
    type: 'string' | 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'multi-select' | 'json' | 'file' | 'files' | 'key-value' | 'dynamic-form' | 'channel-select'
    required?: boolean
    placeholder?: string
    description?: string
    options?: Array<{ value: string; label: string } | string> | string
    default?: any
    showWhen?: Record<string, any>
    min?: number
    max?: number
    step?: number
    pattern?: string
    maxLength?: number
    rows?: number
    accept?: string
    multiple?: boolean
    properties?: NodeProperty[]
}

interface DynamicFormFieldProps {
    field: NodeProperty
    value: any
    onChange: (key: string, value: any) => void
    allValues?: Record<string, any>
    className?: string
}

export const DynamicFormField = memo(function DynamicFormField({
    field,
    value,
    onChange,
    allValues = {},
    className
}: DynamicFormFieldProps) {
    const [jsonError, setJsonError] = useState<string | null>(null)
    const [dynamicOptions, setDynamicOptions] = useState<any[]>([])
    const [loadingOptions, setLoadingOptions] = useState(false)
    const [optionsConfig, setOptionsConfig] = useState<string>('')
    const [previewFiles, setPreviewFiles] = useState<any[]>([])

    const { uploadFile, uploadMultipleFiles, uploading: uploadLoading, error: uploadHookError } = useFileUpload({
        bucket: 'images',
        onProgress: (progress) => {
            // Could add progress tracking here if needed
        },
        onSuccess: (fileUrl, fileData) => {
            // Handle successful upload
        },
    })

    const resizeImage = (file: File, maxWidth = 1200): Promise<File> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')!
            const img = new Image()
            img.onload = () => {
                const ratio = Math.min(1, maxWidth / img.width)
                canvas.width = img.width * ratio
                canvas.height = img.height * ratio
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                canvas.toBlob((blob) => {
                    const resizedFile = new File([blob!], file.name, { type: file.type })
                    resolve(resizedFile)
                }, file.type)
            }
            img.src = URL.createObjectURL(file)
        })
    }

    if (field.showWhen) {
        const conditionMet = Object.entries(field.showWhen).every(
            ([key, val]) => allValues[key] === val
        )
        if (!conditionMet) return null
    }

    const currentValue = value !== undefined ? value : field.default
    console.log('📋 DynamicFormField for', field.name, 'currentValue:', currentValue, 'value prop:', value, 'default:', field.default)

    const fieldId = `field-${field.name}`

    useEffect(() => {
        const options = field.options
        if (typeof options === 'string' && (options as string).startsWith('dynamic:')) {
            loadDynamicOptions(options as string)
        } else if (field.type === 'channel-select') {
            loadDynamicOptions('dynamic:channels')
        }
    }, [field.name])

    useEffect(() => {
        return () => {
            previewFiles.forEach(p => URL.revokeObjectURL(p.url))
        }
    }, [previewFiles])



    const loadDynamicOptions = async (optionsStr: string) => {
        const optionsConfig = optionsStr.replace('dynamic:', '')
        setOptionsConfig(optionsConfig)

        try {
            setLoadingOptions(true)

            if (optionsConfig.startsWith('ai-models:')) {
                const typeFilter = optionsConfig.split(':')[1]
                // Call the correct dynamic options endpoint
                const data = await axiosClient.get(`/node-types/dynamic-options/ai-models?type=${typeFilter}`)
                setDynamicOptions(data)
            }
            else if (optionsConfig === 'channels') {
                // Call the correct dynamic options endpoint
                const data = await axiosClient.get('/node-types/dynamic-options/channels')
                setDynamicOptions(data)
            }
        } catch (error) {
            console.warn('Failed to load dynamic options:', error)
            // Set empty array on error to prevent UI issues
            setDynamicOptions([])
        } finally {
            setLoadingOptions(false)
        }
    }

    const handleFileDelete = async (fileId: string) => {
        try {
            await axiosClient.delete(`/files/${fileId}`)
        } catch (error) {
            console.error('Delete error:', error)
            throw error
        }
    }

    const handleFileUpload = async (files: FileList) => {
        console.log('🔄 handleFileUpload called with files:', files);
        if (!files || files.length === 0) {
            console.error('❌ No files provided to handleFileUpload');
            return;
        }

        if (field.multiple) {
            const filesArray = Array.from(files)
            console.log('📁 Processing multiple files:', filesArray.length);
            const processedFiles = await Promise.all(filesArray.map(file =>
                file.type.startsWith('image/') ? resizeImage(file) : Promise.resolve(file)
            ))

            try {
                const uploadedFiles = await uploadMultipleFiles(processedFiles)
                console.log('✅ Multiple upload result:', uploadedFiles);

                const formattedFiles = uploadedFiles.map((uploadResult, index) => ({
                    url: uploadResult?.fileUrl || '',
                    fileId: uploadResult?.fileData?.id || '',
                    fileKey: uploadResult?.fileData?.path || '',
                    name: filesArray[index]?.name || `file_${index}`
                }))

                onChange(field.name, formattedFiles)
                setPreviewFiles([])
            } catch (error) {
                console.error('❌ Multiple upload failed:', error)
            }
        } else {
            console.log('📄 Processing single file:', files[0]);
            if (!files[0]) {
                console.error('❌ files[0] is undefined');
                return;
            }

            let processedFile = files[0]

            // Resize image if necessary
            if (processedFile.type.startsWith('image/')) {
                processedFile = await resizeImage(processedFile)
            }

            try {
                const uploadResult = await uploadFile(processedFile)
                console.log('✅ Single upload result:', uploadResult);

                const formattedFile = {
                    url: uploadResult?.fileUrl || '',
                    fileId: uploadResult?.fileData?.id || '',
                    fileKey: uploadResult?.fileData?.path || '',
                    name: files[0]?.name || 'unknown_file'
                }

                console.log('📦 Formatted file object:', formattedFile);
                onChange(field.name, formattedFile)
                setPreviewFiles([])
            } catch (error) {
                console.error('❌ Single upload failed:', error)
            }
        }
    }

    const renderField = () => {
        switch (field.type) {
            case 'string':
                return (
                    <Input
                        type="text"
                        value={currentValue || ''}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        maxLength={field.maxLength}
                        pattern={field.pattern}
                        className="glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                )

            case 'text':
                return (
                    <Textarea
                        value={currentValue || ''}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        className="glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        rows={field.rows || 4}
                        placeholder={field.placeholder}
                        required={field.required}
                    />
                )

            case 'textarea':
                return (
                    <Textarea
                        value={currentValue || ''}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        className="glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        rows={field.rows || 6}
                        placeholder={field.placeholder}
                        required={field.required}
                    />
                )

            case 'json':
                return (
                    <div>
                        <Textarea
                            value={typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue, null, 2)}
                            onChange={(e) => {
                                const val = e.target.value
                                try {
                                    const parsed = JSON.parse(val)
                                    onChange(field.name, parsed)
                                    setJsonError(null)
                                } catch (err) {
                                    onChange(field.name, val)
                                    setJsonError('Invalid JSON format')
                                }
                            }}
                            className={cn(
                                "w-full glass rounded-lg px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-xs",
                                jsonError ? 'border-red-500' : 'border-border/40'
                            )}
                            rows={6}
                            placeholder='{"key": "value"}'
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
                            typeof field.placeholder === 'object' ? field.placeholder : undefined
                        }
                    />
                )

            case 'select':
            case 'channel-select':
                const options = (field.type === 'channel-select' || (typeof field.options === 'string' && field.options.startsWith('dynamic:')))
                    ? dynamicOptions
                    : (field.options as any[]) || []

                const selectValue = currentValue ? String(currentValue) : undefined

                let placeholder = "Select an option..."
                if (loadingOptions) {
                    if (optionsConfig?.startsWith('ai-models:')) {
                        placeholder = "Loading AI models..."
                    } else if (optionsConfig === 'channels') {
                        placeholder = "Loading channels..."
                    } else {
                        placeholder = "Loading options..."
                    }
                } else {
                    if (field.type === 'channel-select') {
                        placeholder = "Select a channel..."
                    } else if (optionsConfig?.startsWith('ai-models:')) {
                        placeholder = "Select an AI model..."
                    }
                }

                return (
                    <div className="space-y-2">
                        <Select
                            value={selectValue}
                            onValueChange={(value) => onChange(field.name, value)}
                            disabled={loadingOptions}
                        >
                            <SelectTrigger className="w-full glass border-border/40">
                                <SelectValue placeholder={placeholder} />
                            </SelectTrigger>
                            <SelectContent>
                                {options.length === 0 && !loadingOptions && (
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                        {field.type === 'channel-select' ? 'No channels connected' : 'No options available'}
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

                        {field.type === 'channel-select' && options.length === 0 && !loadingOptions && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                                    No channels connected yet. Connect a channel first to send messages.
                                </p>
                                <a
                                    href="/channels"
                                    target="_blank"
                                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                >
                                    Go to Channels <FiArrowRight className="w-3 h-3" />
                                </a>
                            </div>
                        )}
                    </div>
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
                    <Input
                        type="number"
                        value={currentValue ?? field.default ?? ''}
                        onChange={(e) => onChange(field.name, e.target.value ? Number(e.target.value) : null)}
                        placeholder={field.placeholder}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        required={field.required}
                        className="glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                )

            case 'file':
            case 'files':
                const isMultiple = field.type === 'files' || field.multiple

                return (
                    <div className="space-y-2">
                        <div className="relative">
                            <input
                                type="file"
                                id={`file-${field.name}`}
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        const filesArray = Array.from(e.target.files)
                                        // Create previews
                                        const previews = filesArray.map(file => ({
                                            url: URL.createObjectURL(file),
                                            name: file.name,
                                            isPreview: true
                                        }))
                                        if (field.multiple) {
                                            setPreviewFiles(previews)
                                        } else {
                                            setPreviewFiles([previews[0]])
                                        }
                                        handleFileUpload(e.target.files)
                                        // Reset input so user can upload the same file again
                                        e.target.value = ''
                                    }
                                }}
                                className="hidden"
                                accept={field.accept}
                                multiple={isMultiple}
                                disabled={uploadLoading}
                            />
                            <label
                                htmlFor={`file-${field.name}`}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                                    uploadLoading
                                        ? 'border-gray-400 bg-gray-50 cursor-not-allowed'
                                        : 'border-border/40 hover:border-primary/50 hover:bg-muted/20'
                                )}
                            >
                                {uploadLoading ? (
                                    <div className="flex flex-col items-center">
                                        <Spinner className="w-8 h-8 mb-2" />
                                        <span className="text-sm text-muted-foreground">Uploading...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-center">
                                        <FiUpload className="w-8 h-8 text-muted-foreground mb-2" />
                                        <span className="text-sm text-muted-foreground">Click to upload or drag and drop</span>
                                    </div>
                                )}
                            </label>
                        </div>

                        {uploadHookError && (
                            <p className="text-xs text-red-500">{uploadHookError.message}</p>
                        )}

                        {(previewFiles.length > 0 || currentValue) && (() => {
                            const filesToShow = previewFiles.length > 0 ? previewFiles : currentValue
                            const canDelete = previewFiles.length === 0
                            console.log(`Rendering field ${field.name} with value:`, filesToShow)
                            return (
                                <div className="space-y-2">
                                    {Array.isArray(filesToShow) ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            {filesToShow.map((item: any, idx: number) => {
                                                const fileObj = typeof item === 'object' && item.url ? item : { url: item, fileId: null, fileKey: null }
                                                const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileObj.url)
                                                return (
                                                    <div key={idx} className="relative group">
                                                        {isImage ? (
                                                            <div className="relative aspect-square rounded-lg overflow-hidden border border-border/40 bg-muted/20">
                                                                <img
                                                                    src={fileObj.url}
                                                                    alt={`Upload ${idx + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        const target = e.currentTarget;
                                                                        target.style.display = 'none';
                                                                        const parent = target.parentElement;
                                                                        if (parent) {
                                                                            const fileName = fileObj.url ? fileObj.url.split('/').pop() || 'File' : 'File';
                                                                            parent.innerHTML = `<div class="flex items-center justify-center h-full text-xs text-muted-foreground p-2 break-all">${fileName}</div>`;
                                                                        }
                                                                    }}
                                                                />
                                                                {canDelete && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={async () => {
                                                                            if (fileObj.fileId) {
                                                                                try {
                                                                                    await handleFileDelete(fileObj.fileId)
                                                                                } catch (error) {
                                                                                    console.error('Failed to delete file:', error)
                                                                                }
                                                                            }
                                                                            const newFiles = filesToShow.filter((_: any, i: number) => i !== idx)
                                                                            onChange(field.name, newFiles.length > 0 ? newFiles : null)
                                                                        }}
                                                                        className="absolute top-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                                    >
                                                                        <FiX className="w-3 h-3 text-white" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border/40">
                                                                <span className="text-xs flex-1 truncate" title={fileObj.url}>
                                                                    {fileObj.name || fileObj.url.split('/').pop() || 'Unnamed file'}
                                                                </span>
                                                                {canDelete && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={async () => {
                                                                            if (fileObj.fileId) {
                                                                                try {
                                                                                    await handleFileDelete(fileObj.fileId)
                                                                                } catch (error) {
                                                                                    console.error('Failed to delete file:', error)
                                                                                }
                                                                            }
                                                                            const newFiles = filesToShow.filter((_: any, i: number) => i !== idx)
                                                                            onChange(field.name, newFiles.length > 0 ? newFiles : null)
                                                                        }}
                                                                        className="p-1 hover:bg-red-500/10 rounded"
                                                                    >
                                                                        <FiX className="w-4 h-4 text-red-500" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (() => {
                                        const fileObj = typeof filesToShow === 'object' && filesToShow.url
                                            ? filesToShow
                                            : { url: filesToShow, fileId: null, fileKey: null }
                                        const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileObj.url)
                                        return isImage ? (
                                            <div className="relative group">
                                                <div className="relative w-full rounded-lg overflow-hidden border border-border/40 bg-muted/20">
                                                <img
                                                    src={fileObj.url}
                                                    alt="Uploaded image"
                                                    className="w-full h-auto max-h-64 object-contain"
                                                    onLoad={() => console.log('✅ Image loaded successfully:', fileObj.url)}
                                                    onError={(e) => {
                                                        console.error('❌ Image failed to load:', fileObj.url, e);
                                                        const target = e.currentTarget;
                                                        target.style.display = 'none';
                                                        const parent = target.parentElement;
                                                        if (parent) {
                                                            const fileName = fileObj.url ? fileObj.url.split('/').pop() || 'File' : 'File';
                                                            parent.innerHTML = `<div class="flex items-center justify-center p-4 text-xs text-muted-foreground break-all">${fileName}</div>`;
                                                        }
                                                    }}
                                                />
                                                {canDelete && (
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            if (fileObj.fileId) {
                                                                try {
                                                                    await handleFileDelete(fileObj.fileId)
                                                                } catch (error) {
                                                                    console.error('Failed to delete file:', error)
                                                                }
                                                            }
                                                            onChange(field.name, null)
                                                        }}
                                                        className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                    >
                                                        <FiX className="w-4 h-4 text-white" />
                                                    </button>
                                                )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 truncate">{fileObj.name || fileObj.url.split('/').pop() || 'Image'}</p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border/40">
                                                <span className="text-xs flex-1 truncate" title={fileObj.url}>
                                                    {fileObj.name || fileObj.url.split('/').pop() || 'Unnamed file'}
                                                </span>
                                                {canDelete && (
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            if (fileObj.fileId) {
                                                                try {
                                                                    await handleFileDelete(fileObj.fileId)
                                                                } catch (error) {
                                                                    console.error('Failed to delete file:', error)
                                                                }
                                                            }
                                                            onChange(field.name, null)
                                                        }}
                                                        className="p-1 hover:bg-red-500/10 rounded"
                                                    >
                                                        <FiX className="w-4 h-4 text-red-500" />
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    })()}
                                </div>
                            )
                        })()}
                    </div>
                )

            case 'multi-select':
                const multiOptions = typeof field.options === 'string' && field.options.startsWith('dynamic:')
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

break;

            default:
                return (
                    <div className="text-sm text-muted-foreground">
                        Unsupported field type: {field.type}
                    </div>
                )
        }
    }

    return (
        <div className={cn('mb-4', className)}>
            <Label htmlFor={fieldId} className="block text-sm font-medium mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {renderField()}
            {field.description && (
                <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
            )}
        </div>
    )
})
