"use client"

import React from "react"
import { Table, Kanban, Image as ImageIcon } from "lucide-react"

export type ViewType = "table" | "board"

interface ViewSwitcherProps {
  activeView: ViewType
  onChange: (view: ViewType) => void
}

export default function ViewSwitcher({ activeView, onChange }: ViewSwitcherProps) {
  return (
    <div className="flex items-center space-x-1 border-b border-zinc-850 pb-3 mb-6 select-none">
      <button
        type="button"
        onClick={() => onChange("table")}
        className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
          activeView === "table"
            ? "bg-zinc-800 text-zinc-100"
            : "text-zinc-450 hover:text-zinc-200 hover:bg-zinc-900/30"
        }`}
      >
        <Table className="h-3.5 w-3.5" />
        <span>Table</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("board")}
        className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
          activeView === "board"
            ? "bg-zinc-800 text-zinc-100"
            : "text-zinc-450 hover:text-zinc-200 hover:bg-zinc-900/30"
        }`}
      >
        <Kanban className="h-3.5 w-3.5" />
        <span>Board</span>
      </button>

      <button
        type="button"
        disabled
        className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-600 cursor-not-allowed opacity-50"
      >
        <ImageIcon className="h-3.5 w-3.5" />
        <span>Gallery</span>
      </button>
    </div>
  )
}
