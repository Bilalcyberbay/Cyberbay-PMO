import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") || ""

  try {
    const pages = await prisma.page.findMany({
      where: {
        createdById: user.id,
        inTrash: false,
        title: {
          contains: q,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        title: true,
        icon: true,
        isDatabase: true,
      },
      take: 10,
    })

    return NextResponse.json(pages)
  } catch (error) {
    console.error("GET /api/search error:", error)
    return new NextResponse("Database Error", { status: 500 })
  }
}
