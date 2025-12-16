'use client'

import * as React from "react"
import {
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Search,
  MoreVertical,
  SortAsc,
  SortDesc
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./Button"
import { Input } from "./Input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./DropdownMenu"

// Basic Table Components (unchanged)
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

// Advanced DataTable Components
type SortDirection = 'asc' | 'desc' | null

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
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string

  // Sorting
  sortable?: boolean
  initialSort?: { key: string; direction: SortDirection }

  // Searching
  searchable?: boolean
  searchPlaceholder?: string

  // Pagination
  paginated?: boolean
  pageSize?: number
  pageSizeOptions?: number[]
  initialPage?: number

  // Actions
  actions?: React.ReactNode
  onRowClick?: (row: T) => void

  // Styling
  className?: string
  tableClassName?: string
  compact?: boolean
}

export function DataTable<T = any>({
  data,
  columns,
  loading = false,
  emptyMessage = "No data available",

  sortable = true,
  initialSort,

  searchable = true,
  searchPlaceholder = "Search...",

  paginated = true,
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50, 100],
  initialPage = 1,

  actions,
  onRowClick,

  className,
  tableClassName,
  compact = false
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [sortConfig, setSortConfig] = React.useState<{
    key: string
    direction: SortDirection
  }>({
    key: initialSort?.key || '',
    direction: initialSort?.direction || null
  })
  const [currentPage, setCurrentPage] = React.useState(initialPage)
  const [currentPageSize, setCurrentPageSize] = React.useState(pageSize)

  // Filter searchable columns
  const searchableColumns = columns.filter(col => col.searchable !== false)

  // Filter and sort data
  const filteredAndSortedData = React.useMemo(() => {
    let filtered = data

    // Apply search
    if (searchTerm && searchableColumns.length > 0) {
      filtered = data.filter(row =>
        searchableColumns.some(col => {
          const value = (row as any)[col.key]
          return String(value).toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    }

    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = (a as any)[sortConfig.key]
        const bVal = (b as any)[sortConfig.key]

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [data, searchTerm, sortConfig, searchableColumns])

  // Paginate data
  const paginatedData = React.useMemo(() => {
    if (!paginated) return filteredAndSortedData

    const startIndex = (currentPage - 1) * currentPageSize
    const endIndex = startIndex + currentPageSize
    return filteredAndSortedData.slice(startIndex, endIndex)
  }, [filteredAndSortedData, currentPage, currentPageSize, paginated])

  const totalPages = Math.ceil(filteredAndSortedData.length / currentPageSize)

  // Reset to first page when data changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [data, searchTerm, sortConfig])

  const handleSort = (key: string, sortable: boolean) => {
    if (!sortable) return

    setSortConfig(prev => {
      if (prev.key === key) {
        // Toggle direction
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : prev.direction === 'desc' ? null : 'asc'
        }
      } else {
        // New column, sort ascending
        return { key, direction: 'asc' }
      }
    })
  }

  const getSortIcon = (key: string, direction: SortDirection) => {
    if (sortConfig.key !== key || !direction) {
      return <SortAsc className="h-4 w-4 opacity-20" />
    }
    return direction === 'asc' ? (
      <SortAsc className="h-4 w-4" />
    ) : (
      <SortDesc className="h-4 w-4" />
    )
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                    column.sortable && "cursor-pointer hover:text-foreground",
                    column.width && `w-[${column.width}]`,
                    column.className
                  )}
                  onClick={() => handleSort(column.key, !!column.sortable)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {(sortable && column.sortable !== false) && getSortIcon(column.key, sortConfig.key === column.key ? sortConfig.direction : null)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <td colSpan={columns.length} className="h-24 text-center">
                  Loading...
                </td>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {filteredAndSortedData.length === 0 && data.length > 0
                    ? "No results found"
                    : emptyMessage}
                </td>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow
                  key={index}
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
      {paginated && filteredAndSortedData.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * currentPageSize + 1} to{' '}
              {Math.min(currentPage * currentPageSize, filteredAndSortedData.length)} of{' '}
              {filteredAndSortedData.length} results
            </p>
            {pageSizeOptions.length > 1 && (
              <>
                <span className="text-sm text-muted-foreground">•</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select
                    value={String(currentPageSize)}
                    onValueChange={(value) => {
                      setCurrentPageSize(Number(value))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-16">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pageSizeOptions.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronUp className="h-4 w-4 rotate-90" />
              </Button>

              <div className="flex items-center gap-2 px-2">
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// DataTable wrapper for easier API
export const DataTableWrapper = DataTable

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
