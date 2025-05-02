"use client"

import { X } from "lucide-react"
import type { FileContent } from "@/types/repo"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRepo } from "@/components/repo-context"

export function CodeViewer({ file }: { file: FileContent }) {
  const { setSelectedFile } = useRepo()

  const handleClose = () => {
    setSelectedFile(null)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        <div className="font-mono text-xs truncate">{file.path}</div>
        <button onClick={handleClose} className="p-1 rounded-full hover:bg-muted" aria-label="Close file">
          <X className="h-4 w-4" />
        </button>
      </div>
      <ScrollArea className="flex-1">
        <SyntaxHighlighter
          language={file.language}
          style={vscDarkPlus}
          showLineNumbers
          customStyle={{
            margin: 0,
            borderRadius: 0,
            fontSize: "0.85rem",
            fontFamily: "var(--font-mono)",
            backgroundColor: "transparent",
          }}
        >
          {file.content}
        </SyntaxHighlighter>
      </ScrollArea>
    </div>
  )
}
