import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

interface RouteParams {
  params: Promise<{
    blockId: string
  }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { blockId } = await params
    const { type, content, position, inTrash } = await request.json()

    const updatedBlock = await prisma.block.update({
      where: { id: blockId },
      data: {
        ...(type !== undefined && { type }),
        ...(content !== undefined && { content }),
        ...(position !== undefined && { position }),
        ...(inTrash !== undefined && { inTrash }),
      },
    })

    return NextResponse.json(updatedBlock)
  } catch (error: any) {
    console.error("PATCH /api/blocks/detail/[blockId] error:", error)
    return new NextResponse("Database Error", { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { blockId } = await params
    await prisma.block.delete({
      where: { id: blockId },
    })
    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    console.error("DELETE /api/blocks/detail/[blockId] error:", error)
    return new NextResponse("Database Error", { status: 500 })
  }
}
