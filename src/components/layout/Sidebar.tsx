"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { ChevronLeft, Plus, LogOut, Loader2, Sparkles } from "lucide-react"
import { useSidebarStore } from "@/store/sidebarStore"
import { getSessionUser, signOutAction } from "@/lib/auth"
import SidebarItem from "./SidebarItem"
import { ScrollArea } from "@/components/ui/scroll-area"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface PageNode {
  id: string
  title: string
  icon: string | null
  parentId: string | null
  isDatabase: boolean
  children: PageNode[]
}

interface UserSession {
  id: string
  email: string
  name: string | null
}

export default function Sidebar() {
  const router = useRouter()
  const { isCollapsed, toggleCollapse } = useSidebarStore()
  const [user, setUser] = useState<UserSession | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const { data: pages, error, mutate, isLoading } = useSWR<PageNode[]>("/api/pages", fetcher)

  useEffect(() => {
    getSessionUser().then((sessionUser) => {
      if (sessionUser) {
        setUser(sessionUser)
      }
    })
  }, [])

  const handleCreatePage = async () => {
    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Page",
          isDatabase: false,
        }),
      })

      if (res.ok) {
        const newPage = await res.json()
        mutate()
        router.push(`/${newPage.id}`)
      }
    } catch (err) {
      console.error("Failed to create page:", err)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOutAction()
      router.push("/login")
      router.refresh()
    } catch (err) {
      console.error("Logout error:", err)
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (isCollapsed) return null

  return (
    <aside className="w-60 bg-[#1c1c1c] border-r border-zinc-800/80 flex flex-col h-full flex-shrink-0 animate-in slide-in-from-left duration-200">
      
      {/* Top Header Section */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-800/50">
        <div className="flex items-center space-x-2 min-w-0">
          {/* Avatar Icon */}
          <div className="h-7 w-7 rounded bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-xs font-bold text-white uppercase flex-shrink-0">
            {user?.name ? user.name[0] : "C"}
          </div>
          {/* Workspace Title */}
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-zinc-100 truncate tracking-wide">
              {user?.name ? `${user.name}'s Workspace` : "Workspace"}
            </span>
            <span className="text-[10px] text-zinc-500 truncate">
              {user?.email || "cyberpay.pmo"}
            </span>
          </div>
        </div>

        {/* Collapse Sidebar Button */}
        <button
          onClick={toggleCollapse}
          className="h-6 w-6 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition duration-150"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Pages Middle Section */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            Private Pages
          </span>
          <button
            onClick={handleCreatePage}
            className="text-zinc-500 hover:text-white transition duration-150"
            title="Create new page"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <ScrollArea className="flex-1 px-2 pb-4">
          {isLoading && (
            <div className="flex items-center justify-center py-6 text-zinc-500 text-xs">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Loading pages...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-4 text-xs text-red-400">
              Failed to load pages
            </div>
          )}

          {!isLoading && !error && pages && pages.length === 0 && (
            <div className="text-center py-6 text-[11px] text-zinc-500">
              No pages yet. Create one!
            </div>
          )}

          {!isLoading && pages && pages.length > 0 && (
            <div className="flex flex-col space-y-0.5">
              {pages.map((page) => (
                <SidebarItem key={page.id} node={page} depth={0} onMutate={mutate} />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-zinc-800/50 flex flex-col space-y-1">
        <button
          onClick={handleCreatePage}
          className="flex w-full items-center space-x-2 py-2 px-3 hover:bg-zinc-800/60 text-zinc-400 hover:text-white text-xs rounded transition duration-150"
        >
          <Plus className="h-4 w-4" />
          <span>Add a page</span>
        </button>
        
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center space-x-2 py-2 px-3 hover:bg-red-950/20 hover:text-red-400 text-zinc-500 text-xs rounded transition duration-150 disabled:opacity-50"
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          <span>Sign out</span>
        </button>
      </div>

    </aside>
  )
}
