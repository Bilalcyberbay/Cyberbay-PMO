import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { token, name, password } = await request.json()

    if (!token || !name || !password) {
      return new NextResponse("All fields are required", { status: 400 })
    }

    // Find invitation
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
    })

    if (!invitation || invitation.status !== "pending") {
      return new NextResponse("Invalid or expired invitation token", { status: 400 })
    }

    if (new Date() > invitation.expiresAt) {
      return new NextResponse("Invitation has expired", { status: 400 })
    }

    // Find soft signup user placeholder
    const user = await prisma.user.findFirst({
      where: {
        email: invitation.invitedEmail,
        isSoftSignup: true,
      },
    })

    if (!user) {
      return new NextResponse("User placeholder not found", { status: 404 })
    }

    // Hash password & finalize user profile
    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        password: hashedPassword,
        isSoftSignup: false,
      },
    })

    // Mark invitation as accepted
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "accepted",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("POST /api/workspaces/invite/accept error:", error)
    return new NextResponse("Server Error", { status: 500 })
  }
}
