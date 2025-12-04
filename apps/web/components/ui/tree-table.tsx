'use client'

import { useState } from 'react'
import { FiChevronRight, FiChevronDown } from 'react-icons/fi'
import { cn } from '@/lib/utils'
import type { TreeNode, TreeTableProps } from '@/lib/types'

export function TreeTable({ data, className }: TreeTableProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const renderNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0

    return (
      <div key={node.id}>
        <div
          className={cn(
            'flex items-center gap-3 py-3 px-4 border-b border-border/40 hover:bg-muted/30 transition-colors',
            level > 0 && 'bg-muted/10'
          )}
          style={{ paddingLeft: `${level * 2 + 1}rem` }}
        >
          {}
          {hasChildren ? (
            <button
              onClick={() => toggleNode(node.id)}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              {isExpanded ? (
                <FiChevronDown className="w-4 h-4" />
              ) : (
                <FiChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {}
          {node.icon && <div className="flex-shrink-0">{node.icon}</div>}

          {}
          <div className="flex-1 min-w-0">{node.label}</div>

          {}
          {node.badge && <div className="flex-shrink-0">{node.badge}</div>}

          {}
          {node.actions && <div className="flex-shrink-0 flex items-center gap-2">{node.actions}</div>}
        </div>

        {}
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('dashboard-card overflow-hidden', className)}>
      {data.map(node => renderNode(node))}
    </div>
  )
}
