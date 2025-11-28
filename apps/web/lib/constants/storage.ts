/**
 * Storage Keys Constants
 * Centralized storage key definitions
 */

export const STORAGE_KEYS = {
  // Legacy keys (for cleanup only - DO NOT USE)
  LEGACY_TOKEN: 'auth_token',
  LEGACY_USER: 'auth_user',
  LEGACY_REFRESH_TOKEN: 'auth_refresh_token',
} as const

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]
