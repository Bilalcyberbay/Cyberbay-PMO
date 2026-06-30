"use client"

import React, { useState } from "react"
import { useSWRConfig } from "swr"
import { Plus, Settings2, Trash2, ArrowUpDown, Tag, Calendar, Type, MoreHorizontal } from "lucide-react"
import PropertyCell from "./PropertyCell"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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

interface PropertySchema {
  id: string
  name: string
  type: "title" | "text" | "select" | "date"
  config: any
  position: number
}

interface PagePropertyValue {
  id: string
  value: any
  pageId: string
  propertySchemaId: string
}

interface RowData {
  id: string
  title: string
  propertyValues: PagePropertyValue[]
}

interface TableViewProps {
  dbId: string
  columns: PropertySchema[]
  rows: RowData[]
  onMutate: () => void
  onRowClick?: (rowId: string) => void
  onEditProperty?: (columnId: string) => void
}

export default function TableView({
  dbId,
  columns,
  rows,
  onMutate,
  onRowClick,
  onEditProperty,
}: TableViewProps) {
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false)
  const [newColName, setNewColName] = useState("")
  const [newColType, setNewColType] = useState<"text" | "select" | "date">("text")

  const { mutate } = useSWRConfig()

  const handleAddRow = async () => {
    const tempId = `temp-row-${Math.random().toString()}`
    const optimisticRow: RowData = {
      id: tempId,
      title: "Untitled",
      propertyValues: [],
    }

    // Optimistically append the new row to the SWR database cache!
    mutate(`/api/databases/${dbId}`, (currentDbData: any) => {
      if (!currentDbData) return currentDbData
      return {
        ...currentDbData,
        rows: [...(currentDbData.rows || []), optimisticRow],
      }
    }, false)

    try {
      const res = await fetch(`/api/databases/${dbId}/rows`, {
        method: "POST",
      })
      if (res.ok) {
        // Revalidate SWR
        await mutate(`/api/databases/${dbId}`)
      } else {
        mutate(`/api/databases/${dbId}`) // Rollback
      }
    } catch (err) {
      console.error("Failed to add row:", err)
      mutate(`/api/databases/${dbId}`) // Rollback
    }
  }

  const handleAddColumn = async () => {
    if (!newColName.trim()) return
    try {
      const res = await fetch(`/api/databases/${dbId}/columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newColName.trim(),
          type: newColType,
        }),
      })

      if (res.ok) {
        setNewColName("")
        setIsAddColumnOpen(false)
        onMutate()
      }
    } catch (err) {
      console.error("Failed to add column:", err)
    }
  }



  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm("Are you sure you want to delete this column? All values inside this column across all rows will be lost.")) return
    try {
      const res = await fetch(`/api/databases/${dbId}/columns/${columnId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        onMutate()
      }
    } catch (err) {
      console.error("Failed to delete column:", err)
    }
  }

  const getPropertyValue = (row: RowData, column: PropertySchema) => {
    if (column.type === "title") {
      return row.title
    }
    const valObj = row.propertyValues.find((v) => v.propertySchemaId === column.id)
    return valObj ? valObj.value : ""
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case "title":
      case "text":
        return <Type className="h-3 w-3 text-zinc-500" />
      case "select":
        return <Tag className="h-3 w-3 text-purple-400" />
      case "date":
        return <Calendar className="h-3 w-3 text-blue-400" />
      default:
        return null
    }
  }

  return (
    <div className="w-full select-none">
      
      {/* Table Frame container */}
      <div className="overflow-x-auto border border-zinc-800/80 rounded-xl bg-zinc-950/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-sm">
        <table className="w-full border-collapse text-left">
          
          {/* Header Row */}
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/35">
              {columns.map((col) => (
                <th
                  key={col.id}
                  className="px-3 py-2 text-xs font-semibold text-zinc-400 border-r border-zinc-800/50 min-w-[160px] group/header relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5 truncate">
                      {getIconForType(col.type)}
                      <span className="truncate">{col.name}</span>
                    </span>

                    {/* Column Configuration Settings Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="h-5 w-5 flex items-center justify-center rounded hover:bg-zinc-800 text-zinc-500 hover:text-white cursor-pointer opacity-0 group-hover/header:opacity-100 transition-opacity duration-150"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 bg-zinc-900 border-zinc-800 p-1 text-zinc-300">
                        <div className="px-2 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider select-none">
                          Column Settings
                        </div>
                        {col.type !== "title" ? (
                          <>
                            <DropdownMenuItem
                              onClick={() => onEditProperty?.(col.id)}
                              className="hover:bg-zinc-800 focus:bg-zinc-800 text-xs cursor-pointer"
                            >
                              Edit property
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator className="bg-zinc-850" />
                            
                            <DropdownMenuItem
                              onClick={() => handleDeleteColumn(col.id)}
                              className="hover:bg-zinc-850 focus:bg-zinc-850 text-xs text-red-400 hover:text-red-300 focus:text-red-300 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5 inline" />
                              Delete property
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem disabled className="text-xs text-zinc-500">
                            Primary column cannot be edited.
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </th>
              ))}
              
              {/* Add Column Header */}
              <th className="px-3 py-1 text-xs font-semibold text-zinc-500 min-w-[60px]">
                <button
                  onClick={() => setIsAddColumnOpen(true)}
                  className="flex items-center space-x-1 hover:text-white transition duration-150 py-1"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-zinc-800/60 hover:bg-zinc-900/10">
                {columns.map((col) => (
                  <td key={col.id} className="border-r border-zinc-800/50 p-0 align-middle relative group/cell">
                    {col.type === "title" && (
                      <button
                        type="button"
                        onClick={() => onRowClick?.(row.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-zinc-300 hover:text-white transition duration-150 cursor-pointer z-10"
                      >
                        Open
                      </button>
                    )}
                    <PropertyCell
                      dbId={dbId}
                      rowId={row.id}
                      column={col}
                      value={getPropertyValue(row, col)}
                      onMutate={onMutate}
                    />
                  </td>
                ))}
                {/* Empty cell placeholder aligned with add-col header */}
                <td className="bg-zinc-950/5" />
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* Footer Add Row Trigger */}
      <button
        onClick={handleAddRow}
        className="mt-3 flex items-center space-x-1.5 py-2 px-3 hover:bg-zinc-800/40 text-zinc-400 hover:text-white text-xs rounded-lg transition duration-150"
      >
        <Plus className="h-4 w-4" />
        <span>Add a row</span>
      </button>

      {/* Add Column Dialog */}
      <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">New Column Property</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Column Name
              </label>
              <Input
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="Status, Assignee, Due Date..."
                className="bg-zinc-950 border-zinc-800 focus:ring-purple-500 text-sm"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Column Type
              </label>
              <select
                value={newColType}
                onChange={(e) => setNewColType(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none"
              >
                <option value="text">Text</option>
                <option value="select">Select Option</option>
                <option value="date">Date</option>
              </select>
            </div>
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="ghost"
              onClick={() => setIsAddColumnOpen(false)}
              className="text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddColumn}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
            >
              Add Property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



    </div>
  )
}
