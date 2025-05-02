"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Loader2, Bot, Lightbulb, Plus } from "lucide-react"
import { nanoid } from "nanoid"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ChatMessage, KeyboardShortcut } from "@/types/repo"
import { useRepo } from "@/components/repo-context"
import { MessageItem } from "@/components/message-item"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import confetti from "canvas-confetti"
import { streamAIResponse } from "@/lib/ai"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ChatInterface() {
  const {
    setModifiedFiles,
    setActiveTab,
    turboMode,
    analysisComplete,
    messages,
    setMessages,
    codebaseSummary,
    digestChunks,
    repoOwner,
    repoName,
  } = useRepo()

  const [input, setInput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>("")
  const [activeTab, setActiveChatTab] = useState<string>("chat")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcuts
  const keyboardShortcuts: KeyboardShortcut[] = [
    { key: "Ctrl+K", description: "Open command palette", action: () => setShowKeyboardShortcuts(true) },
    { key: "Ctrl+Enter", description: "Send message", action: () => handleSubmit(new Event("submit") as any) },
    { key: "Ctrl+/", description: "Focus chat input", action: () => document.querySelector("textarea")?.focus() },
    { key: "Ctrl+1", description: "Switch to Explorer tab", action: () => setActiveTab("explorer") },
    { key: "Ctrl+2", description: "Switch to Output tab", action: () => setActiveTab("output") },
    { key: "Ctrl+3", description: "Switch to Metrics tab", action: () => setActiveTab("metrics") },
    { key: "Ctrl+4", description: "Switch to Graph tab", action: () => setActiveTab("graph") },
    { key: "Ctrl+J", description: "Toggle terminal panel", action: () => {} }, // This will be handled in MainLayout
    { key: "Ctrl+B", description: "Toggle AI panel", action: () => {} }, // This will be handled in MainLayout
    { key: "Ctrl+E", description: "Toggle edit mode", action: () => {} }, // This will be handled in EditorPanel
    { key: "Ctrl+S", description: "Save file changes", action: () => {} }, // This will be handled in EditorPanel
    { key: "Ctrl+Shift+P", description: "Open prompt dialog", action: () => {} }, // This will be handled in TopNavbar
    { key: "Ctrl+Shift+A", description: "Run analysis", action: () => {} }, // This will be handled in TopNavbar
  ]

  // Predefined prompts
  const predefinedPrompts = [
    {
      title: "Code Review",
      description: "Get a comprehensive code review of the current file",
      prompt: "Please review this code for bugs, performance issues, and best practices.",
    },
    {
      title: "Explain Code",
      description: "Get a detailed explanation of how the code works",
      prompt: "Explain how this code works in detail, breaking down each function and component.",
    },
    {
      title: "Refactor Code",
      description: "Get suggestions for refactoring the code",
      prompt: "How can I refactor this code to make it more maintainable and efficient?",
    },
    {
      title: "Add Feature",
      description: "Get help implementing a new feature",
      prompt: "Help me implement a new feature that allows users to filter and sort the data.",
    },
    {
      title: "Fix Bug",
      description: "Get help fixing a bug in the code",
      prompt: "I'm getting an error when I try to submit the form. Can you help me fix it?",
    },
    {
      title: "Optimize Performance",
      description: "Get suggestions for improving performance",
      prompt: "This code is running slowly. How can I optimize it for better performance?",
    },
  ]

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault()
        setShowKeyboardShortcuts(true)
      }

      if (e.ctrlKey && e.key === "/") {
        e.preventDefault()
        document.querySelector("textarea")?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, currentStreamingMessage])

  // Trigger confetti when analysis completes
  useEffect(() => {
    if (analysisComplete && chatContainerRef.current) {
      const rect = chatContainerRef.current.getBoundingClientRect()
      confetti({
        particleCount: 100,
        spread: 70,
        origin: {
          x: rect.left / window.innerWidth + 0.3,
          y: rect.top / window.innerHeight + 0.1,
        },
      })
    }
  }, [analysisComplete])

  // Simulate analysis progress
  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(
        () => {
          setAnalysisProgress((prev) => {
            const increment = Math.random() * 15
            const newValue = prev + increment
            return newValue >= 100 ? 100 : newValue
          })
        },
        turboMode ? 100 : 200,
      )

      return () => clearInterval(interval)
    } else {
      setAnalysisProgress(0)
    }
  }, [isProcessing, turboMode])

  const handleNewChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "👋 Started a new conversation. How can I help with your code?",
        timestamp: new Date(),
      },
    ])
  }

  const handleUsePrompt = (promptText: string) => {
    setInput(promptText)
    setActiveChatTab("chat")
    setTimeout(() => {
      document.querySelector("textarea")?.focus()
    }, 100)
  }

  // Update the handleSubmit function to use the codebase digest and include full file paths
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    const userMessage: ChatMessage = {
      id: nanoid(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsProcessing(true)
    setCurrentStreamingMessage("")
    setActiveChatTab("chat")

    // Add a placeholder message for streaming
    const assistantMessageId = nanoid()
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      },
    ])

    try {
      // Check if we need to create modified files
      if (input.toLowerCase().includes("make") || input.toLowerCase().includes("improve")) {
        // We'll let the AI suggest the modifications now based on the actual codebase
        setActiveTab("output")
      }

      // Stream the AI response using the codebase digest for context
      await streamAIResponse(input, turboMode, codebaseSummary, digestChunks, repoOwner, repoName, (chunk) => {
        setCurrentStreamingMessage((prev) => prev + chunk)

        // Update the message in the messages array
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: prev.find((m) => m.id === assistantMessageId)?.content + chunk }
              : msg,
          ),
        )
      })

      // Clear the streaming message as it's now in the messages array
      setCurrentStreamingMessage("")

      // Parse the AI response to extract code modifications
      const aiResponse = messages.find((msg) => msg.id === assistantMessageId)?.content || ""
      extractCodeModifications(aiResponse)
    } catch (error) {
      console.error("Error processing request:", error)

      // Update the error message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: "Sorry, I encountered an error processing your request. Please try again." }
            : msg,
        ),
      )
    } finally {
      setIsProcessing(false)
    }
  }

  // Function to extract code modifications from AI response
  const extractCodeModifications = (response: string) => {
    // Look for code blocks with file paths
    const codeBlockRegex = /```(?:.*?)\s*(?:file|path):\s*["']?(.*?)["']?[\s\n]+([\s\S]*?)```/g

    const modifiedFiles = []
    let match

    while ((match = codeBlockRegex.exec(response)) !== null) {
      const filePath = match[1].trim()
      const content = match[2].trim()

      // Check if this is a new file or modification
      const isNew =
        response.toLowerCase().includes(`create ${filePath}`) ||
        response.toLowerCase().includes(`new file ${filePath}`) ||
        response.toLowerCase().includes(`add ${filePath}`)

      modifiedFiles.push({
        name: filePath.split("/").pop() || "",
        path: filePath,
        content: content,
        language: getLanguageFromPath(filePath),
        isNew,
        isModified: !isNew,
      })
    }

    if (modifiedFiles.length > 0) {
      setModifiedFiles(modifiedFiles)
      setActiveTab("output")
    }
  }

  // Helper function to determine language from file path
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

  return (
    <div className="h-full flex flex-col overflow-hidden" ref={chatContainerRef}>
      <div className="border-b flex items-center justify-between px-4 py-2">
        <Tabs value={activeTab} onValueChange={setActiveChatTab} className="w-full">
          <TabsList className="h-8">
            <TabsTrigger value="chat" className="text-xs px-3 gap-1.5">
              <Bot className="h-3.5 w-3.5" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="prompts" className="text-xs px-3 gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" />
              Prompts
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={handleNewChat}>
          <Plus className="h-3.5 w-3.5" />
          <span>New Chat</span>
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" ? (
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 p-4">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((message) => (
                  <MessageItem key={message.id} message={message} />
                ))}
                {isProcessing && (
                  <div className="flex flex-col space-y-3 p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p className="text-sm text-muted-foreground">Analyzing codebase with Gemini-2.0...</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Analysis progress</span>
                        <span>{Math.round(analysisProgress)}%</span>
                      </div>
                      <Progress value={analysisProgress} className="h-1.5" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2 relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about the code or suggest improvements... (Ctrl+/)"
                  className="min-h-[60px] resize-none chat-input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
                <div className="absolute right-12 bottom-3 text-xs text-muted-foreground">
                  <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">Ctrl+Enter</kbd> to send
                </div>
                <Button type="submit" size="icon" disabled={isProcessing}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {predefinedPrompts.map((prompt, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleUsePrompt(prompt.prompt)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{prompt.title}</CardTitle>
                    <CardDescription className="text-xs">{prompt.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{prompt.prompt}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <Dialog open={showKeyboardShortcuts} onOpenChange={setShowKeyboardShortcuts}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {keyboardShortcuts.map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between">
                <span className="text-sm">{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-muted rounded border text-xs font-mono">{shortcut.key}</kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
