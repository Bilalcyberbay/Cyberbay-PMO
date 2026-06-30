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

export interface PropertySchema {
  id: string
  name: string
  type: "title" | "text" | "select" | "date"
  config: any // Options list for select type e.g. { options: string[] }
  notionId: string | null
  position: number
  dataSourceId: string
}

export interface PagePropertyValue {
  id: string
  value: any // Renders cell content
  pageId: string
  propertySchemaId: string
}

export interface DataSource {
  id: string
  name: string
  notionId: string | null
  createdAt: string
  databaseId: string
  properties: PropertySchema[]
}

export interface NotionDatabase {
  id: string
  notionId: string | null
  isInline: boolean
  createdAt: string
  pageId: string
  dataSources: DataSource[]
}
