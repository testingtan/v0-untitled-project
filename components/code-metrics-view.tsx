"use client"

import { useRepo } from "@/components/repo-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Package, Zap, BarChart3 } from "lucide-react"

export function CodeMetricsView() {
  const { codeMetrics, isLoading } = useRepo()

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-[180px] w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-[120px] w-full rounded-lg" />
          <Skeleton className="h-[120px] w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (!codeMetrics) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p>No code metrics available yet. Fetch a repository to view metrics.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 overflow-auto max-h-[calc(100vh-10rem)]">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Code Overview
          </CardTitle>
          <CardDescription>
            Analysis of {codeMetrics.totalFiles} files with {codeMetrics.totalLines.toLocaleString()} lines of code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {codeMetrics.languages.map((lang) => (
              <div key={lang.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <div className="flex items-center">
                    <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: lang.color }} />
                    <span>{lang.name}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {lang.files} files · {lang.lines.toLocaleString()} lines ({lang.percentage}%)
                  </span>
                </div>
                <Progress value={lang.percentage} className="h-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Complexity Score
            </CardTitle>
            <CardDescription>Overall code complexity analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <div className="relative h-32 w-32">
                <svg className="h-full w-full" viewBox="0 0 100 100">
                  <circle
                    className="text-muted stroke-current"
                    strokeWidth="10"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                  />
                  <circle
                    className="stroke-current"
                    strokeWidth="10"
                    strokeLinecap="round"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={
                      codeMetrics.complexity.level === "low"
                        ? "#10b981"
                        : codeMetrics.complexity.level === "medium"
                          ? "#f59e0b"
                          : "#ef4444"
                    }
                    strokeDasharray={`${codeMetrics.complexity.score * 2.51} 251`}
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-3xl font-bold">{codeMetrics.complexity.score}</span>
                    <span className="text-xs block capitalize">{codeMetrics.complexity.level}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Performance Score
            </CardTitle>
            <CardDescription>Code performance analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <div className="relative h-32 w-32">
                <svg className="h-full w-full" viewBox="0 0 100 100">
                  <circle
                    className="text-muted stroke-current"
                    strokeWidth="10"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                  />
                  <circle
                    className="stroke-current"
                    strokeWidth="10"
                    strokeLinecap="round"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={
                      codeMetrics.performance.level === "excellent"
                        ? "#10b981"
                        : codeMetrics.performance.level === "good"
                          ? "#3b82f6"
                          : codeMetrics.performance.level === "fair"
                            ? "#f59e0b"
                            : "#ef4444"
                    }
                    strokeDasharray={`${codeMetrics.performance.score * 2.51} 251`}
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-3xl font-bold">{codeMetrics.performance.score}</span>
                    <span className="text-xs block capitalize">{codeMetrics.performance.level}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Package className="h-4 w-4 mr-2" />
            Dependencies
          </CardTitle>
          <CardDescription>Key project dependencies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {codeMetrics.dependencies.map((dep) => (
              <div key={dep.name} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                <div className="flex items-center">
                  <span className="font-mono text-xs">{dep.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{dep.version}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      dep.type === "direct" ? "bg-blue-500/20 text-blue-500" : "bg-amber-500/20 text-amber-500"
                    }`}
                  >
                    {dep.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
