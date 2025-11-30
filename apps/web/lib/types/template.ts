/**
 * Template related type definitions
 */

export interface Template {
  id: string
  name: string
  description: string
  category: string
  icon: string
  template_data?: any
  usage_count: number
}

export interface TemplateSelectorProps {
  onSelect: (templateData: any) => void
  onClose: () => void
}
