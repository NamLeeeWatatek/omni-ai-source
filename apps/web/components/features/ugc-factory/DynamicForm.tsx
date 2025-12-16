'use client'

import React, { useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DynamicInput } from './DynamicFormField'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/Form'
import { Loader2 } from 'lucide-react'

// Using the shared NodeProperty interface that matches backend
export interface NodeProperty {
    name: string
    label: string
    type: 'string' | 'text' | 'number' | 'boolean' | 'select' | 'multi-select' | 'json' | 'file' | 'files' | 'key-value' | 'dynamic-form' | 'channel-select' | 'textarea' | 'switch' | 'image'
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
    submitLabel?: string
    loading?: boolean
}

// Helper to generate Zod schema from properties
const generateSchema = (properties: NodeProperty[]) => {
    const shape: Record<string, z.ZodTypeAny> = {}

    properties.forEach((prop) => {
        let validator: z.ZodTypeAny

        switch (prop.type) {
            case 'number':
                validator = z.coerce.number()
                if (prop.step && prop.step % 1 !== 0) {
                    // Float support if needed, z.coerce.number handles floats but we can refine
                }
                if (prop.min !== undefined) validator = (validator as z.ZodNumber).min(prop.min, `Min value is ${prop.min}`)
                if (prop.max !== undefined) validator = (validator as z.ZodNumber).max(prop.max, `Max value is ${prop.max}`)
                break
            case 'boolean':
            case 'switch':
                validator = z.boolean()
                break
            case 'files':
            case 'multi-select':
                validator = z.array(z.string()).optional()
                break
            case 'json':
            case 'key-value':
                validator = z.any() // JSON/Object validation can be stricter if needed
                break
            default:
                // string, text, select, etc.
                validator = z.string()
                if (prop.type === 'string' || prop.type === 'text' || prop.type === 'textarea') {
                    // For pure strings.
                }
                break
        }

        if (prop.required) {
            if (prop.type === 'number') {
                // z.coerce.number() allows empty string -> 0 or NaN. 
                // We might want to ensure it's not empty if required.
                // Actually z.coerce.number() on empty string is 0. 
                // If we want to strictly require a value, we might need a refined check or use z.union([z.number(), z.string()]) and transform.
                // Simple approach: required numbers usually default to 0 is okay, or use .refine
            } else if (prop.type === 'string' || prop.type === 'text' || prop.type === 'textarea') {
                validator = (validator as z.ZodString).min(1, `${prop.label} is required`)
            } else if (prop.type === 'boolean' || prop.type === 'switch') {
                // Boolean required usually means it must be present, but false is a valid value.
                // So z.boolean() is fine.
            } else {
                // For arrays/objects
                // validator = validator.refine(val => val !== null && val !== undefined, "Required")
            }
        } else {
            validator = validator.optional()
            if (prop.type === 'string' || prop.type === 'text' || prop.type === 'textarea') {
                validator = (validator as z.ZodString).or(z.literal(''))
            }
            if (prop.type === 'number') {
                // Allow empty string for optional numbers? z.coerce converts '' to 0. 
                // If we want actual undefined/null for optional numbers:
                validator = z.union([z.number(), z.literal('')]).transform(val => val === '' ? undefined : val).optional()
            }
        }

        shape[prop.name] = validator
    })

    return z.object(shape)
}

export function DynamicForm({
    properties,
    formData,
    onFormDataChange,
    onSubmit,
    submitLabel = "Execute Flow",
    loading = false
}: DynamicFormProps) {
    // Generate schema on properties change
    const schema = useMemo(() => generateSchema(properties), [properties])

    // Initialize form
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: formData,
        mode: 'onBlur' // Validate on blur for better UX, not on every keystroke
    })

    // Sync form changes to parent - use ref to prevent infinite loops
    const isUpdatingFromParent = React.useRef(false)

    useEffect(() => {
        const subscription = form.watch((value, { name, type }) => {
            // Skip if we're in the middle of a parent update to prevent loops
            if (isUpdatingFromParent.current) return

            onFormDataChange(value as Record<string, any>)
        })
        return () => subscription.unsubscribe()
    }, [form, onFormDataChange])

    // Update form values if formData prop changes externally
    useEffect(() => {
        isUpdatingFromParent.current = true
        form.reset(formData, { keepDirty: false, keepTouched: false })
        // Reset flag after a short delay to allow form update to complete
        setTimeout(() => {
            isUpdatingFromParent.current = false
        }, 0)
    }, [formData, form])


    const handleSubmit = (values: any) => {
        console.log('Form submitted with values:', values)
        onFormDataChange(values) // Ensure parent has latest
        onSubmit()
    }

    if (properties.length === 0) {
        return (
            <Card className="p-6">
                <div className="text-center text-muted-foreground">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-sm font-medium">No Form Fields</p>
                    <p className="text-xs mt-1">
                        This workflow doesn't have any configurable inputs.
                    </p>
                    <div className="mt-4">
                        <Button onClick={onSubmit} className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Execute Anyway
                        </Button>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" noValidate>
                {properties.map((prop) => (
                    <FormField
                        key={prop.name}
                        control={form.control}
                        name={prop.name}
                        render={({ field }) => (
                            <FormItem>
                                {prop.type !== 'boolean' && prop.type !== 'switch' && (
                                    <FormLabel>
                                        {prop.label}
                                        {prop.required && <span className="text-destructive ml-1">*</span>}
                                    </FormLabel>
                                )}
                                <FormControl>
                                    <DynamicInput
                                        // Map NodeProperty to DynamicFormField's Field interface
                                        // We map 'string' -> 'text' locally
                                        field={{
                                            id: prop.name,
                                            label: prop.label,
                                            // @ts-ignore - Mapping types
                                            type: prop.type === 'string' ? 'text' : prop.type,
                                            placeholder: prop.placeholder,
                                            description: prop.description,
                                            required: prop.required,
                                            defaultValue: prop.default,
                                            options: prop.options as any,
                                            accept: prop.accept,
                                            multiple: prop.multiple,
                                            min: prop.min,
                                            max: prop.max
                                        }}
                                        value={field.value}
                                        onChange={field.onChange}
                                    // Pass className if needed
                                    />
                                </FormControl>
                                {prop.description && <FormDescription>{prop.description}</FormDescription>}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ))}

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {submitLabel}
                </Button>
            </form>
        </Form>
    )
}
