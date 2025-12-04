'use client'

import { useState, useEffect } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import type { KeyValuePair, KeyValueEditorProps } from '@/lib/types'

export function KeyValueEditor({ value, onChange, placeholder }: KeyValueEditorProps) {
    const [pairs, setPairs] = useState<KeyValuePair[]>([])

    useEffect(() => {
        if (typeof value === 'object' && value !== null) {
            const entries = Object.entries(value).map(([key, val]) => ({
                key,
                value: typeof val === 'string' ? val : JSON.stringify(val)
            }))
            setPairs(entries.length > 0 ? entries : [{ key: '', value: '' }])
        } else {
            setPairs([{ key: '', value: '' }])
        }
    }, [])

    const emitChange = (newPairs: KeyValuePair[]) => {
        const obj: Record<string, any> = {}
        newPairs.forEach(pair => {
            if (pair.key.trim()) {
                try {
                    obj[pair.key] = JSON.parse(pair.value)
                } catch {
                    obj[pair.key] = pair.value
                }
            }
        })
        onChange(obj)
    }

    const addPair = () => {
        const newPairs = [...pairs, { key: '', value: '' }]
        setPairs(newPairs)
        emitChange(newPairs)
    }

    const removePair = (index: number) => {
        const newPairs = pairs.filter((_, i) => i !== index)
        setPairs(newPairs)
        emitChange(newPairs)
    }

    const updatePair = (index: number, field: 'key' | 'value', newValue: string) => {
        const newPairs = pairs.map((pair, i) =>
            i === index ? { ...pair, [field]: newValue } : pair
        )
        setPairs(newPairs)
        emitChange(newPairs)
    }

    return (
        <div className="space-y-2">
            {pairs.map((pair, index) => (
                <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={pair.key}
                            onChange={(e) => updatePair(index, 'key', e.target.value)}
                            placeholder={placeholder?.key || 'Key'}
                            className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        />
                    </div>
                    <div className="flex-1">
                        <input
                            type="text"
                            value={pair.value}
                            onChange={(e) => updatePair(index, 'value', e.target.value)}
                            placeholder={placeholder?.value || 'Value'}
                            className="w-full glass rounded-lg px-3 py-2 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => removePair(index)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-500"
                        disabled={pairs.length === 1}
                    >
                        <FiTrash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}

            <button
                type="button"
                onClick={addPair}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
                <FiPlus className="w-4 h-4" />
                Add Field
            </button>
        </div>
    )
}
