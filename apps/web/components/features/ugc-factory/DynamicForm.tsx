'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DynamicFormField } from '@/components/ui/DynamicFormField'
import toast from '@/lib/toast'

// Using the shared NodeProperty interface that matches backend
interface NodeProperty {
    name: string
    label: string
    type: 'string' | 'text' | 'number' | 'boolean' | 'select' | 'multi-select' | 'json' | 'file' | 'files' | 'key-value' | 'dynamic-form' | 'channel-select' | 'textarea'
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

interface DynamicFormProps {
    properties: NodeProperty[]
    formData: Record<string, any>
    onFormDataChange: (data: Record<string, any>) => void
    onSubmit: () => void
}

export function DynamicForm({
    properties,
    formData,
    onFormDataChange,
    onSubmit
}: DynamicFormProps) {
    console.log('DynamicForm render - properties:', properties)
    console.log('DynamicForm render - properties length:', properties.length)

    const handleFieldChange = (fieldId: string, value: any) => {
        console.log('Field change:', fieldId, value, typeof value)
        console.log('Current formData before update:', formData)
        const newFormData = {
            ...formData,
            [fieldId]: value
        }
        console.log('New formData after update:', newFormData)
        onFormDataChange(newFormData)
    }

    const validateForm = () => {
        const missingFields: string[] = []

        properties.forEach(field => {
            if (field.required) {
                const value = formData[field.name]

                // Check if field is empty/null/undefined
                if (value === null || value === undefined ||
                    (typeof value === 'string' && value.trim() === '') ||
                    (Array.isArray(value) && value.length === 0) ||
                    (typeof value === 'object' && Object.keys(value).length === 0)) {
                    missingFields.push(field.label)
                }
            }
        })

        return missingFields
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Form submit, calling onSubmit')

        // Validate form
        const missingFields = validateForm()

        if (missingFields.length > 0) {
            const fieldList = missingFields.join(', ')
            toast.error(`Vui lòng nhập các trường bắt buộc: ${fieldList}`)
            return
        }

        // All validation passed
        onSubmit()
    }

    if (properties.length === 0) {
        return (
            <Card className="p-6">
                <div className="text-center text-muted-foreground">
                    <div className="text-4xl mb-2">ðŸ“</div>
                    <p className="text-sm font-medium">No Form Fields</p>
                    <p className="text-xs mt-1">
                        This workflow doesn't have any configurable inputs.
                    </p>
                </div>
            </Card>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {properties.map((field) => {
                console.log('Rendering field:', field.name, field.type, field.label)
                return (
                    <DynamicFormField
                        key={field.name}
                        field={field}
                        value={formData[field.name]}
                        onChange={handleFieldChange}
                    />
                )
            })}

            <Button type="submit" className="w-full">
                Execute Flow
            </Button>
        </form>
    )
}
