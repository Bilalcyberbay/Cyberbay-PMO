import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import prisma from "@/lib/prisma"
import crypto from "crypto"
import { sendInviteEmail } from "@/lib/email"

interface RouteParams {
  params: Promise<{
    workspaceId: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser()
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { workspaceId } = await params
    const { email } = await request.json()

    if (!email || !email.trim()) {
      return new NextResponse("Email is required", { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()

    // Verify the requesting user is a member of the workspace and include workspace info
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId: user.id,
      },
      include: {
        workspace: true,
      },
    })

    if (!membership) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const origin = new URL(request.url).origin

    // Check if user already exists
    let invitedUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    })

    if (invitedUser) {
      // Check if already a member
      const existingMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId: invitedUser.id,
        },
      })

      if (!existingMember) {
        await prisma.workspaceMember.create({
          data: {
            workspaceId,
            userId: invitedUser.id,
            role: "member",
          },
        })
      }

      // Save invitation as accepted
      const token = crypto.randomBytes(32).toString("hex")
      await prisma.workspaceInvitation.create({
        data: {
          workspaceId,
          invitedEmail: cleanEmail,
          token,
          status: "accepted",
          expiresAt: new Date(),
          createdById: user.id,
        },
      })

      // Send mail for direct add
      const inviteLink = `${origin}/login`
      const mailRes = await sendInviteEmail({
        to: cleanEmail,
        workspaceName: membership.workspace.name,
        inviteLink,
      })

      return NextResponse.json({ 
        status: "added", 
        user: invitedUser,
        previewUrl: (mailRes as any).previewUrl || null
      })
    } else {
      // Soft Signup placeholder creation
      const placeholder = await prisma.user.create({
        data: {
          email: cleanEmail,
          name: cleanEmail.split("@")[0],
          isSoftSignup: true,
        },
      })

      // Add placeholder to WorkspaceMember
      await prisma.workspaceMember.create({
        data: {
          workspaceId,
          userId: placeholder.id,
          role: "member",
        },
      })

      // Generate secure token & pending invitation
      const token = crypto.randomBytes(32).toString("hex")
      await prisma.workspaceInvitation.create({
        data: {
          workspaceId,
          invitedEmail: cleanEmail,
          token,
          status: "pending",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          createdById: user.id,
        },
      })

      // Send invite verification email
      const inviteLink = `${origin}/accept-invite?token=${token}`
      const mailRes = await sendInviteEmail({
        to: cleanEmail,
        workspaceName: membership.workspace.name,
        inviteLink,
      })

      return NextResponse.json({ 
        status: "invited", 
        token,
        previewUrl: (mailRes as any).previewUrl || null
      })
    }
  } catch (error: any) {
    console.error("POST /api/workspaces/[workspaceId]/invite error:", error)
    return new NextResponse(`Server Error: ${error.message || error}\n${error.stack || ""}`, { status: 500 })
  }
}
