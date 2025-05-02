"use client"
import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, AlertTriangle, Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type ProblemSeverity = "error" | "warning" | "info"

interface Problem {
  id: string
  severity: ProblemSeverity
  message: string
  file: string
  line: number
  column: number
}

export function ProblemsPanel() {
  // Mock problems data
  const [problems, setProblems] = useState<Problem[]>([
    {
      id: "p1",
      severity: "error",
      message: "Cannot find module '@/components/missing-component'",
      file: "src/pages/index.tsx",
      line: 42,
      column: 10,
    },
    {
      id: "p2",
      severity: "warning",
      message: "Variable 'unused' is declared but never used",
      file: "src/utils/helpers.ts",
      line: 15,
      column: 7,
    },
    {
      id: "p3",
      severity: "warning",
      message: "Function 'deprecatedMethod' is deprecated",
      file: "src/components/form.tsx",
      line: 87,
      column: 12,
    },
    {
      id: "p4",
      severity: "info",
      message: "Consider using const instead of let as it's not reassigned",
      file: "src/hooks/use-auth.ts",
      line: 23,
      column: 3,
    },
  ])

  const [filter, setFilter] = useState<ProblemSeverity | "all">("all")

  const filteredProblems = filter === "all" ? problems : problems.filter((p) => p.severity === filter)

  const counts = {
    error: problems.filter((p) => p.severity === "error").length,
    warning: problems.filter((p) => p.severity === "warning").length,
    info: problems.filter((p) => p.severity === "info").length,
  }

  const handleDismiss = (id: string) => {
    setProblems((prev) => prev.filter((p) => p.id !== id))
  }

  const getSeverityIcon = (severity: ProblemSeverity) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-2 flex items-center space-x-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setFilter("all")}
        >
          All ({problems.length})
        </Button>
        <Button
          variant={filter === "error" ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setFilter("error")}
        >
          Errors ({counts.error})
        </Button>
        <Button
          variant={filter === "warning" ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setFilter("warning")}
        >
          Warnings ({counts.warning})
        </Button>
        <Button
          variant={filter === "info" ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setFilter("info")}
        >
          Info ({counts.info})
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="divide-y">
          {filteredProblems.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No problems found</div>
          ) : (
            filteredProblems.map((problem) => (
              <div key={problem.id} className="p-3 flex items-start group">
                <div className="mr-3 mt-0.5">{getSeverityIcon(problem.severity)}</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{problem.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {problem.file}:{problem.line}:{problem.column}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => handleDismiss(problem.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
