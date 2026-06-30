"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Sparkles, Loader2, CheckCircle2, User, Lock, AlertTriangle } from "lucide-react"

function AcceptInviteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [workspaceName, setWorkspaceName] = useState("")

  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Verify token on load
  useEffect(() => {
    if (!token) {
      setError("Invitation token is missing. Please check your invitation email link.")
      setLoading(false)
      return
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/workspaces/invite/verify?token=${token}`)
        if (res.ok) {
          const data = await res.json()
          setEmail(data.email)
          setWorkspaceName(data.workspaceName)
        } else {
          const txt = await res.text()
          setError(txt || "This invitation token is invalid or has expired.")
        }
      } catch (err) {
        setError("Failed to verify invitation link. Please check your internet connection.")
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !password) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/workspaces/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: name.trim(),
          password,
        }),
      })

      if (res.ok) {
        setIsSuccess(true)
        setTimeout(() => {
          router.push("/login")
        }, 1500)
      } else {
        const txt = await res.text()
        alert(txt || "Failed to accept invitation. Please try again.")
      }
    } catch (err) {
      console.error(err)
      alert("Failed to accept invitation. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#191919] text-zinc-400 text-xs">
        <Loader2 className="h-6 w-6 animate-spin mb-3 text-purple-500" />
        <span>Verifying your workspace invitation...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-[#191919] p-4">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center shadow-lg space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-950/40 border border-red-900/50 flex items-center justify-center text-red-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-sm font-bold text-zinc-100">Invalid Invitation Link</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">{error}</p>
          <div className="pt-2">
            <button
              onClick={() => router.push("/login")}
              className="w-full py-2.5 text-xs font-semibold rounded-lg bg-zinc-850 hover:bg-zinc-800 text-zinc-300 transition cursor-pointer"
            >
              Back to Sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#191919] text-center space-y-4">
        <div className="h-14 w-14 rounded-full bg-green-950/40 border border-green-900/50 flex items-center justify-center text-green-400 animate-bounce">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-base font-bold text-zinc-100">Profile Finalized!</h2>
        <p className="text-xs text-zinc-400 max-w-[280px] mx-auto">
          Welcome to {workspaceName}. Redirecting you to login...
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-[#191919] p-4 select-none">
      
      {/* Background Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Accept Invite Box Container */}
      <div className="relative w-full max-w-md bg-zinc-900/40 border border-zinc-850 rounded-2xl p-7 shadow-2xl backdrop-blur-md space-y-6">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="text-base font-bold text-zinc-150 tracking-tight">Join Workspace</h1>
          <p className="text-xs text-zinc-400">
            You've been invited to join <span className="text-purple-400 font-bold">{workspaceName}</span>
          </p>
        </div>

        {/* Input fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email (Disabled, prefilled) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full bg-zinc-950/40 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-zinc-500 outline-none cursor-not-allowed"
            />
          </div>

          {/* Full name input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Your Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your name"
                className="w-full bg-zinc-950 border border-zinc-850 focus:border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 outline-none focus:ring-0"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Create Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Create password"
                className="w-full bg-zinc-950 border border-zinc-850 focus:border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 outline-none focus:ring-0"
              />
            </div>
          </div>

          {/* Join trigger */}
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !password}
            className="w-full mt-2 flex items-center justify-center py-2.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span>Accept Invite & Join</span>
            )}
          </button>

        </form>

      </div>

    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#191919] text-zinc-400 text-xs">
        <Loader2 className="h-6 w-6 animate-spin mb-3 text-purple-500" />
        <span>Loading...</span>
      </div>
    }>
      <AcceptInviteForm />
    </Suspense>
  )
}
