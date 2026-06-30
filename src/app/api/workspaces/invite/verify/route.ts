import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token) {
    return new NextResponse("Token is required", { status: 400 })
  }

  try {
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: true,
      },
    })

    if (!invitation) {
      return new NextResponse("Invitation not found", { status: 404 })
    }

    if (invitation.status !== "pending") {
      return new NextResponse("Invitation has already been accepted or expired", { status: 400 })
    }

    if (new Date() > invitation.expiresAt) {
      // Mark as expired
      await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: "expired" },
      })
      return new NextResponse("Invitation token has expired", { status: 400 })
    }

    return NextResponse.json({
      email: invitation.invitedEmail,
      workspaceName: invitation.workspace.name,
      workspaceId: invitation.workspaceId,
    })
  } catch (error: any) {
    console.error("GET /api/workspaces/invite/verify error:", error)
    return new NextResponse("Server Error", { status: 500 })
  }
}
