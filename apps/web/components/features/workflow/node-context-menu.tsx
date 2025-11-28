'use client'

import { useEffect, useRef } from 'react'
import { FiPlay, FiEdit, FiCopy, FiTrash2 } from 'react-icons/fi'

interface NodeContextMenuProps {
    x: number
    y: number
    onTest: () => void
    onEdit: () => void
    onDuplicate: () => void
    onDelete: () => void
    onClose: () => void
    canTest: boolean
}

export function NodeContextMenu({
    x,
    y,
    onTest,
    onEdit,
    onDuplicate,
    onDelete,
    onClose,
    canTest
}: NodeContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose()
            }
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [onClose])

    const menuItems = [
        {
            icon: FiPlay,
            label: 'Test Node',
            onClick: onTest,
            disabled: !canTest,
            className: 'text-primary'
        },
        {
            icon: FiEdit,
            label: 'Edit Properties',
            onClick: onEdit,
            disabled: false,
            className: ''
        },
        {
            icon: FiCopy,
            label: 'Duplicate',
            onClick: onDuplicate,
            disabled: false,
            className: ''
        },
        {
            icon: FiTrash2,
            label: 'Delete',
            onClick: onDelete,
            disabled: false,
            className: 'text-red-500 hover:bg-red-500/10'
        }
    ]

    return (
        <div
            ref={menuRef}
            className="fixed z-50 glass rounded-lg border border-border/40 shadow-xl py-1 min-w-[180px]"
            style={{
                left: `${x}px`,
                top: `${y}px`
            }}
        >
            {menuItems.map((item, index) => (
                <button
                    key={index}
                    onClick={() => {
                        if (!item.disabled) {
                            item.onClick()
                            onClose()
                        }
                    }}
                    disabled={item.disabled}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                        item.disabled
                            ? 'opacity-50 cursor-not-allowed'
                            : `hover:bg-accent ${item.className}`
                    }`}
                >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                </button>
            ))}
        </div>
    )
}
