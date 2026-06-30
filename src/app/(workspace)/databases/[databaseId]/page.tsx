"use client"

import React, { use, useState } from "react"
import useSWR from "swr"
import PageHeader from "@/components/page/PageHeader"
import ViewSwitcher, { ViewType } from "@/components/database/ViewSwitcher"
import TableView from "@/components/database/TableView"
import DatabaseBoardView from "@/components/database/DatabaseBoardView"
import RowSidePeek from "@/components/database/RowSidePeek"
import EditPropertyPanel from "@/components/database/EditPropertyPanel"
import { Loader2, SlidersHorizontal } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface DatabasePageProps {
  params: Promise<{
    databaseId: string
  }>
}

export default function DatabasePage({ params }: DatabasePageProps) {
  const { databaseId } = use(params)
  const [activeView, setActiveView] = useState<ViewType>("table")
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)

  const { data: dbData, error, mutate, isLoading } = useSWR(`/api/databases/${databaseId}`, fetcher)

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center text-zinc-500 text-xs">
        <Loader2 className="h-6 w-6 animate-spin mb-2 text-purple-500" />
        <span>Loading database view...</span>
      </div>
    )
  }

  if (error || !dbData) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center text-zinc-400 text-xs">
        Failed to load database. It may have been deleted.
      </div>
    )
  }

  const { page, rows } = dbData
  const columns = page.database?.dataSources[0]?.properties || []
  const selectColumnId = columns.find((c: any) => c.type === "select")?.id

  const handleEditColumnSettings = (colId: string) => {
    setSelectedRowId(null)
    setEditingColumnId(colId)
  }

  const handleOpenRowDetails = (rowId: string) => {
    setEditingColumnId(null)
    setSelectedRowId(rowId)
  }

  return (
    <div className="w-full min-h-full flex flex-col bg-[#191919]">
      {/* Page Header (Cover photo, emoji icon, and title) */}
      <PageHeader page={page} onMutate={mutate} />
      
      {/* Tab Switcher & Data Views Container */}
      <div className={`w-full mx-auto pb-32 transition-all duration-300 ${
        (selectedRowId || editingColumnId) ? "px-6 max-w-none" : "max-w-[1000px] px-14"
      }`}>
        
        {/* View Switcher next to a Settings Gear button */}
        <div className="flex items-center justify-between border-b border-zinc-850 pb-3 mb-6 select-none">
          <ViewSwitcher activeView={activeView} onChange={setActiveView} />

          {/* Settings Trigger Icon */}
          {selectColumnId && (
            <button
              onClick={() => handleEditColumnSettings(selectColumnId)}
              className="h-7 px-2.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center space-x-1.5 text-xs font-semibold cursor-pointer transition"
              title="Configure database view settings"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Settings</span>
            </button>
          )}
        </div>

        {/* Side Peek / Split Layout Grid */}
        <div className="flex space-x-6 w-full items-start">
          
          {/* Left View: Table or Board */}
          <div className={`transition-all duration-300 ${
            (selectedRowId || editingColumnId) ? "w-[50%] flex-shrink-0" : "w-full"
          }`}>
            {activeView === "table" ? (
              <TableView
                dbId={databaseId}
                columns={columns}
                rows={rows}
                onMutate={mutate}
                onRowClick={handleOpenRowDetails}
                onEditProperty={handleEditColumnSettings}
              />
            ) : (
              <DatabaseBoardView
                dbId={databaseId}
                columns={columns}
                rows={rows}
                onMutate={mutate}
                onRowClick={handleOpenRowDetails}
              />
            )}
          </div>

          {/* Right View: Side Peek Page Editor Sidebar */}
          {selectedRowId && (
            <div className="flex-1 min-w-[380px] h-[calc(100vh-140px)] sticky top-[70px] overflow-hidden">
              <RowSidePeek
                dbId={databaseId}
                rowId={selectedRowId}
                onClose={() => setSelectedRowId(null)}
                columns={columns}
                onMutateDatabase={mutate}
              />
            </div>
          )}

          {/* Right View: Edit Property Sidebar Panel */}
          {editingColumnId && (
            <div className="flex-1 min-w-[380px] h-[calc(100vh-140px)] sticky top-[70px] overflow-hidden">
              <EditPropertyPanel
                dbId={databaseId}
                columnId={editingColumnId}
                onClose={() => setEditingColumnId(null)}
                onMutateDatabase={mutate}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
