export interface FileTree {
  name: string
  path: string
  fullPath?: string
  type: "file" | "directory"
  children?: FileTree[]
  size?: number
  language?: string
}

export interface FileContent {
  name: string
  path: string
  content: string
  language: string
  isModified?: boolean
  isNew?: boolean
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
}

export interface CodeMetrics {
  totalFiles: number
  totalLines: number
  languages: {
    name: string
    files: number
    lines: number
    percentage: number
    color: string
  }[]
  complexity: {
    score: number
    level: "low" | "medium" | "high"
  }
  dependencies: {
    name: string
    version: string
    type: "direct" | "dev"
  }[]
  performance: {
    score: number
    level: "excellent" | "good" | "fair" | "poor"
  }
  fileRelations: {
    source: string
    target: string
    strength: number
  }[]
}

export interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
}
