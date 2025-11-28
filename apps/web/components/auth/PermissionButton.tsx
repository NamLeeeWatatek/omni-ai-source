/**
 * Permission Button Component
 * Button that's disabled/hidden based on permissions
 */
'use client'

import { ReactNode } from 'react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import type { ResourceType } from '@/lib/types/permissions'

interface PermissionButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  
  // Permission checks
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  
  // Resource checks
  resource?: ResourceType
  action?: 'create' | 'read' | 'update' | 'delete'
  
  // Behavior
  hideIfNoPermission?: boolean // Hide button instead of disabling
  disabledMessage?: string
  
  // Button props
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  variant?: 'default' | 'destructive' | 'outline' | 'ghost'
}

export function PermissionButton({
  children,
  onClick,
  className = '',
  permission,
  permissions,
  requireAll = false,
  resource,
  action,
  hideIfNoPermission = false,
  disabledMessage,
  disabled = false,
  type = 'button',
  variant = 'default',
}: PermissionButtonProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    isLoading,
  } = usePermissions()

  // Check permissions
  let hasAccess = true

  if (permission) {
    hasAccess = hasPermission(permission)
  }

  if (permissions) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
  }

  if (resource && action) {
    switch (action) {
      case 'create':
        hasAccess = canCreate(resource)
        break
      case 'read':
        hasAccess = canRead(resource)
        break
      case 'update':
        hasAccess = canUpdate(resource)
        break
      case 'delete':
        hasAccess = canDelete(resource)
        break
    }
  }

  // Hide if no permission and hideIfNoPermission is true
  if (!hasAccess && hideIfNoPermission) {
    return null
  }

  const isDisabled = disabled || !hasAccess || isLoading

  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      title={!hasAccess ? disabledMessage : undefined}
      className={`
        inline-flex items-center justify-center rounded-md text-sm font-medium
        transition-colors focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-ring focus-visible:ring-offset-2
        disabled:pointer-events-none disabled:opacity-50
        px-4 py-2
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  )
}
