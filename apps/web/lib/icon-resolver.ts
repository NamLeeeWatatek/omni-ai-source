/**
 * Icon Resolver - Resolves icon names to React components
 * This avoids storing React components in Redux state (which can't be serialized)
 */
import * as FiIcons from 'react-icons/fi'
import * as SiIcons from 'react-icons/si'
import * as MdIcons from 'react-icons/md'

const iconMap: Record<string, any> = {
  ...FiIcons,
  ...SiIcons,
  ...MdIcons
}

/**
 * Resolve icon name to React component
 * @param iconName - Icon component name (e.g. "FiZap", "SiWhatsapp")
 * @returns React icon component or fallback
 */
export function resolveIcon(iconName: string | undefined): any {
  if (!iconName) return FiIcons.FiCircle
  
  // Direct lookup
  const Icon = iconMap[iconName]
  if (Icon) return Icon
  
  // Fallback
  return FiIcons.FiCircle
}

/**
 * Get icon component from node type
 * Handles both icon component (legacy) and icon name (new)
 */
export function getNodeIcon(nodeType: any): any {
  // If icon is already a component (legacy)
  if (nodeType?.icon && typeof nodeType.icon === 'function') {
    return nodeType.icon
  }
  
  // If icon is a string name (new approach)
  if (nodeType?.icon && typeof nodeType.icon === 'string') {
    return resolveIcon(nodeType.icon)
  }
  
  // If iconName field exists
  if (nodeType?.iconName) {
    return resolveIcon(nodeType.iconName)
  }
  
  // Fallback
  return FiIcons.FiCircle
}
