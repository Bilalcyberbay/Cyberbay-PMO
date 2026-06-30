"use client"

import React, { useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { Trash2, RotateCcw, Trash, FileText, Database, Loader2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface TrashedPage {
  id: string
  title: string
  icon: string | null
  isDatabase: boolean
}

export default function TrashPanel() {
  const { mutate } = useSWRConfig()
  const [isOpen, setIsOpen] = useState(false)

  // Fetch soft-deleted pages
  const { data: trashedPages, error, isLoading, mutate: mutateTrash } = useSWR<TrashedPage[]>(
    isOpen ? "/api/pages?inTrash=true" : null,
    fetcher
  )

  const handleRestore = async (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inTrash: false }),
      })

      if (res.ok) {
        // Sync both lists
        mutateTrash()
        mutate("/api/pages")
      }
    } catch (err) {
      console.error("Failed to restore page:", err)
    }
  }

  const handlePermanentDelete = async (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to permanently delete this page? This action cannot be undone.")) return
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        // Sync both lists
        mutateTrash()
        mutate("/api/pages")
      }
    } catch (err) {
      console.error("Failed to permanently delete page:", err)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger className="flex w-full items-center space-x-2 py-2 px-3 hover:bg-zinc-800/60 text-zinc-400 hover:text-white text-xs rounded transition duration-150 text-left select-none cursor-pointer">
        <Trash className="h-4 w-4" />
        <span>Trash</span>
      </PopoverTrigger>
      <PopoverContent align="start" side="right" className="w-64 bg-zinc-900 border-zinc-800 p-3 text-zinc-300 shadow-xl select-none">
        <div className="flex flex-col space-y-3">
          
          {/* Header */}
          <div className="flex items-center space-x-1.5 border-b border-zinc-800 pb-2">
            <Trash className="h-4 w-4 text-red-400" />
            <span className="text-xs font-semibold text-zinc-100">Trashed Pages</span>
          </div>

          {/* Body */}
          <div className="flex flex-col max-h-56 overflow-y-auto space-y-1">
            {isLoading && (
              <div className="flex items-center justify-center py-6 text-[10px] text-zinc-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                <span>Loading trash...</span>
              </div>
            )}

            {error && (
              <div className="text-center py-4 text-[10px] text-red-400">
                Failed to load trash.
              </div>
            )}

            {!isLoading && !error && trashedPages && trashedPages.length === 0 && (
              <div className="text-center py-8 text-[11px] text-zinc-500">
                Trash is empty.
              </div>
            )}

            {!isLoading && trashedPages && trashedPages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between p-1.5 hover:bg-zinc-800/60 rounded transition group"
              >
                {/* Page Icon & Title */}
                <div className="flex items-center space-x-2 min-w-0 flex-1 mr-2">
                  <span className="text-zinc-500 flex-shrink-0">
                    {page.isDatabase ? (
                      <Database className="h-3.5 w-3.5 text-purple-500/70" />
                    ) : (
                      <FileText className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="text-[11px] text-zinc-200 truncate">
                    {page.icon && <span className="mr-0.5">{page.icon}</span>}
                    {page.title || "Untitled"}
                  </span>
                </div>

                {/* Operations */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleRestore(e, page.id)}
                    className="h-5 w-5 flex items-center justify-center rounded hover:bg-zinc-700 text-zinc-400 hover:text-white"
                    title="Restore page"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => handlePermanentDelete(e, page.id)}
                    className="h-5 w-5 flex items-center justify-center rounded hover:bg-red-950 text-zinc-400 hover:text-red-400"
                    title="Delete permanently"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      </PopoverContent>
    </Popover>
  )
}
