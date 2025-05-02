"use client"
import { useState, useRef, useEffect } from "react"
import type React from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { useRepo } from "@/components/repo-context"

export function TerminalPanel() {
  const { repoOwner, repoName } = useRepo()
  const [commandHistory, setCommandHistory] = useState<string[]>([
    "Welcome to CodeInsight Terminal",
    "Type 'help' for a list of available commands",
    "",
  ])
  const [currentCommand, setCurrentCommand] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [commandHistory])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus terminal with Ctrl+`
      if (e.ctrlKey && e.key === "`") {
        e.preventDefault()
        document.querySelector(".terminal-input")?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentCommand.trim()) return

    // Add the command to history with prompt
    setCommandHistory((prev) => [...prev, `$ ${currentCommand}`])

    // Process command
    const command = currentCommand.trim().toLowerCase()
    let response: string[] = []

    if (command === "help") {
      response = [
        "Available commands:",
        "  help     - Show this help message",
        "  clear    - Clear the terminal",
        "  analyze  - Analyze the current repository",
        "  info     - Show repository information",
        "  ls       - List files in the current directory",
        "  exit     - Exit terminal (closes panel)",
      ]
    } else if (command === "clear") {
      setCommandHistory(["Terminal cleared", ""])
      setCurrentCommand("")
      return
    } else if (command === "analyze") {
      response = [
        "Analyzing repository...",
        "Found 128 files, 24,567 lines of code",
        "Analysis complete. No critical issues found.",
      ]
    } else if (command === "info") {
      if (repoOwner && repoName) {
        response = [
          `Repository: ${repoOwner}/${repoName}`,
          "Language: TypeScript (78%), JavaScript (12%), CSS (5%), Other (5%)",
          "Last commit: 2 days ago",
        ]
      } else {
        response = ["No repository loaded. Fetch a repository first."]
      }
    } else if (command === "ls") {
      response = ["src/", "public/", "package.json", "tsconfig.json", "README.md"]
    } else if (command === "exit") {
      response = ["Closing terminal..."]
      // You would trigger the panel close here
    } else if (command.startsWith("cd ")) {
      const dir = command.substring(3)
      response = [`Changed directory to ${dir}`]
    } else {
      response = [`Command not found: ${command}. Type 'help' for available commands.`]
    }

    // Add response to history
    setCommandHistory((prev) => [...prev, ...response, ""])
    setCurrentCommand("")
  }

  return (
    <div className="h-full flex flex-col bg-black text-green-400 font-mono text-sm p-2">
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-2 whitespace-pre-wrap">
          {commandHistory.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleCommandSubmit} className="mt-2 flex items-center">
        <span className="mr-2">$</span>
        <Input
          value={currentCommand}
          onChange={(e) => setCurrentCommand(e.target.value)}
          className="flex-1 bg-transparent border-none text-green-400 focus-visible:ring-0 focus-visible:ring-offset-0 h-7 px-0 terminal-input"
          placeholder="Type a command... (Ctrl+` to focus)"
          autoFocus
        />
      </form>
    </div>
  )
}
