import React from 'react'
import { Button } from './Button'
import { Card } from './Card'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary'
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = ''
}: EmptyStateProps) {
  return (
    <Card className={`p-8 text-center ${className}`}>
      {icon && (
        <div className="flex justify-center mb-4">
          <div className="text-muted-foreground opacity-60">
            {icon}
          </div>
        </div>
      )}

      <h3 className="text-lg font-semibold mb-2 text-foreground">
        {title}
      </h3>

      {description && (
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}

      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
        >
          {action.label}
        </Button>
      )}
    </Card>
  )
}

// Specialized empty states for common use cases
export function NoDataEmptyState({
  title = "Không có dữ liệu",
  description = "Chưa có dữ liệu nào được tạo.",
  onCreate,
  createLabel = "Tạo mới",
  icon
}: {
  title?: string
  description?: string
  onCreate?: () => void
  createLabel?: string
  icon?: React.ReactNode
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={onCreate ? {
        label: createLabel,
        onClick: onCreate
      } : undefined}
    />
  )
}

export function NoResultsEmptyState({
  title = "Không tìm thấy kết quả",
  description = "Không có kết quả nào phù hợp với tìm kiếm của bạn.",
  onClear,
  clearLabel = "Xóa bộ lọc",
  icon
}: {
  title?: string
  description?: string
  onClear?: () => void
  clearLabel?: string
  icon?: React.ReactNode
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={onClear ? {
        label: clearLabel,
        onClick: onClear,
        variant: 'outline'
      } : undefined}
    />
  )
}

export function ErrorEmptyState({
  title = "Đã xảy ra lỗi",
  description = "Không thể tải dữ liệu. Vui lòng thử lại.",
  onRetry,
  retryLabel = "Thử lại",
  icon
}: {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
  icon?: React.ReactNode
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={onRetry ? {
        label: retryLabel,
        onClick: onRetry,
        variant: 'outline'
      } : undefined}
    />
  )
}
