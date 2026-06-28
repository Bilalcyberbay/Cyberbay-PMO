"use client"

import React, { use } from "react"
import useSWR from "swr"
import PageHeader from "@/components/page/PageHeader"
import { Loader2 } from "lucide-react"
import dynamic from "next/dynamic"

const BlockEditor = dynamic(() => import("@/components/editor/BlockEditor"), {
  ssr: false,
  loading: () => (
    <div className="max-w-[720px] mx-auto px-14 py-10 flex flex-col space-y-4">
      <div className="h-6 w-3/4 rounded bg-zinc-800/40 animate-pulse" />
      <div className="h-4 w-full rounded bg-zinc-800/40 animate-pulse" />
      <div className="h-4 w-5/6 rounded bg-zinc-800/40 animate-pulse" />
    </div>
  ),
})

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface PageProps {
  params: Promise<{
    pageId: string
  }>
}

export default function PageEditor({ params }: PageProps) {
  const { pageId } = use(params)

  // Fetch page metadata (SWR)
  const { data: page, error, mutate, isLoading } = useSWR(`/api/pages/${pageId}`, fetcher)

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center text-zinc-500 text-xs">
        <Loader2 className="h-6 w-6 animate-spin mb-2 text-purple-500" />
        <span>Loading page content...</span>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center text-zinc-400 text-xs">
        Failed to load page. It may have been deleted.
      </div>
    )
  }

  return (
    <div className="w-full min-h-full flex flex-col bg-[#191919]">
      {/* Page Header (Cover image, Icon, and Title) */}
      <PageHeader page={page} onMutate={mutate} />
      
      {/* Rich Text Editor */}
      <BlockEditor key={pageId} pageId={pageId} />
    </div>
  )
}
