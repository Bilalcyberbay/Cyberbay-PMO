"use client"

import React, { useState, useEffect } from "react"
import { useSWRConfig } from "swr"
import { useEditorStore } from "@/store/editorStore"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar, Plus } from "lucide-react"

interface PropertySchema {
  id: string
  name: string
  type: "title" | "text" | "select" | "date"
  config: any
}

interface PropertyCellProps {
  dbId: string
  rowId: string
  column: PropertySchema
  value: any
  onMutate: () => void
}

export default function PropertyCell({ dbId, rowId, column, value, onMutate }: PropertyCellProps) {
  const { setSaveStatus } = useEditorStore()
  const [inputValue, setInputValue] = useState(value || "")
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [newOptionText, setNewOptionText] = useState("")

  useEffect(() => {
    if (!value && column.type === "select") {
      const groups = column.config?.groups || []
      const defaultOption = groups[0]?.options?.[0] || ""
      setInputValue(defaultOption)
    } else {
      setInputValue(value || "")
    }
  }, [value, column])

  const { mutate } = useSWRConfig()

  const saveValue = async (val: any) => {
    setSaveStatus("saving")

    // Optimistically update SWR database cache!
    mutate(`/api/databases/${dbId}`, (currentDbData: any) => {
      if (!currentDbData) return currentDbData

      const updatedRows = currentDbData.rows.map((row: any) => {
        if (row.id === rowId) {
          if (column.type === "title") {
            return { ...row, title: val }
          } else {
            const updatedValues = row.propertyValues.map((v: any) => {
              if (v.propertySchemaId === column.id) {
                return { ...v, value: val }
              }
              return v
            })

            const exists = row.propertyValues.some((v: any) => v.propertySchemaId === column.id)
            if (!exists) {
              updatedValues.push({
                id: `temp-${Math.random()}`,
                value: val,
                pageId: rowId,
                propertySchemaId: column.id,
              })
            }

            return { ...row, propertyValues: updatedValues }
          }
        }
        return row
      })

      return { ...currentDbData, rows: updatedRows }
    }, false)

    try {
      let body: any = {}
      if (column.type === "title") {
        body = { title: val }
      } else {
        body = {
          properties: {
            [column.id]: val,
          },
        }
      }

      const res = await fetch(`/api/databases/${dbId}/rows/${rowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setSaveStatus("saved")
        await mutate(`/api/databases/${dbId}`)
      } else {
        setSaveStatus("error")
        mutate(`/api/databases/${dbId}`)
      }
    } catch (err) {
      setSaveStatus("error")
      mutate(`/api/databases/${dbId}`)
    }
  }

  const getOptionColor = (opt: string) => {
    const groups = column.config?.groups || []
    const group = groups.find((g: any) => g.options?.includes(opt))
    if (group) {
      if (group.name === "To-do" || group.name === "Not started") return "zinc"
      if (group.name === "In progress") return "blue"
      if (group.name === "Complete" || group.name === "Done") return "green"
    }
    return "purple"
  }

  const handleBlur = () => {
    if (inputValue !== (value || "")) {
      saveValue(inputValue)
    }
  }

  // Handle select tag options list update
  const handleAddOption = async () => {
    if (!newOptionText.trim()) return

    const currentGroups = column.config?.groups || [
      { name: "To-do", color: "zinc", options: ["Not started"] },
      { name: "In progress", color: "blue", options: ["In progress"] },
      { name: "Complete", color: "green", options: ["Done"] },
    ]

    const flatOptions = currentGroups.flatMap((g: any) => g.options || [])
    if (flatOptions.includes(newOptionText.trim())) return

    // Add option to first group ("To-do")
    const updatedGroups = currentGroups.map((g: any, index: number) => {
      if (index === 0) {
        return { ...g, options: [...g.options, newOptionText.trim()] }
      }
      return g
    })
    
    setSaveStatus("saving")
    try {
      const res = await fetch(`/api/databases/${dbId}/columns/${column.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: { groups: updatedGroups },
        }),
      })

      if (res.ok) {
        setSaveStatus("saved")
        setNewOptionText("")
        onMutate()
      } else {
        setSaveStatus("error")
      }
    } catch (err) {
      setSaveStatus("error")
    }
  }

  const handleSelectOption = (option: string) => {
    setInputValue(option)
    saveValue(option)
    setIsPopoverOpen(false)
  }

  const handleClearOption = () => {
    setInputValue("")
    saveValue("")
    setIsPopoverOpen(false)
  }

  // Render Title or Text Cell
  if (column.type === "title" || column.type === "text") {
    return (
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={column.type === "title" ? "Untitled" : "empty"}
        className={`w-full bg-transparent outline-none text-xs border-none focus:ring-0 p-1.5 text-zinc-100 ${
          column.type === "title" ? "font-medium" : ""
        }`}
      />
    )
  }

  // Render Date Cell
  if (column.type === "date") {
    return (
      <div className="flex items-center space-x-1.5 px-1.5 w-full">
        <Calendar className="h-3 w-3 text-zinc-500 flex-shrink-0" />
        <input
          type="date"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            saveValue(e.target.value)
          }}
          className="w-full bg-transparent outline-none text-xs border-none focus:ring-0 text-zinc-100 p-0 dark:scheme-dark cursor-pointer"
        />
      </div>
    )
  }

  // Render Select Option Cell
  if (column.type === "select") {
    const groups = column.config?.groups || []
    const options = groups.length > 0
      ? groups.flatMap((g: any) => g.options || [])
      : (column.config?.options || [])

    const color = getOptionColor(inputValue)
    
    return (
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger className="w-full h-full text-left px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800/40 rounded transition cursor-pointer truncate">
          {inputValue ? (
            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide truncate ${
              color === "zinc"
                ? "bg-zinc-800 text-zinc-300"
                : color === "blue"
                ? "bg-blue-950/40 text-blue-300 border border-blue-900/30"
                : color === "green"
                ? "bg-green-950/40 text-green-300 border border-green-900/30"
                : "bg-purple-950/40 text-purple-300 border border-purple-900/30"
            }`}>
              {inputValue}
            </span>
          ) : (
            <span className="text-zinc-650">empty</span>
          )}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-48 bg-zinc-900 border-zinc-800 p-2 text-zinc-300 select-none">
          <div className="flex flex-col space-y-2">
            
            {/* Header / Add input */}
            <div className="flex items-center space-x-1 border-b border-zinc-800 pb-1.5">
              <input
                value={newOptionText}
                onChange={(e) => setNewOptionText(e.target.value)}
                placeholder="New option name..."
                className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1 text-[11px] w-full focus:outline-none"
              />
              <button
                onClick={handleAddOption}
                className="h-6 w-6 rounded bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center flex-shrink-0 transition"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Options List */}
            <div className="flex flex-col max-h-40 overflow-y-auto space-y-0.5">
              {options.length === 0 ? (
                <div className="text-[10px] text-zinc-500 py-2 text-center">
                  No options yet.
                </div>
              ) : (
                options.map((opt: string) => {
                  const optColor = getOptionColor(opt)
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectOption(opt)}
                      className="w-full text-left px-2 py-1 text-[11px] hover:bg-zinc-800 rounded text-zinc-200 transition flex items-center space-x-1.5"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                        optColor === "zinc"
                          ? "bg-zinc-500"
                          : optColor === "blue"
                          ? "bg-blue-450"
                          : optColor === "green"
                          ? "bg-green-400"
                          : "bg-purple-400"
                      }`} />
                      <span>{opt}</span>
                    </button>
                  )
                })
              )}
            </div>

            {inputValue && (
              <button
                onClick={handleClearOption}
                className="w-full text-center border-t border-zinc-800 pt-1.5 text-[10px] text-zinc-500 hover:text-zinc-300 transition"
              >
                Clear selection
              </button>
            )}

          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return null
}
