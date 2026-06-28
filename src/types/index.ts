export interface User {
  id: string
  email: string
  name: string | null
  notionId: string | null
  createdAt: Date
}

export interface Page {
  id: string
  title: string
  icon: string | null
  cover: string | null
  notionId: string | null
  isDatabase: boolean
  inTrash: boolean
  createdAt: string
  updatedAt: string
  parentId: string | null
  workspaceId: string
  createdById: string
}

export interface Block {
  id: string
  type: string
  content: any // JSON type for rich text content, image URL, checked status, etc.
  position: number
  notionId: string | null
  inTrash: boolean
  createdAt: string
  updatedAt: string
  pageId: string
  parentBlockId: string | null
}
