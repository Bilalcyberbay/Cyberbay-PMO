import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

interface RouteParams {
  params: Promise<{
    dbId: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { dbId } = await params

    // Verify page exists and is database
    let page = await prisma.page.findUnique({
      where: { id: dbId },
      include: {
        database: {
          include: {
            dataSources: {
              include: {
                properties: {
                  orderBy: { position: "asc" },
                },
              },
            },
          },
        },
      },
    })

    if (!page) {
      return new NextResponse("Database page not found", { status: 404 })
    }

    if (!page.isDatabase) {
      return new NextResponse("Page is not a database", { status: 400 })
    }

    // Auto-create database schema structures if missing
    if (!page.database) {
      const newDb = await prisma.notionDatabase.create({
        data: {
          pageId: dbId,
        },
      })
      const newDs = await prisma.dataSource.create({
        data: {
          name: "Default Table",
          databaseId: newDb.id,
        },
      })
      // Create default "Name" title column
      await prisma.propertySchema.create({
        data: {
          name: "Name",
          type: "title",
          position: 0,
          dataSourceId: newDs.id,
        },
      })

      // Create default "Status" select column with Notion status config
      await prisma.propertySchema.create({
        data: {
          name: "Status",
          type: "select",
          position: 1,
          dataSourceId: newDs.id,
          config: {
            groups: [
              { name: "To-do", color: "zinc", options: ["Not started"] },
              { name: "In progress", color: "blue", options: ["In progress"] },
              { name: "Complete", color: "green", options: ["Done"] }
            ]
          },
        },
      })

      // Re-fetch page details with schema
      page = await prisma.page.findUnique({
        where: { id: dbId },
        include: {
          database: {
            include: {
              dataSources: {
                include: {
                  properties: {
                    orderBy: { position: "asc" },
                  },
                },
              },
            },
          },
        },
      })
    }

    // Fetch child rows
    const rows = await prisma.page.findMany({
      where: {
        parentId: dbId,
        inTrash: false,
      },
      include: {
        propertyValues: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    return NextResponse.json({
      page,
      rows,
    })
  } catch (error: any) {
    console.error("GET /api/databases/[dbId] error:", error)
    return new NextResponse("Database Error", { status: 500 })
  }
}
