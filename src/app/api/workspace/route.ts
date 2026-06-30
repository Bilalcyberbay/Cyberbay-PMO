import { NextRequest, NextResponse } from "next/server"
import { getSessionUser, getActiveWorkspaceMembership } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { cookies } from "next/headers"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const membership = await getActiveWorkspaceMembership(user.id)
    return NextResponse.json(membership.workspace)
  } catch (error: any) {
    console.error("GET /api/workspace error:", error)
    return new NextResponse("Database Error", { status: 500 })
  }
}

// POST to switch active workspace
export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { workspaceId } = await request.json()

    if (!workspaceId) {
      return new NextResponse("Workspace ID is required", { status: 400 })
    }

    // Verify requesting user is member of target workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId: user.id,
        workspaceId,
      },
    })

    if (!membership) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const cookieStore = await cookies()
    cookieStore.set("active_workspace_id", workspaceId, { path: "/" })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("POST /api/workspace error:", error)
    return new NextResponse("Server Error", { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { name } = await request.json()

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    const membership = await getActiveWorkspaceMembership(user.id)

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: membership.workspaceId },
      data: { name },
    })

    return NextResponse.json(updatedWorkspace)
  } catch (error: any) {
    console.error("PATCH /api/workspace error:", error)
    return new NextResponse("Database Error", { status: 500 })
  }
}
