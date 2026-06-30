"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { ChevronLeft, Plus, LogOut, Loader2, Sparkles, Database, Search, ChevronDown, Settings } from "lucide-react"
import { useSidebarStore } from "@/store/sidebarStore"
import { getSessionUser, signOutAction } from "@/lib/auth"
import SidebarItem from "./SidebarItem"
import SettingsDialog from "./SettingsDialog"
import TrashPanel from "./TrashPanel"
import SearchModal from "./SearchModal"
import InviteDialog from "./InviteDialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  // Fetch page tree and workspace details
  const { data: pages, error, mutate, isLoading } = useSWR<PageNode[]>("/api/pages", fetcher)
  const { data: workspace, mutate: mutateWorkspace } = useSWR<any>("/api/workspace", fetcher)
  const { data: workspaces, mutate: mutateWorkspaces } = useSWR<any[]>("/api/workspaces", fetcher)

  useEffect(() => {
    getSessionUser().then((sessionUser) => {
      if (sessionUser) {
        setUser(sessionUser)
      }
    })
  }, [])

  // Listen for Ctrl+K / Cmd+K global hotkey
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setIsSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [])

  const handleSwitchWorkspace = async (workspaceId: string) => {
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      })
      if (res.ok) {
        await mutateWorkspace()
        await mutate()
        router.refresh()
      }
    } catch (err) {
      console.error("Failed to switch workspace:", err)
    }
  }

  const handleCreateWorkspace = async () => {
    const name = prompt("Enter new workspace name:")
    if (!name || !name.trim()) return

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (res.ok) {
        const newWs = await res.json()
        await mutateWorkspaces()
        await mutateWorkspace()
        await mutate()
        router.push("/")
        router.refresh()
      }
    } catch (err) {
      console.error("Failed to create workspace:", err)
    }
  }

  const handleCreatePage = async () => {
    const tempId = `temp-${Math.random().toString()}`
    const newOptimisticPage: PageNode = {
      id: tempId,
      title: "Untitled Page",
      icon: null,
      parentId: null,
      isDatabase: false,
      children: [],
    }

    const currentPages = pages || []
    mutate([...currentPages, newOptimisticPage], false)

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
        await mutate()
        router.push(`/${newPage.id}`)
      } else {
        mutate()
      }
    } catch (err) {
      console.error("Failed to create page:", err)
      mutate()
    }
  }

  const handleCreateDatabase = async () => {
    const tempId = `temp-${Math.random().toString()}`
    const newOptimisticDb: PageNode = {
      id: tempId,
      title: "Untitled Database",
      icon: "🗄️",
      parentId: null,
      isDatabase: true,
      children: [],
    }

    const currentPages = pages || []
    mutate([...currentPages, newOptimisticDb], false)

    try {
      const res = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Database",
          isDatabase: true,
        }),
      })

      if (res.ok) {
        const newPage = await res.json()
        await mutate()
        router.push(`/databases/${newPage.id}`)
      } else {
        mutate()
      }
    } catch (err) {
      console.error("Failed to create database:", err)
      mutate()
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
      <div className="p-3 flex items-center justify-between border-b border-zinc-850/60">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center space-x-2 min-w-0 text-left outline-none cursor-pointer p-1.5 rounded-lg hover:bg-zinc-800 transition flex-1">
            {/* Avatar Icon */}
            <div className="h-7 w-7 rounded bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-xs font-bold text-white uppercase flex-shrink-0">
              {user?.name ? user.name[0] : "C"}
            </div>
            {/* Workspace Title */}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-zinc-150 truncate tracking-wide flex items-center space-x-1">
                <span className="truncate">{workspace?.name || (user?.name ? `${user.name}'s Workspace` : "Workspace")}</span>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
              </span>
              <span className="text-[10px] text-zinc-500 truncate">
                {user?.email || "cyberpay.pmo"}
              </span>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-56 bg-zinc-900 border-zinc-850 p-1.5 text-zinc-300 shadow-2xl rounded-xl">
            {/* Header / Info */}
            <div className="px-2.5 py-1.5 space-y-0.5">
              <span className="text-xs font-bold text-zinc-150 block truncate">
                {workspace?.name || "Workspace"}
              </span>
              <span className="text-[10px] text-zinc-500 block">
                Free Plan · {workspace?.members?.length || 1} member
              </span>
            </div>

            <DropdownMenuSeparator className="bg-zinc-850 my-1" />

            {/* Menu options */}
            <DropdownMenuItem className="focus:bg-zinc-805/60 focus:text-zinc-100 text-xs font-semibold py-1.5 px-2.5 cursor-pointer rounded-lg transition-colors duration-100 outline-none">
              Upgrade
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => setIsSettingsOpen(true)}
              className="focus:bg-zinc-805/60 focus:text-zinc-100 text-xs font-semibold py-1.5 px-2.5 cursor-pointer rounded-lg transition-colors duration-100 outline-none"
            >
              Settings
            </DropdownMenuItem>
            
            {workspace && (
              <DropdownMenuItem 
                onClick={() => setIsInviteOpen(true)}
                className="focus:bg-zinc-805/60 focus:text-zinc-100 text-xs font-semibold py-1.5 px-2.5 cursor-pointer rounded-lg transition-colors duration-100 outline-none"
              >
                Invite members
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem className="focus:bg-zinc-805/60 focus:text-zinc-100 text-xs font-semibold py-1.5 px-2.5 cursor-pointer rounded-lg transition-colors duration-100 outline-none">
              Add account
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-zinc-850/60 my-1" />

            {/* Workspace list switcher */}
            <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider select-none">
              Account contexts
            </div>
            
            <div className="flex flex-col space-y-0.5 max-h-40 overflow-y-auto">
              {workspaces?.map((ws) => {
                const isActive = ws.id === workspace?.id
                return (
                  <DropdownMenuItem
                    key={ws.id}
                    onClick={() => handleSwitchWorkspace(ws.id)}
                    className={`focus:bg-zinc-805/60 focus:text-zinc-100 text-xs font-semibold py-1.5 px-2.5 cursor-pointer rounded-lg transition-colors duration-100 outline-none flex items-center justify-between mx-1 ${
                      isActive ? "bg-zinc-950/40 border border-zinc-800/40 text-purple-400" : "text-zinc-400"
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    {isActive && <span className="font-bold">✓</span>}
                  </DropdownMenuItem>
                )
              })}

              <DropdownMenuItem
                onClick={handleCreateWorkspace}
                className="focus:bg-zinc-805/60 focus:text-zinc-100 text-xs font-semibold py-1.5 px-2.5 cursor-pointer rounded-lg transition-colors duration-100 outline-none text-purple-400 flex items-center space-x-1.5 mx-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New workspace</span>
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="bg-zinc-850/60 my-1" />

            {/* Log out */}
            <DropdownMenuItem 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="focus:bg-red-950/25 focus:text-red-400 text-xs font-semibold py-1.5 px-2.5 cursor-pointer rounded-lg transition-colors duration-100 outline-none disabled:opacity-50 text-red-500"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Collapse Sidebar Button */}
        <button
          onClick={toggleCollapse}
          className="h-6.5 w-6.5 rounded hover:bg-zinc-805 text-zinc-400 hover:text-white flex items-center justify-center transition duration-150"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Search Action Bar */}
      <div className="px-3 pt-3 pb-1 select-none">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition text-xs font-semibold cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-zinc-500" />
            <span>Search</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-850 text-[9px] font-mono text-zinc-500">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Pages Middle Section */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="px-4 pt-2 pb-2 flex items-center justify-between">
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
          onClick={handleCreateDatabase}
          className="flex w-full items-center space-x-2 py-2 px-3 hover:bg-zinc-800/60 text-zinc-400 hover:text-white text-xs rounded transition duration-150"
        >
          <Database className="h-4 w-4 text-purple-400" />
          <span>Add a database</span>
        </button>

        {/* Settings Dialog Trigger */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex w-full items-center space-x-2 py-2 px-3 hover:bg-zinc-800/60 text-zinc-400 hover:text-white text-xs font-semibold rounded-lg transition duration-155 text-left cursor-pointer"
        >
          <Settings className="h-4 w-4 text-zinc-400" />
          <span>Settings</span>
        </button>

        {/* Trash Panel */}
        <TrashPanel />
      </div>

      {/* Global Dialog Modals */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {workspace && (
        <InviteDialog
          workspaceId={workspace.id}
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
        />
      )}

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

    </aside>
  )
}
