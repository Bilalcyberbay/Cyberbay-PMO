"use client"

import React, { useMemo } from "react"
import { DndContext, DragEndEvent, useSensors, useSensor, PointerSensor, useDroppable } from "@dnd-kit/core"
import { useSWRConfig } from "swr"
import { useEditorStore } from "@/store/editorStore"
import BoardCard from "./BoardCard"

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

interface DatabaseBoardViewProps {
  dbId: string
  columns: PropertySchema[]
  rows: RowData[]
  onMutate: () => void
  onRowClick: (rowId: string) => void
}

// Custom Droppable Column container
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({
    id,
  })

  return (
    <div ref={setNodeRef} className="flex-1 flex flex-col space-y-2 min-h-[300px] pb-10">
      {children}
    </div>
  )
}

export default function DatabaseBoardView({
  dbId,
  columns,
  rows,
  onMutate,
  onRowClick,
}: DatabaseBoardViewProps) {
  const { setSaveStatus } = useEditorStore()

  // Find the first Select column in the schema to group by
  const groupByColumn = useMemo(() => {
    return columns.find((col) => col.type === "select")
  }, [columns])

  // Setup sensors for DndContext (pointer constraints to allow clicks)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Construct board columns list
  const boardColumns = useMemo((): string[] => {
    if (!groupByColumn) return []
    const config = groupByColumn.config as any
    const groups = config?.groups || []
    if (groups.length > 0) {
      return groups.flatMap((g: any) => g.options || [])
    }
    return config?.options || []
  }, [groupByColumn])

  // Group rows by select values
  const groupedRows = useMemo(() => {
    const map = new Map<string, RowData[]>()
    
    // Initialize columns in map
    boardColumns.forEach((colName: string) => {
      map.set(colName, [])
    })

    if (!groupByColumn) return map

    // The default option is the first option (e.g. "Not started")
    const defaultOption = boardColumns[0] || "No Status"

    rows.forEach((row) => {
      const valObj = row.propertyValues.find((v) => v.propertySchemaId === groupByColumn.id)
      const colValue = valObj ? valObj.value : ""
      
      const colName = colValue && boardColumns.includes(colValue) ? colValue : defaultOption
      map.get(colName)?.push(row)
    })

    return map
  }, [rows, boardColumns, groupByColumn])

  const { mutate } = useSWRConfig()

  // Handle Drag Card Drop
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || !groupByColumn) return

    const rowId = active.id as string
    const newColumnValue = over.id as string
    
    // Set property value to selected option
    const finalValue = newColumnValue

    // Find current value of this row to check if changed
    const activeRow = rows.find((r) => r.id === rowId)
    if (!activeRow) return

    const valObj = activeRow.propertyValues.find((v) => v.propertySchemaId === groupByColumn.id)
    const prevValue = valObj ? valObj.value : ""

    if (prevValue === finalValue) return

    // Optimistically update the rows in SWR database cache!
    mutate(`/api/databases/${dbId}`, (currentDbData: any) => {
      if (!currentDbData) return currentDbData

      const updatedRows = currentDbData.rows.map((row: any) => {
        if (row.id === rowId) {
          const updatedValues = row.propertyValues.map((v: any) => {
            if (v.propertySchemaId === groupByColumn.id) {
              return { ...v, value: finalValue }
            }
            return v
          })

          const exists = row.propertyValues.some((v: any) => v.propertySchemaId === groupByColumn.id)
          if (!exists) {
            updatedValues.push({
              id: `temp-${Math.random()}`,
              value: finalValue,
              pageId: rowId,
              propertySchemaId: groupByColumn.id,
            })
          }

          return { ...row, propertyValues: updatedValues }
        }
        return row
      })

      return { ...currentDbData, rows: updatedRows }
    }, false)

    setSaveStatus("saving")
    try {
      const res = await fetch(`/api/databases/${dbId}/rows/${rowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          properties: {
            [groupByColumn.id]: finalValue,
          },
        }),
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

  const handleAddNewPageInColumn = async (colName: string) => {
    const tempId = `temp-row-${Math.random().toString()}`
    const optimisticRow: RowData = {
      id: tempId,
      title: "Untitled",
      propertyValues: groupByColumn ? [
        {
          id: `temp-val-${Math.random()}`,
          value: colName,
          pageId: tempId,
          propertySchemaId: groupByColumn.id,
        }
      ] : [],
    }

    // Optimistically append the new row to SWR database cache!
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
        const newRow = await res.json()
        if (groupByColumn) {
          await fetch(`/api/databases/${dbId}/rows/${newRow.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              properties: {
                [groupByColumn.id]: colName,
              },
            }),
          })
        }
        await mutate(`/api/databases/${dbId}`)
      } else {
        mutate(`/api/databases/${dbId}`)
      }
    } catch (err) {
      console.error("Failed to add page in column:", err)
      mutate(`/api/databases/${dbId}`)
    }
  }

  if (!groupByColumn) {
    return (
      <div className="flex h-52 w-full flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/10 text-center p-6 text-zinc-500">
        <p className="text-xs font-semibold text-zinc-400 mb-1">
          No grouping property found
        </p>
        <p className="text-[11px] max-w-[280px]">
          Create a Select property column in the Table view first to group your Kanban cards.
        </p>
      </div>
    )
  }

  const otherColumns = columns.filter((col) => col.id !== groupByColumn.id)

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex space-x-4 overflow-x-auto pb-4 select-none items-start min-h-[500px]">
        {boardColumns.map((colName) => {
          const columnRows = groupedRows.get(colName) || []

          return (
            <div
              key={colName}
              className="flex flex-col w-72 bg-zinc-950/20 border border-zinc-900 rounded-xl p-3.5 flex-shrink-0"
            >
              {/* Column Header */}
              <div className="flex items-center space-x-2 pb-3 mb-2 border-b border-zinc-900/60 justify-between">
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold truncate capitalize tracking-wide select-none ${
                    colName === "No Status" || colName === "Not started"
                      ? "bg-zinc-800 text-zinc-300"
                      : colName === "In progress"
                      ? "bg-blue-950/40 text-blue-300 border border-blue-900/30"
                      : "bg-green-950/40 text-green-300 border border-green-900/30"
                  }`}>
                    {colName}
                  </span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-zinc-500">
                  {columnRows.length}
                </span>
              </div>

              {/* Cards List Wrapper */}
              <DroppableColumn id={colName}>
                {columnRows.map((row) => (
                  <BoardCard
                    dbId={dbId}
                    key={row.id}
                    row={row}
                    groupByColumn={groupByColumn}
                    otherColumns={otherColumns}
                    onClick={() => onRowClick(row.id)}
                    onMutateDatabase={onMutate}
                  />
                ))}
                
                {/* + New page button inside column */}
                <button
                  type="button"
                  onClick={() => handleAddNewPageInColumn(colName)}
                  className="w-full text-left py-2 px-3 hover:bg-zinc-850/50 text-zinc-500 hover:text-zinc-350 text-[11px] font-semibold rounded-xl border border-dashed border-zinc-850 hover:border-zinc-700 transition cursor-pointer"
                >
                  + New page
                </button>
              </DroppableColumn>
            </div>
          )
        })}
      </div>
    </DndContext>
  )
}
