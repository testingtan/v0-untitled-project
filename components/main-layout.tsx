"use client"
import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ChatInterface } from "@/components/chat-interface"
import { RepoProvider } from "@/components/repo-context"
import { EditorPanel } from "@/components/editor-panel"
import { TopNavbar } from "@/components/top-navbar"
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TerminalPanel } from "@/components/terminal-panel"
import { ProblemsPanel } from "@/components/problems-panel"
import { cn } from "@/lib/utils"
import { KeyboardShortcutsHelper } from "@/components/keyboard-shortcuts-helper"
import { CommandPalette } from "@/components/command-palette"

export function MainLayout() {
  const [activeBottomTab, setActiveBottomTab] = useState<string>("terminal")
  const [showBottomPanel, setShowBottomPanel] = useState<boolean>(false)
  const [showRightPanel, setShowRightPanel] = useState<boolean>(true)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle bottom panel with Ctrl+J
      if (e.ctrlKey && e.key === "j") {
        e.preventDefault()
        setShowBottomPanel((prev) => !prev)
      }

      // Toggle right panel with Ctrl+B
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault()
        setShowRightPanel((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [setShowBottomPanel, setShowRightPanel])

  return (
    <RepoProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopNavbar
            showBottomPanel={showBottomPanel}
            setShowBottomPanel={setShowBottomPanel}
            showRightPanel={showRightPanel}
            setShowRightPanel={setShowRightPanel}
          />
          <ResizablePanelGroup direction="vertical" className="flex-1">
            <ResizablePanel defaultSize={showBottomPanel ? 70 : 100} minSize={30}>
              <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={50} minSize={30}>
                  <EditorPanel />
                </ResizablePanel>
                {showRightPanel && (
                  <ResizablePanel defaultSize={50} minSize={30}>
                    <ChatInterface />
                  </ResizablePanel>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>
            {showBottomPanel && (
              <ResizablePanel defaultSize={30} minSize={20} className="border-t">
                <div className="h-full flex flex-col">
                  <Tabs value={activeBottomTab} onValueChange={setActiveBottomTab} className="w-full">
                    <div className="border-b px-4 py-2">
                      <TabsList className="h-8">
                        <TabsTrigger value="terminal" className="text-xs px-3">
                          Terminal
                        </TabsTrigger>
                        <TabsTrigger value="problems" className="text-xs px-3">
                          Problems
                        </TabsTrigger>
                        <TabsTrigger value="output" className="text-xs px-3">
                          Output
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    <div className={cn("flex-1 overflow-hidden", activeBottomTab !== "terminal" && "hidden")}>
                      <TerminalPanel />
                    </div>
                    <div className={cn("flex-1 overflow-hidden", activeBottomTab !== "problems" && "hidden")}>
                      <ProblemsPanel />
                    </div>
                    <div className={cn("flex-1 overflow-hidden", activeBottomTab !== "output" && "hidden")}>
                      <div className="p-4 text-sm font-mono">
                        <div className="text-green-500">✓ Analysis complete</div>
                        <div className="text-muted-foreground mt-2">Processed 128 files, found 3 potential issues</div>
                      </div>
                    </div>
                  </Tabs>
                </div>
              </ResizablePanel>
            )}
          </ResizablePanelGroup>
        </div>
      </div>
      <KeyboardShortcutsHelper setShowBottomPanel={setShowBottomPanel} setShowRightPanel={setShowRightPanel} />
      <CommandPalette setShowBottomPanel={setShowBottomPanel} setShowRightPanel={setShowRightPanel} />
    </RepoProvider>
  )
}
