"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, FileIcon, FolderIcon, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRepo } from "@/components/repo-context"
import type { FileTree, FileContent } from "@/types/repo"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { formatFileSize } from "@/lib/utils"
import { fetchFileContent } from "@/lib/github"

export function FileExplorer() {
  const { fileTree, isLoading, selectedFile, setSelectedFile, repoOwner, repoName } = useRepo()
  const [searchQuery, setSearchQuery] = useState("")

  const handleFileClick = async (path: string, language = "text") => {
    try {
      // Fetch file content
      const content = await fetchFileContent(repoOwner, repoName, path)

      const fileContent: FileContent = {
        name: path.split("/").pop() || "",
        path,
        content,
        language: language || getLanguageFromPath(path),
      }

      setSelectedFile(fileContent)
    } catch (error) {
      console.error("Error fetching file content:", error)
    }
  }

  const handleCloseFile = () => {
    setSelectedFile(null)
  }

  const getLanguageFromPath = (path: string): string => {
    const extension = path.split(".").pop()?.toLowerCase() || ""

    const languageMap: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      rb: "ruby",
      java: "java",
      go: "go",
      php: "php",
      html: "html",
      css: "css",
      scss: "scss",
      json: "json",
      md: "markdown",
      yml: "yaml",
      yaml: "yaml",
    }

    return languageMap[extension] || "text"
  }

  const filterTree = (tree: FileTree[], query: string): FileTree[] => {
    if (!query) return tree

    return tree.filter((item) => {
      if (item.name.toLowerCase().includes(query.toLowerCase())) {
        return true
      }

      if (item.type === "directory" && item.children) {
        const filteredChildren = filterTree(item.children, query)
        if (filteredChildren.length > 0) {
          return { ...item, children: filteredChildren }
        }
      }

      return false
    })
  }

  const filteredTree = searchQuery ? filterTree(fileTree, searchQuery) : fileTree

  if (isLoading) {
    return (
      <div className="p-2 space-y-2">
        <Skeleton className="h-8 w-full mb-3" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
      </div>
    )
  }

  if (fileTree.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">Enter a GitHub repository URL to view files</div>
  }

  return (
    <div className="p-1">
      <div className="relative mb-3">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>
      <div className="overflow-auto max-h-[calc(100vh-14rem)]">
        {filteredTree.map((item) => (
          <FileTreeItem
            key={item.path}
            item={item}
            handleFileClick={handleFileClick}
            selectedFilePath={selectedFile?.path}
          />
        ))}
      </div>

      {selectedFile && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={handleCloseFile}
            className="bg-muted/80 hover:bg-muted p-1 rounded-full shadow-md"
            aria-label="Close file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

function FileTreeItem({
  item,
  handleFileClick,
  selectedFilePath,
  level = 0,
}: {
  item: FileTree
  handleFileClick: (path: string, language?: string) => void
  selectedFilePath?: string
  level?: number
}) {
  const [isOpen, setIsOpen] = useState(level < 1)

  const toggleOpen = () => {
    if (item.type === "directory") {
      setIsOpen(!isOpen)
    }
  }

  const getFileIcon = (path: string) => {
    if (path.endsWith(".tsx") || path.endsWith(".ts")) return "text-blue-400"
    if (path.endsWith(".js") || path.endsWith(".jsx")) return "text-yellow-400"
    if (path.endsWith(".json")) return "text-green-400"
    if (path.endsWith(".md")) return "text-purple-400"
    if (path.endsWith(".css") || path.endsWith(".scss")) return "text-pink-400"
    return "text-blue-400"
  }

  const isSelected = selectedFilePath === item.path

  return (
    <div>
      <div
        className={cn(
          "flex items-center py-1 px-2 rounded-md text-sm hover:bg-accent/50 cursor-pointer",
          "transition-colors duration-200",
          isSelected && "bg-accent/70",
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={item.type === "file" ? () => handleFileClick(item.path, item.language) : toggleOpen}
      >
        {item.type === "directory" ? (
          <>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 mr-1 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1 text-muted-foreground" />
            )}
            <FolderIcon className="h-4 w-4 mr-2 text-amber-500" />
          </>
        ) : (
          <>
            <span className="w-4 mr-1" />
            <FileIcon className={cn("h-4 w-4 mr-2", getFileIcon(item.path))} />
          </>
        )}
        <span className="truncate font-mono text-xs flex-1">{item.name}</span>
        {item.size && <span className="text-[10px] text-muted-foreground ml-2">{formatFileSize(item.size)}</span>}
      </div>

      {item.type === "directory" && isOpen && item.children && (
        <div>
          {item.children.map((child) => (
            <FileTreeItem
              key={child.path}
              item={child}
              handleFileClick={handleFileClick}
              selectedFilePath={selectedFilePath}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
