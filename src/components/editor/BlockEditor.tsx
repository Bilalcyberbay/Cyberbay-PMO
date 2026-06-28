"use client"

import React, { useMemo, useRef, useEffect } from "react"
import useSWR from "swr"
import { useEditorStore } from "@/store/editorStore"
import { BlockNoteView } from "@blocknote/mantine"
import { useCreateBlockNote } from "@blocknote/react"
import { Loader2 } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface BlockEditorProps {
  pageId: string
}

interface FlatBlock {
  id: string
  type: string
  content: any
  position: number
  parentBlockId: string | null
}

function flattenBlocks(blocks: any[], parentBlockId: string | null = null, result: FlatBlock[] = []): FlatBlock[] {
  blocks.forEach((block, index) => {
    result.push({
      id: block.id,
      type: block.type,
      content: {
        props: block.props || {},
        content: block.content || [],
      },
      position: index,
      parentBlockId,
    })
    if (block.children && block.children.length > 0) {
      flattenBlocks(block.children, block.id, result)
    }
  })
  return result
}

// Inner Editor Content Component (initialized only when dbBlocks are loaded)
function BlockEditorContent({
  pageId,
  dbBlocks,
  mutate,
}: {
  pageId: string
  dbBlocks: any[]
  mutate: () => void
}) {
  const { setSaveStatus } = useEditorStore()
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Construct hierarchy from flat database blocks
  const initialContent = useMemo(() => {
    if (dbBlocks && dbBlocks.length > 0) {
      const blockMap = new Map<string, any>()
      const roots: any[] = []

      // Create base block structures
      dbBlocks.forEach((block) => {
        blockMap.set(block.id, {
          id: block.id,
          type: block.type,
          props: block.content?.props || {},
          content: block.content?.content || [],
          children: [],
        })
      })

      // Link parents and children
      dbBlocks.forEach((block) => {
        const mappedBlock = blockMap.get(block.id)
        if (block.parentBlockId && blockMap.has(block.parentBlockId)) {
          blockMap.get(block.parentBlockId).children.push(mappedBlock)
        } else {
          roots.push(mappedBlock)
        }
      })

      return roots
    }
    return [
      {
        type: "paragraph",
        content: [],
      },
    ]
  }, [dbBlocks])

  // Initialize BlockNote editor
  const editor = useCreateBlockNote({
    initialContent,
  })

  const handleEditorChange = () => {
    setSaveStatus("saving")

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const newFlatBlocks = flattenBlocks(editor.document)
        const dbBlockMap = new Map<string, any>()
        dbBlocks.forEach((b) => dbBlockMap.set(b.id, b))

        const newFlatBlockMap = new Map<string, FlatBlock>()
        newFlatBlocks.forEach((b) => newFlatBlockMap.set(b.id, b))

        const promises: Promise<any>[] = []

        // 1. Delete blocks no longer in document list
        dbBlocks.forEach((block) => {
          if (!newFlatBlockMap.has(block.id)) {
            promises.push(
              fetch(`/api/blocks/detail/${block.id}`, {
                method: "DELETE",
              })
            )
          }
        })

        // 2. Create or update blocks
        newFlatBlocks.forEach((block) => {
          const dbBlock = dbBlockMap.get(block.id)
          if (!dbBlock) {
            // Create Block
            promises.push(
              fetch("/api/blocks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  pageId,
                  type: block.type,
                  content: block.content,
                  position: block.position,
                  parentBlockId: block.parentBlockId,
                }),
              })
            )
          } else {
            // Update Block if modified
            const isModified =
              dbBlock.type !== block.type ||
              dbBlock.position !== block.position ||
              dbBlock.parentBlockId !== block.parentBlockId ||
              JSON.stringify(dbBlock.content) !== JSON.stringify(block.content)

            if (isModified) {
              promises.push(
                fetch(`/api/blocks/detail/${block.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    type: block.type,
                    content: block.content,
                    position: block.position,
                    parentBlockId: block.parentBlockId,
                  }),
                })
              )
            }
          }
        })

        await Promise.all(promises)
        setSaveStatus("saved")
        mutate()
      } catch (err) {
        console.error("Autosave sync failed:", err)
        setSaveStatus("error")
      }
    }, 500)
  }

  // Cleanup save timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="w-full text-zinc-100 bg-[#191919]">
      <BlockNoteView
        editor={editor}
        onChange={handleEditorChange}
        theme="dark"
      />
    </div>
  )
}

export default function BlockEditor({ pageId }: BlockEditorProps) {
  const { data: dbBlocks, mutate, isLoading } = useSWR<any[]>(`/api/blocks/${pageId}`, fetcher)

  if (isLoading || !dbBlocks) {
    return (
      <div className="max-w-[720px] mx-auto px-14 py-10 flex flex-col space-y-4">
        <div className="h-6 w-3/4 rounded bg-zinc-800/40 animate-pulse" />
        <div className="h-4 w-full rounded bg-zinc-800/40 animate-pulse" />
        <div className="h-4 w-5/6 rounded bg-zinc-800/40 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-[720px] mx-auto px-14 pb-32">
      <BlockEditorContent pageId={pageId} dbBlocks={dbBlocks} mutate={mutate} />
    </div>
  )
}
