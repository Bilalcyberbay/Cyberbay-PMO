"use client"

import React, { useState, useEffect } from "react"
import useSWR from "swr"
import { useTheme } from "next-themes"
import { useEditorStore } from "@/store/editorStore"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Settings, User, Shield, Sun, Moon, Monitor, Loader2 } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface WorkspaceMember {
  id: string
  role: string
  user: {
    name: string | null
    email: string
  }
}

interface Workspace {
  id: string
  name: string
  members: WorkspaceMember[]
}

interface SettingsDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function SettingsDialog({ open: controlledOpen, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme()
  const { setSaveStatus } = useEditorStore()
  
  const [localOpen, setLocalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : localOpen
  const setIsOpen = isControlled ? onOpenChange : setLocalOpen

  const [activeTab, setActiveTab] = useState<"account" | "workspace" | "appearance">("account")
  
  // Fetch workspace details
  const { data: workspace, mutate: mutateWorkspace, isLoading } = useSWR<Workspace>(
    isOpen ? "/api/workspace" : null,
    fetcher
  )

  const [workspaceName, setWorkspaceName] = useState("")

  useEffect(() => {
    if (workspace) {
      setWorkspaceName(workspace.name)
    }
  }, [workspace])

  const handleUpdateWorkspaceName = async () => {
    if (!workspaceName.trim() || workspaceName === workspace?.name) return
    setSaveStatus("saving")
    try {
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName.trim() }),
      })

      if (res.ok) {
        setSaveStatus("saved")
        mutateWorkspace()
      } else {
        setSaveStatus("error")
      }
    } catch (err) {
      setSaveStatus("error")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && (
        <DialogTrigger className="flex w-full items-center space-x-2 py-2 px-3 hover:bg-zinc-800/50 text-zinc-400 hover:text-white text-xs font-semibold rounded-lg transition duration-150 text-left select-none cursor-pointer">
          <Settings className="h-4 w-4 text-zinc-455" />
          <span>Settings</span>
        </DialogTrigger>
      )}
      
      {/* sm:max-w-2xl overrides sm:max-w-sm to ensure dialog has correct wide layout */}
      <DialogContent className="bg-zinc-900 border border-zinc-800/80 text-zinc-100 max-w-2xl sm:max-w-2xl p-0 overflow-hidden flex h-[480px] rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left Sidebar Menu */}
        <div className="w-48 bg-zinc-950/20 border-r border-zinc-800/60 p-4 flex flex-col space-y-1 select-none">
          <div className="flex items-center space-x-1.5 px-2.5 pb-3 mb-3 border-b border-zinc-800/40">
            <Settings className="h-4 w-4 text-purple-400" />
            <h3 className="text-xs font-bold text-zinc-200">
              Settings
            </h3>
          </div>
          
          <button
            onClick={() => setActiveTab("account")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold text-left transition cursor-pointer ${
              activeTab === "account" ? "bg-zinc-800/60 text-white shadow-sm" : "text-zinc-400 hover:text-white hover:bg-zinc-850/40"
            }`}
          >
            <User className="h-4 w-4 text-zinc-500" />
            <span>My Account</span>
          </button>

          <button
            onClick={() => setActiveTab("workspace")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold text-left transition cursor-pointer ${
              activeTab === "workspace" ? "bg-zinc-800/60 text-white shadow-sm" : "text-zinc-400 hover:text-white hover:bg-zinc-850/40"
            }`}
          >
            <Shield className="h-4 w-4 text-zinc-500" />
            <span>Workspace</span>
          </button>

          <button
            onClick={() => setActiveTab("appearance")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold text-left transition cursor-pointer ${
              activeTab === "appearance" ? "bg-zinc-800/60 text-white shadow-sm" : "text-zinc-400 hover:text-white hover:bg-zinc-850/40"
            }`}
          >
            <Sun className="h-4 w-4 text-zinc-500" />
            <span>Appearance</span>
          </button>
        </div>

        {/* Right Content Panel - Wrapped in ScrollArea to provide premium custom scrollbars */}
        <ScrollArea className="flex-1 h-[480px]">
          <div className="p-6">
            
            {/* Tab: Account Settings */}
            {activeTab === "account" && workspace && (
              <div className="space-y-6 animate-in fade-in duration-100">
                <div className="border-b border-zinc-800/60 pb-3">
                  <h2 className="text-sm font-bold text-white mb-1">My Account</h2>
                  <p className="text-[11px] text-zinc-500">Manage your profile details.</p>
                </div>
                <div className="border border-zinc-800/50 bg-zinc-950/20 rounded-xl p-5 space-y-4 shadow-sm">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Name</span>
                    <p className="text-xs font-semibold text-zinc-250 mt-1">{workspace.members[0]?.user.name || "Untitled User"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Email</span>
                    <p className="text-xs font-semibold text-zinc-250 mt-1">{workspace.members[0]?.user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Workspace Settings */}
            {activeTab === "workspace" && (
              <div className="space-y-6 animate-in fade-in duration-100">
                <div className="border-b border-zinc-800/60 pb-3">
                  <h2 className="text-sm font-bold text-white mb-1">Workspace Settings</h2>
                  <p className="text-[11px] text-zinc-500">Configure your workspace properties and members list.</p>
                </div>

                {isLoading && (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-500 mr-2" />
                    <span className="text-xs text-zinc-500">Loading details...</span>
                  </div>
                )}

                {!isLoading && workspace && (
                  <div className="space-y-5">
                    {/* Rename Form */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Workspace Name
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          value={workspaceName}
                          onChange={(e) => setWorkspaceName(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 focus:border-zinc-700 focus:ring-0 text-xs py-1.5 focus:outline-none flex-1"
                        />
                        <Button
                          onClick={handleUpdateWorkspaceName}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4 cursor-pointer"
                        >
                          Save
                        </Button>
                      </div>
                    </div>

                    {/* Members list */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Members ({workspace.members.length})
                      </span>
                      <div className="border border-zinc-800/60 bg-zinc-950/20 rounded-xl divide-y divide-zinc-800/50 overflow-hidden shadow-sm">
                        {workspace.members.map((member) => (
                          <div key={member.id} className="p-3 flex items-center justify-between text-xs hover:bg-zinc-900/40">
                            <div>
                              <p className="font-semibold text-zinc-200">{member.user.name || "Guest Member"}</p>
                              <p className="text-[10px] text-zinc-500">{member.user.email}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-semibold capitalize ${
                              member.role === "owner" 
                                ? "bg-purple-950/30 text-purple-300 border-purple-900/30" 
                                : "bg-zinc-800 text-zinc-455 border-zinc-750"
                            }`}>
                              {member.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Appearance Settings */}
            {activeTab === "appearance" && (
              <div className="space-y-6 animate-in fade-in duration-100">
                <div className="border-b border-zinc-800/60 pb-3">
                  <h2 className="text-sm font-bold text-white mb-1">Appearance</h2>
                  <p className="text-[11px] text-zinc-500">Customize the application display theme.</p>
                </div>

                <div className="border border-zinc-805 bg-zinc-950/20 rounded-xl p-5 space-y-4 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Select Theme
                  </span>
                  
                  <div className="grid grid-cols-3 gap-2 select-none">
                    <button
                      onClick={() => setTheme("light")}
                      className={`flex flex-col items-center space-y-1.5 p-3 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                        theme === "light"
                          ? "bg-zinc-800 border-purple-500 text-white shadow-md"
                          : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Sun className="h-5 w-5" />
                      <span>Light</span>
                    </button>

                    <button
                      onClick={() => setTheme("dark")}
                      className={`flex flex-col items-center space-y-1.5 p-3 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                        theme === "dark"
                          ? "bg-zinc-800 border-purple-500 text-white shadow-md"
                          : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Moon className="h-5 w-5" />
                      <span>Dark</span>
                    </button>

                    <button
                      onClick={() => setTheme("system")}
                      className={`flex flex-col items-center space-y-1.5 p-3 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                        theme === "system"
                          ? "bg-zinc-800 border-purple-500 text-white shadow-md"
                          : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Monitor className="h-5 w-5" />
                      <span>System</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
