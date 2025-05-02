"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Prism } from "@/components/ui/prism"
import { X, FileText, Save, Copy, Edit, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRepo } from "@/components/repo-context"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function EditorPanel() {
  const { selectedFile, fileTree, setSelectedFile } = useRepo()
  const [openFiles, setOpenFiles] = useState<Array<{ id: string; file: any }>>([])
  const [activeFileId, setActiveFileId] = useState<string | null>(null)
  const [editableContent, setEditableContent] = useState<string>("")
  const [isEditing, setIsEditing] = useState<boolean>(false)

  // When selectedFile changes, add it to openFiles if not already there
  useEffect(() => {
    if (selectedFile && !openFiles.some((f) => f.file.path === selectedFile.path)) {
      const newFileId = `file-${Date.now()}`
      setOpenFiles((prev) => [...prev, { id: newFileId, file: selectedFile }])
      setActiveFileId(newFileId)
      setEditableContent(selectedFile.content)
    }
  }, [selectedFile])

  const handleCloseFile = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenFiles((prev) => prev.filter((f) => f.id !== fileId))

    // If we're closing the active file, set a new active file
    if (activeFileId === fileId) {
      const remainingFiles = openFiles.filter((f) => f.id !== fileId)
      if (remainingFiles.length > 0) {
        setActiveFileId(remainingFiles[remainingFiles.length - 1].id)
        setEditableContent(remainingFiles[remainingFiles.length - 1].file.content)
      } else {
        setActiveFileId(null)
        setSelectedFile(null)
      }
    }
  }

  const handleTabClick = (fileId: string) => {
    setActiveFileId(fileId)
    const fileObj = openFiles.find((f) => f.id === fileId)
    if (fileObj) {
      setSelectedFile(fileObj.file)
      setEditableContent(fileObj.file.content)
    }
  }

  const toggleEditMode = () => {
    setIsEditing(!isEditing)
  }

  const handleSave = () => {
    if (activeFileId) {
      // Update the content in openFiles
      setOpenFiles((prev) =>
        prev.map((f) => (f.id === activeFileId ? { ...f, file: { ...f.file, content: editableContent } } : f)),
      )

      // Also update selectedFile if needed
      const activeFile = openFiles.find((f) => f.id === activeFileId)
      if (activeFile) {
        setSelectedFile({ ...activeFile.file, content: editableContent })
      }

      setIsEditing(false)
    }
  }

  const handleCopyCode = () => {
    if (activeFileId) {
      const activeFile = openFiles.find((f) => f.id === activeFileId)
      if (activeFile) {
        navigator.clipboard.writeText(activeFile.file.content)
      }
    }
  }

  const getActiveFile = () => {
    return openFiles.find((f) => f.id === activeFileId)?.file
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save with Ctrl+S
      if (e.ctrlKey && e.key === "s" && isEditing && activeFileId) {
        e.preventDefault()
        handleSave()
      }

      // Toggle edit mode with Ctrl+E
      if (e.ctrlKey && e.key === "e" && activeFileId) {
        e.preventDefault()
        toggleEditMode()
      }

      // Copy code with Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && e.key === "C" && activeFileId) {
        e.preventDefault()
        handleCopyCode()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isEditing, activeFileId])

  if (openFiles.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <FileText className="h-16 w-16 mb-4 opacity-20" />
        <h3 className="text-lg font-medium mb-2">No files open</h3>
        <p className="text-sm max-w-md text-center">
          Select a file from the explorer to view and edit its contents, or fetch a repository to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b flex items-center">
        <ScrollArea orientation="horizontal" className="max-w-full">
          <div className="flex">
            {openFiles.map(({ id, file }) => (
              <div
                key={id}
                onClick={() => handleTabClick(id)}
                className={cn(
                  "flex items-center h-9 px-4 border-r cursor-pointer group",
                  activeFileId === id ? "bg-background" : "bg-muted/50 hover:bg-muted",
                )}
              >
                <span className="text-xs font-medium truncate max-w-[150px]">{file.name}</span>
                <button
                  onClick={(e) => handleCloseFile(id, e)}
                  className="ml-2 opacity-0 group-hover:opacity-100 hover:bg-muted rounded-sm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col relative">
        <div className="absolute top-2 right-2 z-10 flex space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-background/80 backdrop-blur-sm"
                  onClick={toggleEditMode}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isEditing ? "View Mode (Ctrl+E)" : "Edit Mode (Ctrl+E)"}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-background/80 backdrop-blur-sm"
                  onClick={handleCopyCode}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy Code (Ctrl+Shift+C)</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {isEditing && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 bg-background/80 backdrop-blur-sm"
                    onClick={handleSave}
                  >
                    <Save className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save Changes (Ctrl+S)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur-sm">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Format Document</DropdownMenuItem>
              <DropdownMenuItem>Find in File</DropdownMenuItem>
              <DropdownMenuItem>Split Editor</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isEditing ? (
          <textarea
            value={editableContent}
            onChange={(e) => setEditableContent(e.target.value)}
            className="flex-1 p-4 font-mono text-sm bg-background resize-none focus:outline-none"
          />
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-4">
              <Prism language={getActiveFile()?.language || "text"} showLineNumbers>
                {getActiveFile()?.content || ""}
              </Prism>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}
