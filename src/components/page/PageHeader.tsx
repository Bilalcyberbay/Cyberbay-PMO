"use client"

import React, { useState, useEffect, useRef } from "react"
import { Image as ImageIcon, Smile, Trash } from "lucide-react"
import { useEditorStore } from "@/store/editorStore"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface PageData {
  id: string
  title: string
  icon: string | null
  cover: string | null
}

interface PageHeaderProps {
  page: PageData
  onMutate: () => void
}

const POPULAR_EMOJIS = [
  "📝", "🚀", "💡", "🎨", "💼", "💻", "🔑", "🎯",
  "⭐", "🔥", "📅", "📚", "🛠️", "🍀", "🍕", "✈️"
]

const RANDOM_COVERS = [
  "linear-gradient(to right, #833ab4, #fd1d1d, #fcb045)",
  "linear-gradient(to right, #00c6ff, #0072ff)",
  "linear-gradient(to right, #f857a6, #ff5858)",
  "linear-gradient(to right, #11998e, #38ef7d)",
  "linear-gradient(to right, #ffe259, #ffa751)"
]

export default function PageHeader({ page, onMutate }: PageHeaderProps) {
  const { setSaveStatus } = useEditorStore()
  const [title, setTitle] = useState(page.title)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTitle(page.title)
  }, [page.title])

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [title])

  const updatePageData = async (fields: Partial<PageData>) => {
    setSaveStatus("saving")
    try {
      const res = await fetch(`/api/pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      })

      if (res.ok) {
        setSaveStatus("saved")
        onMutate()
      } else {
        setSaveStatus("error")
      }
    } catch (error) {
      setSaveStatus("error")
    }
  }

  const handleTitleBlur = () => {
    if (title.trim() && title !== page.title) {
      updatePageData({ title })
    }
  }

  const handleSelectEmoji = (emoji: string) => {
    updatePageData({ icon: emoji })
  }

  const handleAddCover = () => {
    const randomCover = RANDOM_COVERS[Math.floor(Math.random() * RANDOM_COVERS.length)]
    updatePageData({ cover: randomCover })
  }

  const handleRemoveCover = (e: React.MouseEvent) => {
    e.stopPropagation()
    updatePageData({ cover: null })
  }

  const handleRemoveIcon = (e: React.MouseEvent) => {
    e.stopPropagation()
    updatePageData({ icon: null })
  }

  return (
    <div className="relative group/header w-full pb-6">
      
      {/* Cover Image */}
      <div
        className="relative w-full h-44 overflow-hidden bg-zinc-800 transition duration-200"
        style={{
          backgroundImage: page.cover ? page.cover : "none",
          backgroundColor: page.cover ? "transparent" : "#202020",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        {!page.cover && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/header:opacity-100 transition duration-200">
            <button
              onClick={handleAddCover}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-zinc-900/80 border border-zinc-700/60 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition duration-150"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Add cover</span>
            </button>
          </div>
        )}

        {page.cover && (
          <div className="absolute top-3 right-4 opacity-0 group-hover/header:opacity-100 transition duration-200 flex space-x-2">
            <button
              onClick={handleAddCover}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-zinc-900/80 border border-zinc-700/60 hover:bg-zinc-800 text-[10px] font-semibold text-zinc-300 hover:text-white transition duration-150"
            >
              Change cover
            </button>
            <button
              onClick={handleRemoveCover}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-red-950/80 border border-red-900/60 hover:bg-red-900 text-[10px] font-semibold text-red-300 hover:text-white transition duration-150"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Main Header Form Area */}
      <div className="max-w-[720px] mx-auto px-14 -mt-12 relative z-10 flex flex-col space-y-4">
        
        {/* Page Icon (Emoji) */}
        <div className="flex items-end space-x-2">
          {page.icon ? (
            <div className="relative group/icon h-20 w-20 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-4xl shadow-xl select-none">
              <span>{page.icon}</span>
              <Popover>
                <PopoverTrigger className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover/icon:opacity-100 flex items-center justify-center text-[10px] font-semibold text-zinc-300 transition duration-150 cursor-pointer">
                  Change
                </PopoverTrigger>
                <PopoverContent align="start" className="w-52 bg-zinc-900 border-zinc-800 p-2 text-zinc-300">
                  <div className="grid grid-cols-4 gap-1.5">
                    {POPULAR_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleSelectEmoji(emoji)}
                        className="h-9 w-9 flex items-center justify-center text-xl rounded hover:bg-zinc-800 transition"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <button
                onClick={handleRemoveIcon}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-950 border border-red-900 text-red-400 hover:text-white flex items-center justify-center opacity-0 group-hover/icon:opacity-100 transition duration-150 shadow"
                title="Remove icon"
              >
                <Trash className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="opacity-0 group-hover/header:opacity-100 transition duration-200">
              <Popover>
                <PopoverTrigger className="flex items-center space-x-1 px-2.5 py-1 rounded bg-zinc-900/50 border border-zinc-800/80 hover:bg-zinc-800 text-[10px] font-semibold text-zinc-400 hover:text-zinc-200 transition duration-150">
                  <Smile className="h-3.5 w-3.5 mr-1" />
                  <span>Add icon</span>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-52 bg-zinc-900 border-zinc-800 p-2 text-zinc-300">
                  <div className="grid grid-cols-4 gap-1.5">
                    {POPULAR_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleSelectEmoji(emoji)}
                        className="h-9 w-9 flex items-center justify-center text-xl rounded hover:bg-zinc-800 transition"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Editable Page Title */}
        <textarea
          ref={textareaRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              textareaRef.current?.blur()
            }
          }}
          placeholder="Untitled"
          rows={1}
          className="w-full bg-transparent resize-none text-3xl font-bold text-white placeholder-zinc-700 border-none outline-none focus:ring-0 p-0 leading-tight select-all"
        />

      </div>

    </div>
  )
}
