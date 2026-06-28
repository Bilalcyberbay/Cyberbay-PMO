import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

interface RouteParams {
  params: Promise<{
    pageId: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { pageId } = await params
    const blocks = await prisma.block.findMany({
      where: {
        pageId,
        inTrash: false,
      },
      orderBy: {
        position: "asc",
      },
    })

    return NextResponse.json(blocks)
  } catch (error: any) {
    console.error("GET /api/blocks/[pageId] error:", error)
    return new NextResponse("Database Error", { status: 500 })
  }
}
