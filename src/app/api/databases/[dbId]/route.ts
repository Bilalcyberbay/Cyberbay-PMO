import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{
    dbId: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { dbId } = await params
  return NextResponse.json({ dbId, schema: [] })
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { dbId } = await params
  return NextResponse.json({ dbId, message: 'Update database schema stub' })
}
