import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

interface PageNode {
  id: string
  title: string
  icon: string | null
  parentId: string | null
  isDatabase: boolean
  children: PageNode[]
}

function buildTree(pages: any[], parentId: string | null = null): PageNode[] {
  return pages
    .filter((page) => page.parentId === parentId)
    .map((page) => ({
      id: page.id,
      title: page.title,
      icon: page.icon,
      parentId: page.parentId,
      isDatabase: page.isDatabase,
      children: buildTree(pages, page.id),
    }))
}

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
    })

    if (!membership) {
      return NextResponse.json([])
    }

    const pages = await prisma.page.findMany({
      where: {
        workspaceId: membership.workspaceId,
        inTrash: false,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    const pageTree = buildTree(pages, null)
    return NextResponse.json(pageTree)
  } catch (error: any) {
    console.error("GET /api/pages error:", error)
    return new NextResponse("Database Error", { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { title, parentId, isDatabase } = await request.json()

    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
    })

    if (!membership) {
      return new NextResponse("No active workspace found", { status: 404 })
    }

    const newPage = await prisma.page.create({
      data: {
        title: title || "Untitled",
        parentId: parentId || null,
        isDatabase: isDatabase || false,
        workspaceId: membership.workspaceId,
        createdById: user.id,
      },
    })

    return NextResponse.json(newPage)
  } catch (error: any) {
    console.error("POST /api/pages error:", error)
    return new NextResponse("Database Error", { status: 500 })
  }
}
