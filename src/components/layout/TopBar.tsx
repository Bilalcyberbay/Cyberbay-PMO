"use client"

import React from "react"
import { useParams, usePathname } from "next/navigation"
import useSWR from "swr"
import { Menu, ChevronRight, Share2, Globe, Star, Cloud, CloudLightning, Loader2 } from "lucide-react"
import { useSidebarStore } from "@/store/sidebarStore"
import { useEditorStore } from "@/store/editorStore"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface PageNode {
  id: string
  title: string
  icon: string | null
  parentId: string | null
  isDatabase: boolean
  children: PageNode[]
}

function findPagePath(pages: PageNode[], targetId: string, path: PageNode[] = []): PageNode[] | null {
  for (const page of pages) {
    if (page.id === targetId) {
      return [...path, page]
    }
    if (page.children && page.children.length > 0) {
      const result = findPagePath(page.children, targetId, [...path, page])
      if (result) return result
    }
  }
  return null
}

export default function TopBar() {
  const params = useParams()
  const pathname = usePathname()
  const { isCollapsed, toggleCollapse } = useSidebarStore()
  const { saveStatus } = useEditorStore()

  // SWR automatically uses cached pages list
  const { data: pages } = useSWR<PageNode[]>("/api/pages", fetcher)

  // Find active id (could be pageId or databaseId)
  const activeId = (params?.pageId || params?.databaseId) as string
  
  const pagePath = pages && activeId ? findPagePath(pages, activeId) : null

  return (
    <header className="h-11 border-b border-zinc-800/40 bg-[#191919] flex items-center justify-between px-4 flex-shrink-0 z-20">
      
      {/* Left side: Toggle & Breadcrumbs */}
      <div className="flex items-center space-x-2 min-w-0">
        {isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="h-7 w-7 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition duration-150 mr-1"
            title="Expand sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        {/* Breadcrumb Trail */}
        <div className="flex items-center space-x-1.5 text-xs text-zinc-400 truncate">
          <span className="hover:text-zinc-100 cursor-pointer">Workspace</span>
          
          {pagePath && pagePath.map((node) => (
            <React.Fragment key={node.id}>
              <ChevronRight className="h-3 w-3 text-zinc-600 flex-shrink-0" />
              <span className="hover:text-zinc-100 cursor-pointer truncate flex items-center space-x-1">
                {node.icon && <span className="mr-0.5">{node.icon}</span>}
                <span className="truncate">{node.title}</span>
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right side: Share and favorites stubs */}
      <div className="flex items-center space-x-1.5 flex-shrink-0">
        
        {/* Saving Status Indicator */}
        {activeId && (
          <div className="flex items-center space-x-1 text-[11px] text-zinc-500 mr-2 select-none">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-purple-400" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Cloud className="h-3 w-3 text-zinc-600" />
                <span>Saved</span>
              </>
            )}
            {saveStatus === "error" && (
              <>
                <CloudLightning className="h-3 w-3 text-red-400 animate-pulse" />
                <span className="text-red-400 font-medium">Error</span>
              </>
            )}
          </div>
        )}

        <button
          className="h-7 px-2.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center space-x-1.5 text-xs transition duration-150 font-medium"
          title="Share workspace"
        >
          <Globe className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>

        <button
          className="h-7 w-7 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition duration-150"
          title="Add to Favorites"
        >
          <Star className="h-3.5 w-3.5" />
        </button>
      </div>

    </header>
  )
}
