"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Users, Loader2, Link, Copy, Check } from "lucide-react"

interface InviteDialogProps {
  workspaceId: string
  isOpen: boolean
  onClose: () => void
}

export default function InviteDialog({ workspaceId, isOpen, onClose }: InviteDialogProps) {
  const [emailInput, setEmailInput] = useState("")
  const [role, setRole] = useState("member") // member, owner
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ status: string; link?: string; previewUrl?: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput.trim()) return

    setIsSubmitting(false)
    setInviteResult(null)
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput.trim(),
          role,
          message,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const inviteLink = `${window.location.origin}/accept-invite?token=${data.token}`
        setInviteResult({
          status: data.status,
          link: inviteLink,
          previewUrl: data.previewUrl || undefined,
        })
      } else {
        const txt = await res.text()
        alert(txt || "Failed to send invitation.")
      }
    } catch (err) {
      console.error(err)
      alert("Failed to send invitation. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyLink = () => {
    if (!inviteResult?.link) return
    navigator.clipboard.writeText(inviteResult.link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    setEmailInput("")
    setMessage("")
    setInviteResult(null)
    setCopied(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleReset}>
      <DialogContent className="bg-zinc-900 border border-zinc-800/80 text-zinc-100 max-w-md p-6 select-none shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200">
        <DialogHeader className="space-y-1">
          <div className="flex items-center space-x-2.5 pb-2 mb-1 border-b border-zinc-800/40">
            <div className="h-8 w-8 rounded-lg bg-zinc-800/50 text-zinc-400 flex items-center justify-center flex-shrink-0">
              <Users className="h-4.5 w-4.5 text-purple-400" />
            </div>
            <DialogTitle className="text-sm font-bold text-zinc-100">Add members</DialogTitle>
          </div>
          <p className="text-[11px] text-zinc-500 pt-1">
            Type or paste in emails below, separated by commas
          </p>
        </DialogHeader>

        {inviteResult ? (
          /* Invite Success/Result display */
          <div className="py-2 space-y-4">
            <div className="bg-zinc-950/20 border border-zinc-800/50 rounded-xl p-4 text-center space-y-3">
              <div className="h-10 w-10 mx-auto rounded-full bg-green-950/40 text-green-400 flex items-center justify-center border border-green-900/30">
                {copied ? <Check className="h-5 w-5" /> : <Link className="h-5 w-5" />}
              </div>
              <h3 className="text-xs font-bold text-zinc-200">
                {inviteResult.status === "added" 
                  ? "User Added Directly!" 
                  : "Invitation Created Successfully!"}
              </h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                {inviteResult.status === "added"
                  ? "The email belongs to an existing user and they were added to the workspace directly."
                  : "This email does not have an account yet. Share this invite link with them to complete their registration:"}
              </p>
              
              {inviteResult.link && (
                <div className="flex items-center space-x-1.5 mt-2 bg-zinc-950 border border-zinc-850 rounded-lg p-1.5 pl-3">
                  <span className="text-[10px] text-purple-400 truncate flex-1 text-left font-mono">
                    {inviteResult.link}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="h-7 w-7 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition cursor-pointer"
                    title="Copy invite link"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              )}

              {inviteResult.previewUrl && (
                <div className="pt-2">
                  <a
                    href={inviteResult.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center space-x-1.5 py-2 px-3 bg-purple-650 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition text-center cursor-pointer"
                  >
                    <span>Preview Sent Email (Ethereal)</span>
                  </a>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <button
                onClick={handleReset}
                className="w-full py-2 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-750 text-zinc-300 transition cursor-pointer"
              >
                Close
              </button>
            </DialogFooter>
          </div>
        ) : (
          /* Invite form details */
          <form onSubmit={handleSendInvite} className="space-y-4 pt-2">
            
            {/* Search names or emails */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Email address
              </label>
              <input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                placeholder="Search names or emails..."
                className="w-full bg-zinc-950 border border-zinc-800/80 focus:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-250 focus:outline-none"
              />
            </div>

            {/* Select Role */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Select role
              </label>
              <div className="border border-zinc-800/60 rounded-xl p-3.5 bg-zinc-950/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300">Workspace Member</span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800/80 rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:outline-none"
                  >
                    <option value="member">Workspace member</option>
                    <option value="owner">Workspace owner</option>
                  </select>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed mt-0.5">
                  {role === "owner" 
                    ? "Can change workspace settings and invite new members to the workspace."
                    : "Can view and edit workspace pages, blocks, and databases."}
                </p>
              </div>
            </div>

            {/* Message textarea */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Message (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a note to your invite..."
                className="w-full h-20 resize-none bg-zinc-950 border border-zinc-800/80 focus:border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-250 focus:outline-none"
              />
            </div>

            {/* Actions */}
            <DialogFooter className="flex space-x-2 pt-3 border-t border-zinc-800/40 justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="py-2 px-4 text-xs font-semibold rounded-lg hover:bg-zinc-800/40 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !emailInput.trim()}
                className="py-2 px-5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer shadow-md"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span>Send invite</span>
                )}
              </button>
            </DialogFooter>

          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
