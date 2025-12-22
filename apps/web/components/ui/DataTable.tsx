'use client'

import * as React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  SortAsc,
  SortDesc
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./Button"
import { Pagination, type PaginationInfo } from "./Pagination"
import { Input } from "./Input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select"
import { LoadingLogo } from "./LoadingLogo"

// Basic Table Components
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

// Types for DataTable
export type SortDirection = 'asc' | 'desc' | null

export interface Column<T = any> {
  key: string
  label: string
  sortable?: boolean
  searchable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  width?: string | number
  className?: string
}


export interface DataTableProps<T = any> {
  // Data từ Redux
  data: T[]
  loading?: boolean
  error?: string | null

  // Columns
  columns: Column<T>[]

  // Search
  searchable?: boolean
  searchPlaceholder?: string
  searchValue?: string
  onSearch?: (value: string) => void

  // Sorting
  sortable?: boolean
  sortColumn?: string
  sortDirection?: SortDirection
  onSort?: (column: string, direction: SortDirection) => void

  // Pagination
  pagination?: PaginationInfo
  pageSizeOptions?: number[]
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void

  // Actions
  actions?: React.ReactNode
  onRowClick?: (row: T) => void

  // Empty state
  emptyMessage?: string
  emptyComponent?: React.ReactNode

  // Styling
  className?: string
  tableClassName?: string
  compact?: boolean
}

export function DataTable<T = any>({
  data,
  loading = false,
  error = null,

  columns,
  searchable = true,
  searchPlaceholder = "Search...",
  searchValue = '',
  onSearch,

  sortable = true,
  sortColumn = '',
  sortDirection = null,
  onSort,

  pagination,
  pageSizeOptions = [5, 10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,

  actions,
  onRowClick,

  emptyMessage = "No data available",
  emptyComponent,

  className,
  tableClassName,
  compact = false
}: DataTableProps<T>) {
  const [localSearchValue, setLocalSearchValue] = React.useState(searchValue)

  // Sync local search with prop
  React.useEffect(() => {
    setLocalSearchValue(searchValue)
  }, [searchValue])

  const handleSearchChange = (value: string) => {
    setLocalSearchValue(value)
    onSearch?.(value)
  }

  const handleSort = (key: string, columnSortable: boolean) => {
    if (!sortable || !columnSortable) return

    let newDirection: SortDirection = 'asc'
    if (sortColumn === key) {
      if (sortDirection === 'asc') {
        newDirection = 'desc'
      } else if (sortDirection === 'desc') {
        newDirection = null
      }
    }

    onSort?.(key, newDirection)
  }

  const getSortIcon = (key: string) => {
    if (sortColumn !== key || !sortDirection) {
      return <SortAsc className="h-4 w-4 opacity-20" />
    }
    return sortDirection === 'asc' ? (
      <SortAsc className="h-4 w-4" />
    ) : (
      <SortDesc className="h-4 w-4" />
    )
  }

  const handlePageChange = (page: number) => {
    if (pagination && page >= 1 && page <= pagination.totalPages) {
      onPageChange?.(page)
    }
  }

  const handlePageSizeChange = (pageSize: number) => {
    onPageSizeChange?.(pageSize)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with search and actions */}
      {(searchable || actions) && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={localSearchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Table */}
      <div className={cn("rounded-md border", tableClassName)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "select-none",
                    (sortable && column.sortable !== false) && "cursor-pointer hover:text-foreground",
                    column.width && `w-[${column.width}]`,
                    column.className
                  )}
                  onClick={() => handleSort(column.key, column.sortable !== false)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {(sortable && column.sortable !== false) && getSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <td colSpan={columns.length} className="h-24 text-center">
                  <LoadingLogo size="sm" text="Loading data..." />
                </td>
              </TableRow>
            ) : error ? (
              <TableRow>
                <td colSpan={columns.length} className="h-24 text-center text-destructive">
                  {error}
                </td>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyComponent || emptyMessage}
                </td>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={(row as any)?.id || index}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(column.className)}
                    >
                      {column.render
                        ? column.render((row as any)[column.key], row)
                        : (row as any)[column.key]
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <Pagination
          pagination={pagination}
          pageSizeOptions={pageSizeOptions}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          className="mt-4"
        />
      )}
    </div>
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
