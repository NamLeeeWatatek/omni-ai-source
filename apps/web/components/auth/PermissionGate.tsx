/**
 * Permission Gate Component
 * Conditionally renders children based on permissions
 */
'use client'

import { ReactNode } from 'react'
import { usePermissions } from '@/lib/hooks/usePermissions'
import type { ResourceType } from '@/lib/types/permissions'

interface PermissionGateProps {
  children: ReactNode
  fallback?: ReactNode
  
  // Permission checks
  permission?: string
  permissions?: string[]
  requireAll?: boolean // If true, requires all permissions. If false, requires any
  
  // Resource checks
  resource?: ResourceType
  action?: 'create' | 'read' | 'update' | 'delete'
  
  // Widget checks
  widget?: string
  
  // Feature checks
  feature?: string
  
  // Role checks
  requireAdmin?: boolean
  requireSuperAdmin?: boolean
  
  // Loading state
  showLoadingFallback?: boolean
}

export function PermissionGate({
  children,
  fallback = null,
  permission,
  permissions,
  requireAll = false,
  resource,
  action,
  widget,
  feature,
  requireAdmin,
  requireSuperAdmin,
  showLoadingFallback = false,
}: PermissionGateProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canAccessWidget,
    canAccessFeature,
    isAdmin,
    isSuperAdmin,
    isLoading,
    capabilities,
  } = usePermissions()

  // Show loading fallback if requested
  if (isLoading && showLoadingFallback) {
    return <>{fallback}</>
  }

  // Wait for capabilities to load
  if (isLoading || !capabilities) {
    return null
  }

  // Check super admin requirement
  if (requireSuperAdmin && !isSuperAdmin()) {
    return <>{fallback}</>
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin()) {
    return <>{fallback}</>
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>
  }

  // Check multiple permissions
  if (permissions) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
    
    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  // Check resource action
  if (resource && action) {
    let hasAccess = false
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
    
    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  // Check widget access
  if (widget && !canAccessWidget(widget as any)) {
    return <>{fallback}</>
  }

  // Check feature access
  if (feature && !canAccessFeature(feature as any)) {
    return <>{fallback}</>
  }

  // All checks passed
  return <>{children}</>
}

// Convenience components
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate requireAdmin fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

export function SuperAdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate requireSuperAdmin fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

export function CanCreate({ resource, children, fallback }: { resource: ResourceType; children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate resource={resource} action="create" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

export function CanUpdate({ resource, children, fallback }: { resource: ResourceType; children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate resource={resource} action="update" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}

export function CanDelete({ resource, children, fallback }: { resource: ResourceType; children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGate resource={resource} action="delete" fallback={fallback}>
      {children}
    </PermissionGate>
  )
}
