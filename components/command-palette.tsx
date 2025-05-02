"use client"

import { useState, useEffect } from "react"
import { Command } from "cmdk"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useRepo } from "@/components/repo-context"
import { Search, FileCode, Code2, BarChart2, Network, Bug, GitPullRequest, Settings, Package } from "lucide-react"

export function CommandPalette({
  setShowBottomPanel,
  setShowRightPanel,
}: {
  setShowBottomPanel: (show: boolean) => void
  setShowRightPanel: (show: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const { setActiveTab } = useRepo()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    const handleCustomEvent = () => {
      setOpen(true)
    }

    document.addEventListener("keydown", down)
    document.addEventListener("open-command-palette", handleCustomEvent)

    return () => {
      document.removeEventListener("keydown", down)
      document.removeEventListener("open-command-palette", handleCustomEvent)
    }
  }, [])

  const runCommand = (command: () => void) => {
    command()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-[640px]">
        <Command className="rounded-lg border shadow-md">
          <Command.Input placeholder="Type a command or search..." className="h-12" />
          <Command.List className="max-h-[300px] overflow-auto p-2">
            <Command.Empty>No results found.</Command.Empty>

            <Command.Group heading="Navigation">
              <Command.Item
                onSelect={() => runCommand(() => setActiveTab("explorer"))}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
              >
                <FileCode className="h-4 w-4" />
                <span>Go to Explorer</span>
                <kbd className="ml-auto bg-muted px-1.5 py-0.5 rounded text-xs">Ctrl+1</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => setActiveTab("output"))}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
              >
                <Code2 className="h-4 w-4" />
                <span>Go to Output</span>
                <kbd className="ml-auto bg-muted px-1.5 py-0.5 rounded text-xs">Ctrl+2</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => setActiveTab("metrics"))}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
              >
                <BarChart2 className="h-4 w-4" />
                <span>Go to Metrics</span>
                <kbd className="ml-auto bg-muted px-1.5 py-0.5 rounded text-xs">Ctrl+3</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => setActiveTab("graph"))}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
              >
                <Network className="h-4 w-4" />
                <span>Go to Graph</span>
                <kbd className="ml-auto bg-muted px-1.5 py-0.5 rounded text-xs">Ctrl+4</kbd>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Panels">
              <Command.Item
                onSelect={() => runCommand(() => setShowBottomPanel((prev) => !prev))}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
              >
                <span>Toggle Terminal Panel</span>
                <kbd className="ml-auto bg-muted px-1.5 py-0.5 rounded text-xs">Ctrl+J</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => setShowRightPanel((prev) => !prev))}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
              >
                <span>Toggle AI Panel</span>
                <kbd className="ml-auto bg-muted px-1.5 py-0.5 rounded text-xs">Ctrl+B</kbd>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Tools">
              <Command.Item
                onSelect={() => runCommand(() => setActiveTab("search"))}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
              >
                <Search className="h-4 w-4" />
                <span>Search in Codebase</span>
                <kbd className="ml-auto bg-muted px-1.5 py-0.5 rounded text-xs">Ctrl+Shift+F</kbd>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => setActiveTab("debug"))}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
              >
                <Bug className="h-4 w-4" />
                <span>Debug</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => setActiveTab("git"))}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
              >
                <GitPullRequest className="h-4 w-4" />
                <span>Git</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => setActiveTab("extensions"))}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
              >
                <Package className="h-4 w-4" />
                <span>Extensions</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => setActiveTab("settings"))}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
