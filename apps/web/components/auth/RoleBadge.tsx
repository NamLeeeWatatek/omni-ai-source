/**
 * Role Badge Component
 * Displays user role with appropriate styling
 */
'use client'

import { usePermissions } from '@/lib/hooks/usePermissions'
import type { Role } from '@/lib/types/permissions'

interface RoleBadgeProps {
  role?: Role
  className?: string
}

const roleColors: Record<Role, string> = {
  super_admin: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  admin: 'bg-red-500/20 text-red-500 border-red-500/30',
  manager: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  editor: 'bg-green-500/20 text-green-500 border-green-500/30',
  viewer: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  user: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
}

const roleLabels: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  editor: 'Editor',
  viewer: 'Viewer',
  user: 'User',
}

export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  const { capabilities } = usePermissions()
  const userRole = role || capabilities?.role || 'user'
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColors[userRole]} ${className}`}
    >
      {roleLabels[userRole]}
    </span>
  )
}
