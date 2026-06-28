import React from "react"
import { getSessionUser } from "@/lib/auth"
import { BookOpen, Sparkles, PlusCircle } from "lucide-react"

export default async function WorkspaceDashboard() {
  const user = await getSessionUser()

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-zinc-100 px-6 select-none">
      <div className="max-w-[480px] w-full text-center space-y-6">
        
        {/* Welcome branding icon */}
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 border border-zinc-700/60 shadow-lg text-purple-400">
          <Sparkles className="h-8 w-8" />
        </div>

        {/* Dynamic Greeting */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Welcome, {user?.name || "Guest"}!
          </h1>
          <p className="text-sm text-zinc-400">
            Get started by selecting a page in the sidebar or creating a new workspace document.
          </p>
        </div>

        {/* Suggestion block */}
        <div className="border border-zinc-850 bg-zinc-900/30 rounded-xl p-5 text-left text-xs space-y-3 text-zinc-400">
          <div className="flex items-center space-x-2 text-zinc-200 font-semibold text-xs uppercase tracking-wider">
            <BookOpen className="h-4 w-4 text-purple-400" />
            <span>Getting Started Checklist</span>
          </div>
          <p>
            • Click the <span className="text-white font-medium">"+"</span> icon in the sidebar to create your first page.
          </p>
          <p>
            • Open a page and write using the Notion block system (type <span className="text-white font-medium font-mono bg-zinc-950 px-1 py-0.5 rounded">/</span> for blocks).
          </p>
          <p>
            • Changes are automatically backed up to your Neon cloud database.
          </p>
        </div>

      </div>
    </div>
  )
}
