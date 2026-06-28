"use client"

import React, { useState } from "react"
import { signInAction, signUpAction } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (isSignUp && password !== confirmPassword) {
      setError("Passwords do not match.")
      setIsLoading(false)
      return
    }

    try {
      let result
      if (isSignUp) {
        result = await signUpAction(email, name, password)
      } else {
        result = await signInAction(email, password)
      }

      if (result?.error) {
        setError(result.error)
      } else {
        router.push("/")
        router.refresh()
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#191919] px-6 text-zinc-100 selection:bg-zinc-800">
      <div className="w-full max-w-[320px] flex flex-col space-y-6">
        
        {/* Logo and Branding (Clean Notion style) */}
        <div className="flex flex-col items-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded bg-zinc-800">
            <svg
              className="h-8 w-8 text-purple-400"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="notion-cyber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="35"
                stroke="url(#notion-cyber-grad)"
                strokeWidth="10"
              />
              <path
                d="M40 50L60 50"
                stroke="url(#notion-cyber-grad)"
                strokeWidth="10"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {isSignUp ? "Sign up" : "Log in"}
          </h1>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          {error && (
            <div className="rounded border border-red-900/30 bg-red-950/20 px-3 py-2 text-center text-xs font-medium text-red-400">
              {error}
            </div>
          )}

          {isSignUp && (
            <div className="flex flex-col space-y-1">
              <label htmlFor="name" className="text-[11px] font-medium text-zinc-400">
                Full name
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter your name..."
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="w-full rounded border border-zinc-800 bg-[#202020] px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 transition focus:border-zinc-700 focus:outline-none"
              />
            </div>
          )}

          <div className="flex flex-col space-y-1">
            <label htmlFor="email" className="text-[11px] font-medium text-zinc-400">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email address..."
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full rounded border border-zinc-800 bg-[#202020] px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 transition focus:border-zinc-700 focus:outline-none"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <label htmlFor="password" className="text-[11px] font-medium text-zinc-400">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password..."
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full rounded border border-zinc-800 bg-[#202020] px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 transition focus:border-zinc-700 focus:outline-none"
            />
          </div>

          {isSignUp && (
            <div className="flex flex-col space-y-1">
              <label htmlFor="confirmPassword" className="text-[11px] font-medium text-zinc-400">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password..."
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="w-full rounded border border-zinc-800 bg-[#202020] px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 transition focus:border-zinc-700 focus:outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded bg-purple-600 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSignUp ? "Creating account..." : "Signing in..."}
              </>
            ) : (
              isSignUp ? "Sign up" : "Log in"
            )}
          </button>
        </form>

        <div className="h-[1px] w-full bg-zinc-800 my-2" />

        {/* Toggle Option */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setEmail("")
              setPassword("")
              setConfirmPassword("")
              setName("")
            }}
            disabled={isLoading}
            className="text-[12px] text-zinc-400 transition hover:text-white underline underline-offset-4"
          >
            {isSignUp ? "Already have an account? Log in" : "New to Cyberpay? Sign up"}
          </button>
        </div>

      </div>
    </div>
  )
}
