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
    const { name, type } = await request.json()

    if (!name || !type) {
      return new NextResponse("Missing name or type", { status: 400 })
    }

    // Find database schema parent
    const db = await prisma.notionDatabase.findUnique({
      where: { pageId: dbId },
      include: { dataSources: true },
    })

    if (!db || db.dataSources.length === 0) {
      return new NextResponse("Database schema not initialized", { status: 400 })
    }

    const dataSourceId = db.dataSources[0].id

    // Find position order
    const lastProperty = await prisma.propertySchema.findFirst({
      where: { dataSourceId },
      orderBy: { position: "desc" },
    })

    const position = lastProperty ? lastProperty.position + 1 : 0

    const newProperty = await prisma.propertySchema.create({
      data: {
        name,
        type,
        position,
        dataSourceId,
        config: type === "select" ? {
          groups: [
            { name: "To-do", color: "zinc", options: ["Not started"] },
            { name: "In progress", color: "blue", options: ["In progress"] },
            { name: "Complete", color: "green", options: ["Done"] }
          ]
        } : {},
      },
    })

    return NextResponse.json(newProperty)
  } catch (error: any) {
    console.error("POST /api/databases/[dbId]/columns error:", error)
    return new NextResponse("Database Error", { status: 500 })
  }
}
