import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { pageId, type, content, position } = await request.json()

    if (!pageId || !type) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const newBlock = await prisma.block.create({
      data: {
        pageId,
        type,
        content: content || {},
        position: position ?? 0,
      },
    })

    return NextResponse.json(newBlock)
  } catch (error: any) {
    console.error("POST /api/blocks error:", error)
    return new NextResponse("Database Error", { status: 500 })
  }
}
