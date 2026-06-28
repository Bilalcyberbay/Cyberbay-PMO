import React from "react"
import Sidebar from "@/components/layout/Sidebar"
import TopBar from "@/components/layout/TopBar"

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#191919] text-zinc-200">
      {/* Sidebar navigation */}
      <Sidebar />
      
      {/* Main content grid */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top bar header */}
        <TopBar />
        
        {/* Page body content */}
        <main className="flex-1 overflow-y-auto bg-[#191919]">
          {children}
        </main>
      </div>
    </div>
  )
}
