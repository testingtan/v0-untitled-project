"use client"
import { useState, useEffect } from "react"
import {
  Play,
  TerminalSquare,
  Sparkles,
  Braces,
  Search,
  Settings,
  GitBranch,
  PanelRight,
  PanelRightClose,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRepo } from "@/components/repo-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface TopNavbarProps {
  showBottomPanel: boolean
  setShowBottomPanel: (show: boolean) => void
  showRightPanel: boolean
  setShowRightPanel: (show: boolean) => void
}

export function TopNavbar({ showBottomPanel, setShowBottomPanel, showRightPanel, setShowRightPanel }: TopNavbarProps) {
  const { repoUrl, turboMode, repoOwner, repoName } = useRepo()
  const [promptDialogOpen, setPromptDialogOpen] = useState(false)
  const [promptTemplate, setPromptTemplate] = useState("")

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open Analyze with Ctrl+Shift+A
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault()
        // Add your analyze function here
      }

      // Open Prompt with Ctrl+Shift+P
      if (e.ctrlKey && e.shiftKey && e.key === "P") {
        e.preventDefault()
        setPromptDialogOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [setPromptDialogOpen])

  return (
    <div className="border-b flex items-center justify-between p-2 h-12">
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Play className="h-4 w-4 text-green-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Run Analysis</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowBottomPanel(!showBottomPanel)}
              >
                <TerminalSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Terminal (Ctrl+J)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowRightPanel(!showRightPanel)}
              >
                {showRightPanel ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle AI Panel (Ctrl+B)</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="h-5 border-l mx-1"></div>

        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Analyze</span>
          <kbd className="ml-1 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium">
            Ctrl+Shift+A
          </kbd>
        </Button>

        <Dialog open={promptDialogOpen} onOpenChange={setPromptDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Braces className="h-3.5 w-3.5 text-blue-500" />
              <span>Prompt</span>
              <kbd className="ml-1 hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium">
                Ctrl+Shift+P
              </kbd>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Custom AI Prompt</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="prompt">Enter your custom prompt template</Label>
                <Textarea
                  id="prompt"
                  placeholder="Analyze this code for security vulnerabilities and suggest improvements..."
                  value={promptTemplate}
                  onChange={(e) => setPromptTemplate(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setPromptDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setPromptDialogOpen(false)}>Apply Prompt</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search in codebase..." className="pl-8 h-8 text-sm" />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {repoOwner && repoName && (
          <Badge variant="outline" className="gap-1 px-3 py-1 h-8">
            <GitBranch className="h-3.5 w-3.5" />
            <span>
              {repoOwner}/{repoName}
            </span>
          </Badge>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Project Settings</DropdownMenuItem>
            <DropdownMenuItem>Preferences</DropdownMenuItem>
            <DropdownMenuItem>Keyboard Shortcuts</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />
      </div>
    </div>
  )
}
