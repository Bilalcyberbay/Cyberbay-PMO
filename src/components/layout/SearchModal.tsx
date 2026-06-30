"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, FileText, Database, Loader2, CornerDownLeft } from "lucide-react"

interface PageMatch {
  id: string
  title: string
  icon: string | null
  isDatabase: boolean
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<PageMatch[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery("")
      setResults([])
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Debounced search query fetching
  useEffect(() => {
    if (!isOpen) return

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data)
          setSelectedIndex(0)
        }
      } catch (err) {
        console.error("Search error:", err)
      } finally {
        setIsLoading(false)
      }
    }, 150)

    return () => clearTimeout(delayDebounceFn)
  }, [query, isOpen])

  // Keyboard navigation inside list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % Math.max(results.length, 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(results.length, 1))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (results[selectedIndex]) {
          handleSelectResult(results[selectedIndex])
        }
      } else if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, results, selectedIndex])

  const handleSelectResult = (page: PageMatch) => {
    onClose()
    if (page.isDatabase) {
      router.push(`/databases/${page.id}`)
    } else {
      router.push(`/${page.id}`)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 select-none">
      
      {/* Backdrop blur overlay */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer transition-opacity duration-200" 
      />

      {/* Search Box Container */}
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-[0_24px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Input Bar */}
        <div className="flex items-center px-4 border-b border-zinc-800/80">
          <Search className="h-4.5 w-4.5 text-zinc-500 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages and databases..."
            className="w-full py-4 bg-transparent border-none outline-none focus:ring-0 text-sm text-zinc-200 placeholder-zinc-500"
          />
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500 flex-shrink-0" />
          )}
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="py-8 px-4 text-center text-xs text-zinc-500">
              {query.trim() ? "No results found matching query." : "Type to search for pages..."}
            </div>
          ) : (
            <div className="flex flex-col space-y-0.5">
              {results.map((page, index) => {
                const isSelected = index === selectedIndex
                return (
                  <div
                    key={page.id}
                    onClick={() => handleSelectResult(page)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-100 ${
                      isSelected 
                        ? "bg-purple-600/15 border border-purple-600/30 text-zinc-100" 
                        : "border border-transparent hover:bg-zinc-800/40 text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      {/* Icon */}
                      <span className="flex-shrink-0 text-sm">
                        {page.icon ? (
                          <span>{page.icon}</span>
                        ) : page.isDatabase ? (
                          <Database className="h-4 w-4 text-purple-400" />
                        ) : (
                          <FileText className="h-4 w-4 text-zinc-400" />
                        )}
                      </span>
                      {/* Title */}
                      <span className={`text-xs truncate ${isSelected ? "font-bold" : "font-medium"}`}>
                        {page.title || "Untitled"}
                      </span>
                    </div>

                    {/* Hint Key */}
                    {isSelected && (
                      <span className="flex items-center space-x-1 text-[9px] font-semibold text-purple-400 font-mono">
                        <span>Select</span>
                        <CornerDownLeft className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Hint Bar */}
        <div className="px-4 py-2 border-t border-zinc-800/60 bg-zinc-950/40 text-[9px] text-zinc-500 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span>↑↓ Navigate</span>
            <span>Enter Select</span>
            <span>Esc Close</span>
          </div>
        </div>

      </div>

    </div>
  )
}
