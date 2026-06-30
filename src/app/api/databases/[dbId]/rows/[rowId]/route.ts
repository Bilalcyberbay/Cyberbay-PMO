import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

interface RouteParams {
  params: Promise<{
    dbId: string
    rowId: string
  }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { rowId } = await params
    const { title, properties } = await request.json()

    // 1. Update row page title if provided
    if (title !== undefined) {
      await prisma.page.update({
        where: { id: rowId },
        data: { title },
      })
    }

    // 2. Update cell property values
    if (properties) {
      for (const [schemaId, value] of Object.entries(properties)) {
        await prisma.pagePropertyValue.upsert({
          where: {
            pageId_propertySchemaId: {
              pageId: rowId,
              propertySchemaId: schemaId,
            },
          },
          create: {
            pageId: rowId,
            propertySchemaId: schemaId,
            value: value as any,
          },
          update: {
            value: value as any,
          },
        })
      }
    }

    // Return the updated row page including all property values
    const updatedRow = await prisma.page.findUnique({
      where: { id: rowId },
      include: {
        propertyValues: true,
      },
    })

    return NextResponse.json(updatedRow)
  } catch (error: any) {
    console.error("PATCH /api/databases/[dbId]/rows/[rowId] error:", error)
    return new NextResponse("Database Error", { status: 500 })
  }
}
