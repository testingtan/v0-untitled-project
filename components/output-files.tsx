"use client"

import { FilePlus, FileEdit } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRepo } from "@/components/repo-context"
import { Badge } from "@/components/ui/badge"

export function OutputFiles() {
  const { modifiedFiles, setSelectedFile } = useRepo()

  if (modifiedFiles.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">No modified files yet. Ask the AI to suggest changes.</div>
    )
  }

  return (
    <div className="p-1 overflow-auto max-h-[calc(100vh-10rem)]">
      <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Modified Files ({modifiedFiles.length})</div>
      {modifiedFiles.map((file) => (
        <div
          key={file.path}
          className={cn(
            "flex items-center py-2 px-3 rounded-md text-sm hover:bg-accent/50 cursor-pointer",
            "transition-colors duration-200 mb-1",
          )}
          onClick={() => setSelectedFile(file)}
        >
          {file.isNew ? (
            <FilePlus className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <FileEdit className="h-4 w-4 mr-2 text-amber-500" />
          )}
          <span className="truncate font-mono text-xs flex-1">{file.path}</span>
          <Badge variant={file.isNew ? "success" : "default"} className="ml-2 text-[10px]">
            {file.isNew ? "NEW" : "MODIFIED"}
          </Badge>
        </div>
      ))}
    </div>
  )
}
