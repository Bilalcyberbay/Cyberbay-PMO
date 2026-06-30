import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { cookies } from "next/headers"

// GET all workspaces the current user belongs to (for list switcher under Account contexts!)
export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: {
        workspace: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    const workspaces = memberships.map((m) => m.workspace)
    return NextResponse.json(workspaces)
  } catch (error: any) {
    console.error("GET /api/workspaces error:", error)
    return new NextResponse("Server Error", { status: 500 })
  }
}

// POST create a new workspace
export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { name, icon } = await request.json()

    if (!name || !name.trim()) {
      return new NextResponse("Workspace name is required", { status: 400 })
    }

    // 1. Create Workspace
    const newWorkspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
        icon: icon || "💼",
      },
    })

    // 2. Add creator as Owner member
    await prisma.workspaceMember.create({
      data: {
        workspaceId: newWorkspace.id,
        userId: user.id,
        role: "owner",
      },
    })

    // 3. Create default Welcome Page inside this workspace
    await prisma.page.create({
      data: {
        title: "Getting Started",
        icon: "🚀",
        workspaceId: newWorkspace.id,
        createdById: user.id,
      },
    })

    // 4. Update cookie to make the new workspace active
    const cookieStore = await cookies()
    cookieStore.set("active_workspace_id", newWorkspace.id, { path: "/" })

    return NextResponse.json(newWorkspace)
  } catch (error: any) {
    console.error("POST /api/workspaces error:", error)
    return new NextResponse("Server Error", { status: 500 })
  }
}
