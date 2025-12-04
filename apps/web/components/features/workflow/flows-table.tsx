'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FiPlay,
  FiEdit,
  FiCopy,
  FiArchive,
  FiTrash2,
  FiMoreVertical,
} from 'react-icons/fi'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppDispatch } from '@/lib/store/hooks'
import { updateFlow, deleteFlow, duplicateFlow, archiveFlow } from '@/lib/store/slices/flowsSlice'
import { AlertDialogConfirm } from '@/components/ui/alert-dialog-confirm'
import toast from '@/lib/toast'
import { Flow } from '@/lib/types'

interface FlowsTableProps {
  flows: Flow[]
  onUpdate: () => void
  onRun: (flowId: string) => void
}

export function FlowsTable({ flows, onUpdate, onRun }: FlowsTableProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [deleteFlowId, setDeleteFlowId] = useState<string | null>(null)

  const isAllSelected = flows.length > 0 && selectedIds.length === flows.length
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < flows.length

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(flows.map(f => f.id))
    }
  }

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    setShowBulkDeleteDialog(true)
  }

  const confirmBulkDelete = async () => {
    const promises = selectedIds.map(id => dispatch(deleteFlow(parseInt(id))).unwrap())

    toast.promise(Promise.all(promises), {
      loading: `Deleting ${selectedIds.length} workflow(s)...`,
      success: () => {
        setSelectedIds([])
        onUpdate()
        return `${selectedIds.length} workflow(s) deleted!`
      },
      error: 'Failed to delete some workflows'
    })
  }

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return

    const promises = selectedIds.map(id => dispatch(archiveFlow(parseInt(id))).unwrap())

    toast.promise(Promise.all(promises), {
      loading: `Archiving ${selectedIds.length} workflow(s)...`,
      success: () => {
        setSelectedIds([])
        onUpdate()
        return `${selectedIds.length} workflow(s) archived!`
      },
      error: 'Failed to archive some workflows'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'success'
      case 'draft': return 'warning'
      case 'archived': return 'default'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.length} selected
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkArchive}
          >
            <FiArchive className="w-4 h-4 mr-2" />
            Archive
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkDelete}
            className="text-red-500 hover:text-red-600"
          >
            <FiTrash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border/40 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeSelected
                  }}
                  onChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Executions</TableHead>
              <TableHead>Success Rate</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flows.map((flow) => (
              <TableRow
                key={flow.id}
                data-state={selectedIds.includes(flow.id) ? 'selected' : undefined}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(flow.id)}
                    onChange={() => handleSelectOne(flow.id)}
                  />
                </TableCell>
                <TableCell>
                  <Link href={`/flows/${flow.id}`} className="block hover:underline">
                    <div className="font-medium">{flow.name}</div>
                    {flow.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {flow.description}
                      </div>
                    )}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(flow.status) as any} className="capitalize">
                    {flow.status}
                  </Badge>
                </TableCell>
                <TableCell>{(flow as any).executions || 0}</TableCell>
                <TableCell>
                  <span className="text-green-500">{(flow as any).successRate || 0}%</span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {flow.updatedAt ? new Date(flow.updatedAt).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onRun(flow.id)}
                    >
                      <FiPlay className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <FiMoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/flows/${flow.id}/edit`)}>
                          <FiEdit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            try {
                              const dup = await dispatch(duplicateFlow(parseInt(flow.id))).unwrap()
                              toast.success('Flow duplicated!')
                              router.push(`/flows/${dup.id}/edit`)
                            } catch {
                              toast.error('Failed to duplicate')
                            }
                          }}
                        >
                          <FiCopy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async () => {
                            try {
                              await dispatch(archiveFlow(parseInt(flow.id))).unwrap()
                              toast.success('Flow archived!')
                              onUpdate()
                            } catch {
                              toast.error('Failed to archive')
                            }
                          }}
                        >
                          <FiArchive className="w-4 h-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteFlowId(flow.id)}
                          className="text-destructive"
                        >
                          <FiTrash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialogConfirm
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        title={`Delete ${selectedIds.length} workflow(s)?`}
        description="All selected workflows will be permanently deleted. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmBulkDelete}
        variant="destructive"
      />

      {/* Single Delete Confirmation Dialog */}
      <AlertDialogConfirm
        open={deleteFlowId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteFlowId(null)
          }
        }}
        title="Delete workflow?"
        description="This workflow will be permanently deleted. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={async () => {
          if (!deleteFlowId) return
          const idToDelete = deleteFlowId
          setDeleteFlowId(null) // Close dialog immediately

          try {
            await dispatch(deleteFlow(parseInt(idToDelete))).unwrap()
            toast.success('Flow deleted!')
            onUpdate()
          } catch {
            toast.error('Failed to delete')
          }
        }}
        variant="destructive"
      />
    </div>
  )
}
