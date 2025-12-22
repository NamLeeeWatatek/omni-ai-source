/**
 * Helper functions for workspace member role mapping
 * Maps between workspace role strings ('owner' | 'admin' | 'member') and role IDs
 */

// Workspace member role IDs (these should match the role table)
export const WORKSPACE_ROLE_IDS = {
  owner: 4,
  admin: 1, // Same as user admin
  member: 3,
} as const;

/**
 * Get role ID from workspace role string
 */
export function getWorkspaceRoleId(role: 'owner' | 'admin' | 'member'): number {
  return WORKSPACE_ROLE_IDS[role];
}

/**
 * Get workspace role string from role entity name or ID
 */
export function getWorkspaceRoleFromEntity(
  roleEntity: { id?: number; name?: string } | null | undefined,
): 'owner' | 'admin' | 'member' | null {
  if (!roleEntity) return null;

  // Check by ID first
  if (roleEntity.id) {
    if (roleEntity.id === WORKSPACE_ROLE_IDS.owner) return 'owner';
    if (roleEntity.id === WORKSPACE_ROLE_IDS.admin) return 'admin';
    if (roleEntity.id === WORKSPACE_ROLE_IDS.member) return 'member';
  }

  // Check by name as fallback
  const name = roleEntity.name?.toLowerCase();
  if (name === 'owner') return 'owner';
  if (name === 'admin') return 'admin';
  if (name === 'member') return 'member';

  return null;
}
