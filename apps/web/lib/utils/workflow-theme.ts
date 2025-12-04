/**
 * Workflow Theme Configuration
 * Centralized styling for workflow nodes and UI elements
 */

export const workflowTheme = {
  // Node styles
  node: {
    minWidth: '200px',
    borderRadius: '12px',
    padding: '16px',
    shadow: 'shadow-lg',
    
    // States
    default: {
      bg: 'bg-card',
      border: 'border-2 border-border/40',
      hover: 'hover:border-primary/50 hover:shadow-xl'
    },
    selected: {
      bg: 'bg-gradient-to-br from-primary/10 to-primary/5',
      border: 'border-2 border-primary ring-2 ring-primary/20'
    },
    executing: {
      bg: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5',
      border: 'border-2 border-blue-500 animate-pulse'
    },
    success: {
      bg: 'bg-gradient-to-br from-green-500/10 to-green-600/5',
      border: 'border-2 border-green-500'
    },
    error: {
      bg: 'bg-gradient-to-br from-red-500/10 to-red-600/5',
      border: 'border-2 border-red-500'
    }
  },

  // Icon styles
  icon: {
    size: 'w-10 h-10',
    borderRadius: 'rounded-lg',
    padding: 'p-2',
    getBgStyle: (color?: string) => ({
      backgroundColor: color ? `${color}15` : undefined,
      border: color ? `1.5px solid ${color}40` : undefined
    })
  },

  // Handle (connection point) styles
  handle: {
    size: 'w-3 h-3',
    bg: '!bg-primary',
    border: 'border-2 border-background',
    hover: 'hover:scale-125',
    transition: 'transition-transform'
  },

  // Status badge styles
  statusBadge: {
    size: 'w-7 h-7',
    borderRadius: 'rounded-full',
    position: 'absolute -top-2 -right-2 z-20',
    shadow: 'shadow-lg',
    
    running: {
      bg: 'bg-blue-500',
      ring: 'ring-2 ring-blue-500/20'
    },
    success: {
      bg: 'bg-green-500',
      ring: 'ring-2 ring-green-500/20'
    },
    error: {
      bg: 'bg-red-500',
      ring: 'ring-2 ring-red-500/20'
    }
  },

  // Category colors (matching backend)
  categories: {
    trigger: '#10b981',  // green
    ai: '#3b82f6',       // blue
    action: '#8b5cf6',   // purple
    logic: '#f59e0b',    // amber
    response: '#ec4899'  // pink
  }
}

/**
 * Get node class names based on state
 */
export function getNodeClassName(state: {
  selected?: boolean
  executionStatus?: 'idle' | 'running' | 'success' | 'error'
}): string {
  const { node } = workflowTheme
  const baseClasses = `relative ${node.borderRadius} ${node.shadow} transition-all duration-200 min-w-[${node.minWidth}]`
  
  if (state.executionStatus === 'running') {
    return `${baseClasses} ${node.executing.bg} ${node.executing.border}`
  }
  if (state.executionStatus === 'success') {
    return `${baseClasses} ${node.success.bg} ${node.success.border}`
  }
  if (state.executionStatus === 'error') {
    return `${baseClasses} ${node.error.bg} ${node.error.border}`
  }
  if (state.selected) {
    return `${baseClasses} ${node.selected.bg} ${node.selected.border}`
  }
  
  return `${baseClasses} ${node.default.bg} ${node.default.border} ${node.default.hover}`
}

/**
 * Get icon background style
 */
export function getIconStyle(color?: string) {
  return workflowTheme.icon.getBgStyle(color)
}

/**
 * Get category color
 */
export function getCategoryColor(category: string): string {
  return workflowTheme.categories[category as keyof typeof workflowTheme.categories] || '#6b7280'
}
