"use client"

import React from "react"
import useSWR from "swr"
import dynamic from "next/dynamic"
import PageHeader from "@/components/page/PageHeader"
import PropertyCell from "./PropertyCell"
import { Loader2, X, ChevronRight, Maximize2 } from "lucide-react"
import { useRouter } from "next/navigation"

const BlockEditor = dynamic(() => import("../editor/BlockEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-10 text-xs text-zinc-500">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />
      <span>Loading block editor...</span>
    </div>
  ),
})

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface PropertySchema {
  id: string
  name: string
  type: "title" | "text" | "select" | "date"
  config: any
  position: number
}

interface RowSidePeekProps {
  dbId: string
  rowId: string
  onClose: () => void
  columns: PropertySchema[]
  onMutateDatabase: () => void
}

export default function RowSidePeek({
  dbId,
  rowId,
  onClose,
  columns,
  onMutateDatabase,
}: RowSidePeekProps) {
  const router = useRouter()

  // Fetch row page metadata
  const { data: rowPage, error, mutate: mutateRowPage, isLoading } = useSWR(
    rowId ? `/api/pages/${rowId}` : null,
    fetcher
  )

  const handleOpenAsPage = () => {
    onMutateDatabase()
    router.push(`/${rowId}`)
  }

  const handleClose = () => {
    onMutateDatabase()
    onClose()
  }

  const propertyColumns = columns.filter((col) => col.type !== "title")

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-xs w-full">
        <Loader2 className="h-5 w-5 animate-spin mb-2 text-purple-500" />
        <span>Loading peek details...</span>
      </div>
    )
  }

  if (error || !rowPage) {
    return (
      <div className="text-center py-20 text-xs text-zinc-500 w-full">
        Failed to load record details.
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-full select-none bg-zinc-950/10 rounded-2xl border border-zinc-850 p-4 shadow-sm relative overflow-hidden animate-in slide-in-from-right duration-200">
      
      {/* Top Action Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-850/60 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          {/* Collapse Icon */}
          <button
            onClick={handleClose}
            className="h-7 w-7 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition"
            title="Close peek"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
          
          {/* Open as Page */}
          <button
            onClick={handleOpenAsPage}
            className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-semibold rounded hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition"
            title="Open as full page"
          >
            <Maximize2 className="h-3 w-3" />
            <span>Open as page</span>
          </button>
        </div>

        <button
          onClick={handleClose}
          className="h-7 w-7 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable details view */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        
        {/* Cover + Icon + Title */}
        <PageHeader page={rowPage} onMutate={mutateRowPage} isPeekCompact />

        {/* Properties list sit directly at the top of the editor page */}
        <div className="px-6 space-y-3 pt-2">
          <div className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-2.5 text-xs">
            {propertyColumns.map((col) => {
              const propValObj = rowPage.propertyValues?.find(
                (v: any) => v.propertySchemaId === col.id
              )
              const val = propValObj ? propValObj.value : ""

              return (
                <React.Fragment key={col.id}>
                  {/* Name field */}
                  <span className="text-zinc-500 font-medium flex items-center py-1 truncate">
                    {col.name}
                  </span>
                  
                  {/* Cell field */}
                  <div className="hover:bg-zinc-800/40 rounded transition px-1 py-0.5 border border-transparent hover:border-zinc-850">
                    <PropertyCell
                      dbId={dbId}
                      rowId={rowId}
                      column={col}
                      value={val}
                      onMutate={mutateRowPage}
                    />
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        </div>

        <div className="h-[1px] bg-zinc-850/60 mx-6 my-4" />

        {/* Blocks Editor */}
        <div className="px-6">
          <BlockEditor key={rowId} pageId={rowId} />
        </div>

      </div>

    </div>
  )
}
