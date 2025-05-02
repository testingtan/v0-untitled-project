"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { FileTree, FileContent, CodeMetrics, ChatMessage } from "@/types/repo"

interface RepoContextType {
  repoUrl: string
  setRepoUrl: (url: string) => void
  repoOwner: string
  setRepoOwner: (owner: string) => void
  repoName: string
  setRepoName: (name: string) => void
  fileTree: FileTree[]
  setFileTree: (tree: FileTree[]) => void
  selectedFile: FileContent | null
  setSelectedFile: (file: FileContent | null) => void
  modifiedFiles: FileContent[]
  setModifiedFiles: (files: FileContent[]) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  activeTab: "explorer" | "output" | "metrics" | "graph"
  setActiveTab: (tab: "explorer" | "output" | "metrics" | "graph") => void
  turboMode: boolean
  setTurboMode: (enabled: boolean) => void
  codeMetrics: CodeMetrics | null
  setCodeMetrics: (metrics: CodeMetrics | null) => void
  theme: "dark" | "light" | "system"
  setTheme: (theme: "dark" | "light" | "system") => void
  analysisComplete: boolean
  setAnalysisComplete: (complete: boolean) => void
  messages: ChatMessage[]
  setMessages: (messages: ChatMessage[]) => void
  codebaseDigest: string
  setCodebaseDigest: (digest: string) => void
  codebaseSummary: string
  setCodebaseSummary: (summary: string) => void
  digestChunks: string[]
  setDigestChunks: (chunks: string[]) => void
}

const RepoContext = createContext<RepoContextType | undefined>(undefined)

export function RepoProvider({ children }: { children: ReactNode }) {
  const [repoUrl, setRepoUrl] = useState<string>("")
  const [repoOwner, setRepoOwner] = useState<string>("")
  const [repoName, setRepoName] = useState<string>("")
  const [fileTree, setFileTree] = useState<FileTree[]>([])
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null)
  const [modifiedFiles, setModifiedFiles] = useState<FileContent[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<"explorer" | "output" | "metrics" | "graph">("explorer")
  const [turboMode, setTurboMode] = useState<boolean>(true)
  const [codeMetrics, setCodeMetrics] = useState<CodeMetrics | null>(null)
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark")
  const [analysisComplete, setAnalysisComplete] = useState<boolean>(false)
  const [codebaseDigest, setCodebaseDigest] = useState<string>("")
  const [codebaseSummary, setCodebaseSummary] = useState<string>("")
  const [digestChunks, setDigestChunks] = useState<string[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Welcome to CodeInsight Turbo! Enter a GitHub repository URL in the sidebar to get started. Once loaded, you can ask me questions about the codebase or request improvements.",
      timestamp: new Date(),
    },
  ])

  return (
    <RepoContext.Provider
      value={{
        repoUrl,
        setRepoUrl,
        repoOwner,
        setRepoOwner,
        repoName,
        setRepoName,
        fileTree,
        setFileTree,
        selectedFile,
        setSelectedFile,
        modifiedFiles,
        setModifiedFiles,
        isLoading,
        setIsLoading,
        activeTab,
        setActiveTab,
        turboMode,
        setTurboMode,
        codeMetrics,
        setCodeMetrics,
        theme,
        setTheme,
        analysisComplete,
        setAnalysisComplete,
        messages,
        setMessages,
        codebaseDigest,
        setCodebaseDigest,
        codebaseSummary,
        setCodebaseSummary,
        digestChunks,
        setDigestChunks,
      }}
    >
      {children}
    </RepoContext.Provider>
  )
}

export function useRepo() {
  const context = useContext(RepoContext)
  if (context === undefined) {
    throw new Error("useRepo must be used within a RepoProvider")
  }
  return context
}
