"use client"

import React from "react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { FileText, Database, Calendar, Eye } from "lucide-react"

interface PropertySchema {
  id: string
  name: string
  type: "title" | "text" | "select" | "date"
  config: any
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

interface BoardCardProps {
  dbId: string
  row: RowData
  groupByColumn: PropertySchema
  otherColumns: PropertySchema[]
  onClick: () => void
  onMutateDatabase: () => void
}

export default function BoardCard({
  dbId,
  row,
  groupByColumn,
  otherColumns,
  onClick,
  onMutateDatabase,
}: BoardCardProps) {
  const [title, setTitle] = React.useState(row.title)

  React.useEffect(() => {
    setTitle(row.title)
  }, [row.title])

  const handleTitleBlur = async () => {
    if (title.trim() === row.title) return
    try {
      const res = await fetch(`/api/databases/${dbId}/rows/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      })
      if (res.ok) {
        onMutateDatabase()
      }
    } catch (err) {
      console.error("Failed to rename card inline:", err)
    }
  }

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: row.id,
  })

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  const getPropertyValue = (col: PropertySchema) => {
    const valObj = row.propertyValues.find((v) => v.propertySchemaId === col.id)
    return valObj ? valObj.value : ""
  }

  const getOptionColor = (opt: string, column: PropertySchema) => {
    const groups = column.config?.groups || []
    const group = groups.find((g: any) => g.options?.includes(opt))
    if (group) {
      if (group.name === "To-do" || group.name === "Not started") return "zinc"
      if (group.name === "In progress") return "blue"
      if (group.name === "Complete" || group.name === "Done") return "green"
    }
    return "purple"
  }

  // Display up to 2 other properties
  const displayProperties = otherColumns
    .filter((col) => col.id !== groupByColumn.id && col.type !== "title")
    .slice(0, 2)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group bg-zinc-900 border border-zinc-800/80 rounded-xl p-3.5 shadow-sm hover:border-zinc-700 hover:shadow-md transition-all duration-200 ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      {/* Drag handle overlay listeners */}
      <div {...listeners} {...attributes} className="absolute inset-0 z-0 rounded-xl" />

      {/* Card Body */}
      <div className="relative z-10 pointer-events-none flex flex-col space-y-2.5">
        
        {/* Title row */}
        <div className="flex items-start justify-between min-w-0">
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="text-zinc-500 flex-shrink-0">
              <FileText className="h-3.5 w-3.5" />
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur()
                }
              }}
              className="pointer-events-auto bg-transparent border-none outline-none font-bold text-zinc-150 text-xs w-full focus:ring-0 p-0 focus:bg-zinc-800/40 rounded px-1 transition"
              placeholder="Untitled"
            />
          </div>
          
          {/* Details trigger (click listener, override drag) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            className="pointer-events-auto opacity-0 group-hover:opacity-100 h-5 w-5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Open page detail"
          >
            <Eye className="h-3 w-3" />
          </button>
        </div>

        {/* Display secondary properties */}
        {displayProperties.length > 0 && (
          <div className="flex flex-col space-y-1.5 border-t border-zinc-800/40 pt-2 text-[10px] text-zinc-400">
            {displayProperties.map((col) => {
              const val = getPropertyValue(col)
              if (!val) return null

              return (
                <div key={col.id} className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium truncate mr-2">{col.name}:</span>
                  <span className="truncate max-w-[120px] text-zinc-300">
                    {col.type === "select" ? (
                      (() => {
                        const colColor = getOptionColor(val, col)
                        return (
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                            colColor === "zinc"
                              ? "bg-zinc-800 text-zinc-300"
                              : colColor === "blue"
                              ? "bg-blue-950/40 text-blue-300 border border-blue-900/30"
                              : colColor === "green"
                              ? "bg-green-950/40 text-green-300 border border-green-900/30"
                              : "bg-purple-950/40 text-purple-300 border border-purple-900/30"
                          }`}>
                            {val}
                          </span>
                        )
                      })()
                    ) : col.type === "date" ? (
                      <span className="flex items-center space-x-1">
                        <Calendar className="h-2.5 w-2.5 text-zinc-500" />
                        <span>{val}</span>
                      </span>
                    ) : (
                      val
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
