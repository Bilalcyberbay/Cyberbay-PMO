"use client"

import React, { useState, useEffect } from "react"
import useSWR from "swr"
import { useEditorStore } from "@/store/editorStore"
import { ArrowLeft, Plus, X, Trash2, Tag, Loader2 } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface GroupConfig {
  name: string
  color: string
  options: string[]
}

interface ColumnData {
  id: string
  name: string
  type: string
  config: {
    groups?: GroupConfig[]
  } | null
}

interface EditPropertyPanelProps {
  dbId: string
  columnId: string
  onClose: () => void
  onMutateDatabase: () => void
}

export default function EditPropertyPanel({
  dbId,
  columnId,
  onClose,
  onMutateDatabase,
}: EditPropertyPanelProps) {
  const { setSaveStatus } = useEditorStore()
  
  // Fetch column schema details
  const { data: column, error, mutate: mutateColumn, isLoading } = useSWR<ColumnData>(
    columnId ? `/api/databases/${dbId}/columns/${columnId}` : null,
    fetcher
  )

  const [colName, setColName] = useState("")
  const [newOptionTextMap, setNewOptionTextMap] = useState<Record<string, string>>({})
  const [addingToGroup, setAddingToGroup] = useState<string | null>(null)

  useEffect(() => {
    if (column) {
      setColName(column.name)
    }
  }, [column])

  // Handle column rename
  const handleRename = async () => {
    if (!column || !colName.trim() || colName === column.name) return
    setSaveStatus("saving")
    try {
      const res = await fetch(`/api/databases/${dbId}/columns/${columnId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: colName.trim() }),
      })

      if (res.ok) {
        setSaveStatus("saved")
        mutateColumn()
        onMutateDatabase()
      } else {
        setSaveStatus("error")
      }
    } catch (err) {
      setSaveStatus("error")
    }
  }

  // Handle adding an option to a category group
  const handleAddOption = async (groupName: string) => {
    const text = newOptionTextMap[groupName]?.trim()
    if (!column || !text) return

    // Get current groups config (default if null)
    const currentGroups: GroupConfig[] = column.config?.groups || [
      { name: "To-do", color: "zinc", options: ["Not started"] },
      { name: "In progress", color: "blue", options: ["In progress"] },
      { name: "Complete", color: "green", options: ["Done"] },
    ]

    // Append option to target group
    const updatedGroups = currentGroups.map((g) => {
      if (g.name === groupName) {
        // Prevent duplicate options
        const options = g.options.includes(text) ? g.options : [...g.options, text]
        return { ...g, options }
      }
      return g
    })

    setSaveStatus("saving")
    try {
      const res = await fetch(`/api/databases/${dbId}/columns/${columnId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: { groups: updatedGroups },
        }),
      })

      if (res.ok) {
        setSaveStatus("saved")
        setNewOptionTextMap((prev) => ({ ...prev, [groupName]: "" }))
        setAddingToGroup(null)
        mutateColumn()
        onMutateDatabase()
      } else {
        setSaveStatus("error")
      }
    } catch (err) {
      setSaveStatus("error")
    }
  }

  // Handle removing an option from a category group
  const handleRemoveOption = async (groupName: string, optionToRemove: string) => {
    if (!column) return

    const currentGroups: GroupConfig[] = column.config?.groups || []
    const updatedGroups = currentGroups.map((g) => {
      if (g.name === groupName) {
        return { ...g, options: g.options.filter((opt) => opt !== optionToRemove) }
      }
      return g
    })

    setSaveStatus("saving")
    try {
      const res = await fetch(`/api/databases/${dbId}/columns/${columnId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: { groups: updatedGroups },
        }),
      })

      if (res.ok) {
        setSaveStatus("saved")
        mutateColumn()
        onMutateDatabase()
      } else {
        setSaveStatus("error")
      }
    } catch (err) {
      setSaveStatus("error")
    }
  }

  // Handle delete column
  const handleDeleteColumn = async () => {
    if (!confirm("Are you sure you want to delete this property column? All values inside this column will be permanently lost.")) return
    setSaveStatus("saving")
    try {
      const res = await fetch(`/api/databases/${dbId}/columns/${columnId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setSaveStatus("saved")
        onMutateDatabase()
        onClose()
      } else {
        setSaveStatus("error")
      }
    } catch (err) {
      setSaveStatus("error")
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-xs w-full select-none">
        <Loader2 className="h-5 w-5 animate-spin mb-2 text-purple-500" />
        <span>Loading property settings...</span>
      </div>
    )
  }

  if (error || !column) {
    return (
      <div className="text-center py-20 text-xs text-zinc-500 w-full select-none">
        Failed to load property columns.
      </div>
    )
  }

  const groups = column.config?.groups || [
    { name: "To-do", color: "zinc", options: ["Not started"] },
    { name: "In progress", color: "blue", options: ["In progress"] },
    { name: "Complete", color: "green", options: ["Done"] },
  ]

  return (
    <div className="flex flex-col w-full h-full select-none bg-zinc-950/10 rounded-2xl border border-zinc-850 p-4 shadow-sm relative overflow-hidden animate-in slide-in-from-right duration-200">
      
      {/* Header with Back Arrow */}
      <div className="flex items-center space-x-2 border-b border-zinc-850/60 pb-3 mb-4">
        <button
          onClick={onClose}
          className="h-7 w-7 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition"
          title="Back to database"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <span className="text-xs font-bold text-zinc-150">Edit property</span>
      </div>

      {/* Settings Options */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-5">
        
        {/* Rename property name */}
        <div className="space-y-1.5 px-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Property Name
          </label>
          <input
            value={colName}
            onChange={(e) => setColName(e.target.value)}
            onBlur={handleRename}
            className="w-full bg-zinc-950 border border-zinc-850/60 focus:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
            placeholder="Property name..."
          />
        </div>

        {/* Data Type Indicator */}
        <div className="space-y-1 px-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Type
          </span>
          <span className="flex items-center space-x-1.5 text-xs text-zinc-300 font-semibold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-850">
            <Tag className="h-3 w-3 text-purple-400" />
            <span className="capitalize">{column.type}</span>
          </span>
        </div>

        <div className="h-[1px] bg-zinc-850/60 mx-2" />

        {/* Categories list section (To-do, In progress, Complete) */}
        <div className="space-y-4 px-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Status Groups
          </span>
          
          <div className="flex flex-col space-y-4">
            {groups.map((group) => (
              <div key={group.name} className="space-y-2">
                
                {/* Category Header */}
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide select-none ${
                    group.name === "To-do"
                      ? "bg-zinc-800 text-zinc-300"
                      : group.name === "In progress"
                      ? "bg-blue-950/40 text-blue-300 border border-blue-900/30"
                      : "bg-green-950/40 text-green-300 border border-green-900/30"
                  }`}>
                    {group.name}
                  </span>
                  
                  {/* Plus trigger to add status option */}
                  <button
                    onClick={() => setAddingToGroup(group.name)}
                    className="h-5 w-5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white flex items-center justify-center cursor-pointer transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Inline text editor for new option */}
                {addingToGroup === group.name && (
                  <div className="flex items-center space-x-1 mt-1">
                    <input
                      value={newOptionTextMap[group.name] || ""}
                      onChange={(e) =>
                        setNewOptionTextMap((prev) => ({ ...prev, [group.name]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddOption(group.name)
                      }}
                      placeholder="Press Enter to add option..."
                      className="w-full bg-zinc-950 border border-zinc-850/60 focus:border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-200 focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => setAddingToGroup(null)}
                      className="h-5 w-5 text-zinc-500 hover:text-red-400 flex items-center justify-center cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Options Pills list */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {group.options.length === 0 ? (
                    <span className="text-[10px] text-zinc-650 italic">No options</span>
                  ) : (
                    group.options.map((opt) => (
                      <span
                        key={opt}
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide border ${
                          group.name === "To-do"
                            ? "bg-zinc-900 text-zinc-300 border-zinc-800/80"
                            : group.name === "In progress"
                            ? "bg-blue-950/40 text-blue-300 border-blue-900/30"
                            : "bg-green-950/40 text-green-300 border-green-900/30"
                        }`}
                      >
                        <span>{opt}</span>
                        {/* Remove Option trigger */}
                        <button
                          onClick={() => handleRemoveOption(group.name, opt)}
                          className="h-3.5 w-3.5 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white flex items-center justify-center cursor-pointer transition"
                        >
                          <X className="h-2 w-2" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Delete Column button at the bottom */}
      <div className="border-t border-zinc-850/60 pt-4 mt-4 px-2 select-none">
        <button
          onClick={handleDeleteColumn}
          className="w-full flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg bg-red-950/20 hover:bg-red-900 border border-red-900/40 text-red-400 hover:text-white transition duration-150 cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete property</span>
        </button>
      </div>

    </div>
  )
}
