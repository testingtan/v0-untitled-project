"use client"

import { User, Bot } from "lucide-react"
import type { ChatMessage } from "@/types/repo"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ReactMarkdown from "react-markdown"
import { Prism } from "@/components/ui/prism"

export function MessageItem({ message }: { message: ChatMessage }) {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  return (
    <div className={cn("flex gap-3 p-4 rounded-lg", message.role === "user" ? "bg-muted/50" : "bg-background")}>
      <Avatar className={cn("h-8 w-8", message.role === "user" ? "bg-primary" : "bg-green-600")}>
        <AvatarFallback>
          {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{message.role === "user" ? "You" : "CodeInsight"}</span>
          <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {message.content ? (
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "")
                  return !inline && match ? (
                    <Prism language={match[1]} showLineNumbers className="rounded-md border text-sm" {...props}>
                      {String(children).replace(/\n$/, "")}
                    </Prism>
                  ) : (
                    <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props}>
                      {children}
                    </code>
                  )
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <div className="h-5 flex items-center">
              <span className="inline-block h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
              <span
                className="inline-block h-2 w-2 bg-green-500 rounded-full animate-pulse mx-1"
                style={{ animationDelay: "0.2s" }}
              ></span>
              <span
                className="inline-block h-2 w-2 bg-green-500 rounded-full animate-pulse"
                style={{ animationDelay: "0.4s" }}
              ></span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
