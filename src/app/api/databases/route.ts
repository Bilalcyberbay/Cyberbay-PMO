import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ databases: [] })
}

export async function POST() {
  return NextResponse.json({ message: 'Create database endpoint stub' })
}
