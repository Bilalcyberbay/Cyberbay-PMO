import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

interface RouteParams {
  params: Promise<{
    dbId: string
    columnId: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { columnId } = await params

    const column = await prisma.propertySchema.findUnique({
      where: { id: columnId },
    })

    if (!column) {
      return new NextResponse("Property column not found", { status: 404 })
    }

    return NextResponse.json(column)
  } catch (error: any) {
    console.error("GET /api/databases/[dbId]/columns/[columnId] error:", error)
    return new NextResponse("Database Error", { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { columnId } = await params
    const { name, type, config } = await request.json()

    const updatedColumn = await prisma.propertySchema.update({
      where: { id: columnId },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(config !== undefined && { config }),
      },
    })

    return NextResponse.json(updatedColumn)
  } catch (error: any) {
    console.error("PATCH /api/databases/[dbId]/columns/[columnId] error:", error)
    return new NextResponse("Database Error", { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { columnId } = await params

    await prisma.propertySchema.delete({
      where: { id: columnId },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    console.error("DELETE /api/databases/[dbId]/columns/[columnId] error:", error)
    return new NextResponse("Database Error", { status: 500 })
  }
}
