import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

interface RouteParams {
  params: Promise<{
    dbId: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { dbId } = await params

    const parentPage = await prisma.page.findUnique({
      where: { id: dbId },
    })

    if (!parentPage) {
      return new NextResponse("Database page not found", { status: 404 })
    }

    // Create child page representing a new row
    const newRowPage = await prisma.page.create({
      data: {
        title: "",
        parentId: dbId,
        isDatabase: false,
        workspaceId: parentPage.workspaceId,
        createdById: user.id,
      },
    })

    return NextResponse.json(newRowPage)
  } catch (error: any) {
    console.error("POST /api/databases/[dbId]/rows error:", error)
    return new NextResponse("Database Error", { status: 500 })
  }
}
