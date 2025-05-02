"use client"

import type React from "react"
import {
  GitBranch,
  Code2,
  BarChart2,
  Network,
  Zap,
  ZapOff,
  FileCode,
  Search,
  Bug,
  GitPullRequest,
  Settings,
  Package,
  Layers,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useRepo } from "@/components/repo-context"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { fetchRepoContents, fetchRepositoryDigest, createCodebaseSummary, fetchRepoLanguages } from "@/lib/github"
import { chunkText } from "@/lib/utils"
import { nanoid } from "nanoid"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect } from "react"

export function AppSidebar() {
  const {
    activeTab,
    setActiveTab,
    repoUrl,
    setRepoUrl,
    setIsLoading,
    setFileTree,
    turboMode,
    setTurboMode,
    setCodeMetrics,
    setAnalysisComplete,
    setMessages,
    setCodebaseDigest,
    setCodebaseSummary,
    setDigestChunks,
    setRepoOwner,
    setRepoName,
  } = useRepo()

  // Update the handleRepoSubmit function to fetch real data
  const handleRepoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoUrl) return

    setIsLoading(true)
    setAnalysisComplete(false)

    try {
      // Extract owner and repo from URL
      const urlParts = repoUrl.replace(/\/$/, "").split("/")
      const owner = urlParts[urlParts.length - 2]
      const repo = urlParts[urlParts.length - 1]

      if (!owner || !repo) {
        throw new Error("Invalid GitHub repository URL")
      }

      // Store owner and repo name for future use
      setRepoOwner(owner)
      setRepoName(repo)

      // Create a loading message for the digest generation
      setMessages((prev) => [
        ...prev,
        {
          id: "digest-loading",
          role: "system",
          content: "Analyzing repository and generating codebase digest...",
          timestamp: new Date(),
        },
      ])

      // Fetch repository contents for the file tree
      const repoContents = await fetchRepoContents(owner, repo)
      setFileTree(repoContents)

      // Fetch real language data and metrics
      const languages = await fetchRepoLanguages(owner, repo)

      // Calculate total lines based on file sizes (rough estimate)
      const totalFiles = countFiles(repoContents)
      const totalLines = estimateTotalLines(repoContents)

      // Format languages for metrics
      const languageColors: Record<string, string> = {
        TypeScript: "#3178c6",
        JavaScript: "#f7df1e",
        HTML: "#e34c26",
        CSS: "#563d7c",
        Python: "#3572A5",
        Java: "#b07219",
        Ruby: "#701516",
        Go: "#00ADD8",
        Rust: "#dea584",
        PHP: "#4F5D95",
        Swift: "#ffac45",
        Kotlin: "#F18E33",
        C: "#555555",
        "C++": "#f34b7d",
        "C#": "#178600",
        Shell: "#89e051",
        JSON: "#cbcb41",
        Markdown: "#083fa1",
        YAML: "#cb171e",
        Other: "#8a8a8a",
      }

      const formattedLanguages = Object.entries(languages)
        .map(([name, bytes]) => {
          const percentage = (bytes / Object.values(languages).reduce((a, b) => a + b, 0)) * 100
          return {
            name,
            files: Math.round((percentage / 100) * totalFiles), // Estimate files per language
            lines: Math.round((percentage / 100) * totalLines), // Estimate lines per language
            percentage: Number.parseFloat(percentage.toFixed(1)),
            color: languageColors[name] || "#8a8a8a",
          }
        })
        .sort((a, b) => b.percentage - a.percentage)

      // Set real code metrics
      setCodeMetrics({
        totalFiles,
        totalLines,
        languages: formattedLanguages,
        complexity: {
          score: calculateComplexityScore(repoContents, languages),
          level: "medium", // This would need more analysis to determine accurately
        },
        dependencies: [], // Will be populated from package.json if available
        performance: {
          score: 85, // This would need more analysis to determine accurately
          level: "good",
        },
        fileRelations: [], // This would need more analysis to determine accurately
      })

      // Fetch the codebase summary first (faster)
      const summary = await createCodebaseSummary(owner, repo)
      setCodebaseSummary(summary)

      // Then fetch the full digest (can be large)
      const digest = await fetchRepositoryDigest(owner, repo)
      setCodebaseDigest(digest)

      // Create chunks for efficient AI processing
      const chunks = chunkText(digest, 12000) // Increased chunk size for more context
      setDigestChunks(chunks)

      // Update the loading message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === "digest-loading"
            ? {
                ...msg,
                content: `Repository analysis complete! I've processed ${chunks.length} sections of code and am ready to answer questions about the codebase.`,
              }
            : msg,
        ),
      )

      // Set analysis completion
      setAnalysisComplete(true)
    } catch (error) {
      console.error("Error fetching repository:", error)

      // Update with error message
      setMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          role: "system",
          content: "Error analyzing repository. Please check the URL and try again.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to count total files in the repository
  const countFiles = (tree: any[]): number => {
    let count = 0
    for (const item of tree) {
      if (item.type === "file") {
        count++
      } else if (item.children && item.children.length > 0) {
        count += countFiles(item.children)
      }
    }
    return count
  }

  // Helper function to estimate total lines based on file sizes
  const estimateTotalLines = (tree: any[]): number => {
    const estimateLines = (size: number) => Math.round(size / 30) // Rough estimate: ~30 bytes per line

    let totalLines = 0
    const calculateLines = (items: any[]) => {
      for (const item of items) {
        if (item.type === "file" && item.size) {
          totalLines += estimateLines(item.size)
        } else if (item.children && item.children.length > 0) {
          calculateLines(item.children)
        }
      }
    }

    calculateLines(tree)
    return totalLines
  }

  // Helper function to calculate complexity score
  const calculateComplexityScore = (tree: any[], languages: Record<string, number>): number => {
    // More languages and files generally means more complex
    const languageCount = Object.keys(languages).length
    const fileCount = countFiles(tree)

    // Calculate a score between 0-100
    const baseScore = Math.min(50 + languageCount * 5 + fileCount / 10, 100)

    // Adjust based on language complexity
    const hasComplexLanguages = Object.keys(languages).some((lang) =>
      ["C++", "Rust", "Haskell", "Scala"].includes(lang),
    )

    return Math.round(hasComplexLanguages ? baseScore * 1.2 : baseScore)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab shortcuts
      if (e.ctrlKey && e.key === "1") {
        e.preventDefault()
        setActiveTab("explorer")
      }
      if (e.ctrlKey && e.key === "2") {
        e.preventDefault()
        setActiveTab("output")
      }
      if (e.ctrlKey && e.key === "3") {
        e.preventDefault()
        setActiveTab("metrics")
      }
      if (e.ctrlKey && e.key === "4") {
        e.preventDefault()
        setActiveTab("graph")
      }

      // Search shortcut
      if (e.ctrlKey && e.shiftKey && e.key === "F") {
        e.preventDefault()
        setActiveTab("search")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [setActiveTab])

  return (
    <Sidebar variant="inset" className="w-[250px] flex-shrink-0">
      <SidebarHeader className="h-12 flex items-center px-4 border-b">
        <div className="flex items-center space-x-2">
          <Layers className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg">CodeInsight</span>
          {turboMode && (
            <Badge
              variant="outline"
              className="ml-1 bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] px-1.5"
            >
              <Zap className="h-3 w-3 mr-1" />
              TURBO
            </Badge>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeTab === "explorer"}
                onClick={() => setActiveTab("explorer")}
                tooltip="Explorer (Ctrl+1)"
              >
                <FileCode className="h-4 w-4 mr-2" />
                <span>Explorer</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeTab === "search"}
                onClick={() => setActiveTab("search")}
                tooltip="Search (Ctrl+Shift+F)"
              >
                <Search className="h-4 w-4 mr-2" />
                <span>Search</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeTab === "output"}
                onClick={() => setActiveTab("output")}
                tooltip="Output (Ctrl+2)"
              >
                <Code2 className="h-4 w-4 mr-2" />
                <span>Output</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeTab === "metrics"}
                onClick={() => setActiveTab("metrics")}
                tooltip="Metrics (Ctrl+3)"
              >
                <BarChart2 className="h-4 w-4 mr-2" />
                <span>Metrics</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeTab === "graph"}
                onClick={() => setActiveTab("graph")}
                tooltip="Graph (Ctrl+4)"
              >
                <Network className="h-4 w-4 mr-2" />
                <span>Graph</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeTab === "debug"} onClick={() => setActiveTab("debug")} tooltip="Debug">
                <Bug className="h-4 w-4 mr-2" />
                <span>Debug</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton isActive={activeTab === "git"} onClick={() => setActiveTab("git")} tooltip="Git">
                <GitPullRequest className="h-4 w-4 mr-2" />
                <span>Git</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeTab === "extensions"}
                onClick={() => setActiveTab("extensions")}
                tooltip="Extensions"
              >
                <Package className="h-4 w-4 mr-2" />
                <span>Extensions</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={activeTab === "settings"}
                onClick={() => setActiveTab("settings")}
                tooltip="Settings"
              >
                <Settings className="h-4 w-4 mr-2" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <div className="px-4 py-2">
            <form onSubmit={handleRepoSubmit} className="space-y-2">
              <Input
                placeholder="Enter GitHub repo URL"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="h-8 bg-background/50 text-xs"
              />
              <Button type="submit" size="sm" className="w-full h-8">
                <GitBranch className="h-3.5 w-3.5 mr-1" />
                Fetch Repository
              </Button>
            </form>

            <div className="flex items-center justify-between mt-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <Switch id="turbo-mode" checked={turboMode} onCheckedChange={setTurboMode} />
                      <label htmlFor="turbo-mode" className="text-xs font-medium cursor-pointer flex items-center">
                        {turboMode ? (
                          <>
                            <Zap className="h-3 w-3 mr-1 text-amber-400" />
                            <span>Turbo Mode</span>
                          </>
                        ) : (
                          <>
                            <ZapOff className="h-3 w-3 mr-1" />
                            <span>Normal Mode</span>
                          </>
                        )}
                      </label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Turbo Mode enables ultra-fast analysis of 100K+ line codebases</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t mt-auto">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-xs font-medium">CodeInsight AI</span>
            <span className="text-[10px] text-muted-foreground">Powered by Gemini 2.0</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
