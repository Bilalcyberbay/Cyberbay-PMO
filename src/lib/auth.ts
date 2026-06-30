"use server"

import { cookies } from "next/headers"
import prisma from "./prisma"
import bcrypt from "bcryptjs"

const COOKIE_NAME = "cyberpay_session"

export async function getSessionUser() {
  const cookieStore = await cookies()
  const userId = cookieStore.get(COOKIE_NAME)?.value
  if (!userId) return null
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })
    return user
  } catch (error) {
    console.error("Error in getSessionUser:", error)
    return null
  }
}

export async function signInAction(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })
    
    if (!user || !user.password) {
      return { error: "Invalid email or password." }
    }
    
    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return { error: "Invalid email or password." }
    }
    
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, user.id, { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/" })
    return { success: true }
  } catch (error: any) {
    console.error("Database error in signInAction:", error)
    return { error: "Database error: " + (error?.message || "Failed to query database.") }
  }
}

export async function signUpAction(email: string, name: string, password: string) {
  try {
    let user = await prisma.user.findUnique({
      where: { email },
    })
    
    if (user) {
      return { error: "User already exists. Please sign in instead." }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    })
    
    // Create workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: `${name}'s Workspace`,
        icon: "💼",
      },
    })
    
    // Workspace member
    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: "owner",
      },
    })
    
    // First page
    await prisma.page.create({
      data: {
        title: "Getting Started",
        icon: "🚀",
        workspaceId: workspace.id,
        createdById: user.id,
      },
    })
    
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, user.id, { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/" })
    return { success: true }
  } catch (error: any) {
    console.error("Database error in signUpAction:", error)
    return { error: "Database error: " + (error?.message || "Failed to write database records.") }
  }
}

export async function signOutAction() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  cookieStore.delete("active_workspace_id")
  return { success: true }
}

export async function getActiveWorkspaceMembership(userId: string) {
  const cookieStore = await cookies()
  const activeWorkspaceId = cookieStore.get("active_workspace_id")?.value

  let membership = null

  if (activeWorkspaceId) {
    membership = await prisma.workspaceMember.findFirst({
      where: {
        userId,
        workspaceId: activeWorkspaceId,
      },
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
  }

  if (!membership) {
    membership = await prisma.workspaceMember.findFirst({
      where: { userId },
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

    if (membership) {
      cookieStore.set("active_workspace_id", membership.workspaceId, { path: "/" })
    }
  }

  if (!membership) {
    // Create default workspace
    const newWorkspace = await prisma.workspace.create({
      data: {
        name: "Personal Workspace",
        icon: "💼",
      },
    })

    membership = await prisma.workspaceMember.create({
      data: {
        workspaceId: newWorkspace.id,
        userId,
        role: "owner",
      },
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

    cookieStore.set("active_workspace_id", membership.workspaceId, { path: "/" })
  }

  return membership
}
