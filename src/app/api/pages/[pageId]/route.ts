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
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: {
        blocks: {
          orderBy: { position: "asc" },
        },
      },
    })

    if (!page) {
      return new NextResponse("Page not found", { status: 404 })
    }

    return NextResponse.json(page)
  } catch (error: any) {
    console.error("GET /api/pages/[pageId] error:", error)
    return new NextResponse("Database Error", { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { pageId } = await params
    const body = await request.json()
    const { title, icon, cover, parentId, inTrash } = body

    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: {
        ...(title !== undefined && { title }),
        ...(icon !== undefined && { icon }),
        ...(cover !== undefined && { cover }),
        ...(parentId !== undefined && { parentId }),
        ...(inTrash !== undefined && { inTrash }),
      },
    })

    return NextResponse.json(updatedPage)
  } catch (error: any) {
    console.error("PATCH /api/pages/[pageId] error:", error)
    return new NextResponse("Database Error", { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { pageId } = await params
    
    // Soft delete: move to trash
    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: { inTrash: true },
    })

    return NextResponse.json(updatedPage)
  } catch (error: any) {
    console.error("DELETE /api/pages/[pageId] error:", error)
    return new NextResponse("Database Error", { status: 500 })
  }
}
