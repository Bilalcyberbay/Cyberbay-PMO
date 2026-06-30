"use client"

import React, { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSWRConfig } from "swr"
import { FileText, Database, ChevronRight, ChevronDown, MoreHorizontal, Plus, Trash, Edit } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PageNode {
  id: string
  title: string
  icon: string | null
  parentId: string | null
  isDatabase: boolean
  children: PageNode[]
}

interface SidebarItemProps {
  node: PageNode
  depth: number
  onMutate: () => void
}

export default function SidebarItem({ node, depth, onMutate }: SidebarItemProps) {
  const router = useRouter()
  const params = useParams()
  const activePageId = params?.pageId as string

  const [isExpanded, setIsExpanded] = useState(false)
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [newTitle, setNewTitle] = useState(node.title)
  const [isUpdating, setIsUpdating] = useState(false)

  const hasChildren = node.children && node.children.length > 0
  const isActive = activePageId === node.id

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const handleSelectPage = () => {
    if (node.isDatabase) {
      router.push(`/databases/${node.id}`)
    } else {
      router.push(`/${node.id}`)
    }
  }

  const { mutate } = useSWRConfig()

  const handleAddSubpage = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const tempId = `temp-${Math.random().toString()}`
    const newOptimisticSubpage: PageNode = {
      id: tempId,
      title: "Untitled Subpage",
      icon: null,
      parentId: node.id,
      isDatabase: false,
      children: [],
    }

    const addChildToNode = (nodes: PageNode[]): PageNode[] => {
      return nodes.map((n) => {
        if (n.id === node.id) {
          return { ...n, children: [...(n.children || []), newOptimisticSubpage] }
        }
        if (n.children && n.children.length > 0) {
          return { ...n, children: addChildToNode(n.children) }
        }
        return n
      })
    }

    mutate("/api/pages", (currentPages: any) => addChildToNode(currentPages || []), false)
    setIsExpanded(true)

    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Subpage",
          parentId: node.id,
          isDatabase: false,
        }),
      })

      if (res.ok) {
        const newPage = await res.json()
        await mutate("/api/pages")
        router.push(`/${newPage.id}`)
      } else {
        mutate("/api/pages")
      }
    } catch (error) {
      console.error("Failed to add subpage:", error)
      mutate("/api/pages")
    }
  }

  const handleRenamePage = async () => {
    if (!newTitle.trim()) return
    setIsUpdating(true)

    const updateTitleInTree = (nodes: PageNode[]): PageNode[] => {
      return nodes.map((n) => {
        if (n.id === node.id) {
          return { ...n, title: newTitle.trim() }
        }
        if (n.children && n.children.length > 0) {
          return { ...n, children: updateTitleInTree(n.children) }
        }
        return n
      })
    }

    mutate("/api/pages", (currentPages: any) => updateTitleInTree(currentPages || []), false)
    setIsRenameOpen(false)

    try {
      const res = await fetch(`/api/pages/${node.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      })

      if (res.ok) {
        mutate("/api/pages")
      } else {
        mutate("/api/pages")
      }
    } catch (error) {
      console.error("Failed to rename page:", error)
      mutate("/api/pages")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeletePage = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to move this page to trash?")) return

    const removeNodeFromTree = (nodes: PageNode[]): PageNode[] => {
      return nodes
        .filter((n) => n.id !== node.id)
        .map((n) => {
          if (n.children && n.children.length > 0) {
            return { ...n, children: removeNodeFromTree(n.children) }
          }
          return n
        })
    }

    mutate("/api/pages", (currentPages: any) => removeNodeFromTree(currentPages || []), false)

    try {
      const res = await fetch(`/api/pages/${node.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        mutate("/api/pages")
        if (isActive) {
          router.push("/")
        }
      } else {
        mutate("/api/pages")
      }
    } catch (error) {
      console.error("Failed to delete page:", error)
      mutate("/api/pages")
    }
  }

  return (
    <div className="w-full">
      {/* Node Row */}
      <div
        onClick={handleSelectPage}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className={`group flex items-center justify-between py-1.5 pr-2 text-sm text-zinc-300 hover:bg-zinc-800/60 rounded-md cursor-pointer transition-colors duration-150 ${
          isActive ? "bg-zinc-800 text-white font-medium" : ""
        }`}
      >
        <div className="flex items-center space-x-1.5 min-w-0 flex-1">
          {/* Chevron expand/collapse */}
          <button
            onClick={handleToggleExpand}
            className={`h-4 w-4 flex items-center justify-center rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors duration-100 ${
              !hasChildren ? "invisible" : ""
            }`}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>

          {/* Node Icon */}
          <span className="text-zinc-400 flex-shrink-0">
            {node.isDatabase ? (
              <Database className="h-4 w-4 text-purple-400" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </span>

          {/* Title */}
          <span className="truncate text-xs tracking-wide">
            {node.icon && <span className="mr-1">{node.icon}</span>}
            {node.title}
          </span>
        </div>

        {/* Hover Actions Menu */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 flex-shrink-0 transition-opacity duration-150">
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="h-5 w-5 flex items-center justify-center rounded hover:bg-zinc-700 text-zinc-400 hover:text-white"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-zinc-900 border-zinc-800 text-zinc-300">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setIsRenameOpen(true)
                }}
                className="hover:bg-zinc-800 focus:bg-zinc-800 text-xs flex items-center space-x-2"
              >
                <Edit className="h-3 w-3" />
                <span>Rename</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleAddSubpage}
                className="hover:bg-zinc-800 focus:bg-zinc-800 text-xs flex items-center space-x-2"
              >
                <Plus className="h-3 w-3" />
                <span>Add subpage</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                onClick={handleDeletePage}
                className="hover:bg-zinc-800 focus:bg-zinc-800 text-xs text-red-400 hover:text-red-300 focus:text-red-300 flex items-center space-x-2"
              >
                <Trash className="h-3 w-3" />
                <span>Move to trash</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Child Nodes */}
      {isExpanded && hasChildren && (
        <div className="mt-0.5 flex flex-col space-y-0.5 animate-in fade-in duration-200">
          {node.children.map((child) => (
            <SidebarItem key={child.id} node={child} depth={depth + 1} onMutate={onMutate} />
          ))}
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Rename Page</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Page title..."
              disabled={isUpdating}
              className="bg-zinc-950 border-zinc-800 focus:ring-purple-500 text-sm"
            />
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="ghost"
              onClick={() => setIsRenameOpen(false)}
              disabled={isUpdating}
              className="text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenamePage}
              disabled={isUpdating}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
            >
              {isUpdating ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
