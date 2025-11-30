'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { AlertDialogConfirm } from '@/components/ui/alert-dialog-confirm'
import toast from '@/lib/toast'
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiZap,
  FiCpu,
  FiSend,
  FiGitBranch,
  FiMessageSquare,
  FiFilter,
  FiSearch
} from 'react-icons/fi'
import type { NodeType, NodeCategory } from '@/lib/types/node'
import { getNodeTypes, getNodeCategories, deleteNodeType } from '@/lib/api/nodes'

export default function NodesPage() {
  const [nodes, setNodes] = useState<NodeType[]>([])
  const [categories, setCategories] = useState<NodeCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [nodesData, categoriesData] = await Promise.all([
        getNodeTypes(),
        getNodeCategories()
      ])
      setNodes(nodesData)
      setCategories(categoriesData)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load nodes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteNodeType(deleteId)
      toast.success('Node deleted successfully')
      loadData()
    } catch {
      toast.error('Failed to delete node')
    } finally {
      setDeleteId(null)
    }
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, JSX.Element> = {
      'trigger': <FiZap className="w-5 h-5" />,
      'ai': <FiCpu className="w-5 h-5" />,
      'action': <FiSend className="w-5 h-5" />,
      'logic': <FiGitBranch className="w-5 h-5" />,
      'response': <FiMessageSquare className="w-5 h-5" />
    }
    return icons[category] || <FiZap className="w-5 h-5" />
  }

  // Filter nodes
  const filteredNodes = nodes.filter(node => {
    const matchesCategory = selectedCategory === 'all' || node.category === selectedCategory
    const matchesSearch = node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Group by category
  const nodesByCategory = filteredNodes.reduce((acc, node) => {
    if (!acc[node.category]) {
      acc[node.category] = []
    }
    acc[node.category].push(node)
    return acc
  }, {} as Record<string, NodeType[]>)

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Node Management</h1>
          <p className="text-muted-foreground">
            Manage workflow node types and configurations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
          >
            {loading ? (
              <Spinner className="size-4 mr-2" />
            ) : (
              <FiRefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button>
            <FiPlus className="w-4 h-4 mr-2" />
            Add Node Type
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <FiFilter className="w-4 h-4 text-muted-foreground" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="dashboard-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Nodes</p>
              <p className="text-2xl font-bold mt-1">{nodes.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FiZap className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        {categories.slice(0, 4).map(cat => {
          const count = nodes.filter(n => n.category === cat.id).length
          return (
            <div key={cat.id} className="dashboard-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{cat.label}</p>
                  <p className="text-2xl font-bold mt-1">{count}</p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                  backgroundColor: `${cat.color}20`,
                  color: cat.color
                }}>
                  {getCategoryIcon(cat.id)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Nodes List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="size-8" />
        </div>
      ) : filteredNodes.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
            <FiZap className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No nodes found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || selectedCategory !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first node type to get started'}
          </p>
          {!searchQuery && selectedCategory === 'all' && (
            <Button>
              <FiPlus className="w-4 h-4 mr-2" />
              Add Node Type
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(nodesByCategory).map(([category, categoryNodes]) => {
            const categoryInfo = categories.find(c => c.id === category)
            return (
              <div key={category}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                    backgroundColor: `${categoryInfo?.color || '#3B82F6'}20`,
                    color: categoryInfo?.color || '#3B82F6'
                  }}>
                    {getCategoryIcon(category)}
                  </div>
                  <h2 className="text-xl font-semibold">
                    {categoryInfo?.label || category}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    ({categoryNodes.length})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryNodes.map((node, index) => (
                    <motion.div
                      key={node.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="dashboard-card p-5"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                          backgroundColor: `${node.color}20`,
                          color: node.color
                        }}>
                          {getCategoryIcon(node.category)}
                        </div>
                        {node.isPremium && (
                          <span className="text-xs font-medium bg-warning/10 text-warning px-2 py-1 rounded-full border border-warning/20">
                            Premium
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-lg mb-2">{node.label}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {node.description}
                      </p>

                      {node.properties && node.properties.length > 0 && (
                        <div className="mb-4 pb-4 border-b border-border">
                          <p className="text-xs text-muted-foreground">
                            {node.properties.length} properties configured
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <FiEdit2 className="w-3.5 h-3.5 mr-1.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(node.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialogConfirm
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Node Type"
        description="Are you sure you want to delete this node type? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
