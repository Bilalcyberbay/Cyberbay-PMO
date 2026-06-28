import React from 'react'

interface DatabasePageProps {
  params: Promise<{
    databaseId: string
  }>
}

export default async function DatabasePage({ params }: DatabasePageProps) {
  const { databaseId } = await params
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">Database View</h1>
      <p className="text-zinc-400">Database ID: {databaseId}</p>
    </div>
  )
}
