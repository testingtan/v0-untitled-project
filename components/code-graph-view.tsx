"use client"

import { useEffect, useRef, useState } from "react"
import { useRepo } from "@/components/repo-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Network } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function CodeGraphView() {
  const { codeMetrics, isLoading } = useRepo()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [graphType, setGraphType] = useState<"force" | "circular">("force")
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    if (!codeMetrics || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect) {
        canvas.width = rect.width
        canvas.height = rect.height
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Create nodes from file relations
    const nodes = Array.from(
      new Set([
        ...codeMetrics.fileRelations.map((rel) => rel.source),
        ...codeMetrics.fileRelations.map((rel) => rel.target),
      ]),
    ).map((path) => {
      return {
        id: path,
        label: path.split("/").pop() || "",
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: 0,
        vy: 0,
        radius: 6,
        color: getNodeColor(path),
      }
    })

    // Create links from file relations
    const links = codeMetrics.fileRelations.map((rel) => {
      return {
        source: nodes.find((n) => n.id === rel.source)!,
        target: nodes.find((n) => n.id === rel.target)!,
        strength: rel.strength,
      }
    })

    // Position nodes in a circle if circular layout
    if (graphType === "circular") {
      const radius = Math.min(canvas.width, canvas.height) * 0.35
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      nodes.forEach((node, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI
        node.x = centerX + radius * Math.cos(angle)
        node.y = centerY + radius * Math.sin(angle)
      })
    }

    // Animation loop
    let animationId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw links
      ctx.lineWidth = 1
      links.forEach((link) => {
        ctx.beginPath()
        ctx.moveTo(link.source.x, link.source.y)
        ctx.lineTo(link.target.x, link.target.y)
        ctx.strokeStyle = `rgba(150, 150, 150, ${link.strength * 0.2})`
        ctx.stroke()
      })

      // Draw nodes
      nodes.forEach((node) => {
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI)
        ctx.fillStyle = node.color
        ctx.fill()

        // Draw node labels
        ctx.fillStyle = "#fff"
        ctx.font = "10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(node.label, node.x, node.y + node.radius + 12)
      })

      // Apply forces if force-directed layout and animating
      if (graphType === "force" && isAnimating) {
        applyForces()
      }

      if (isAnimating) {
        animationId = requestAnimationFrame(animate)
      }
    }

    // Force-directed layout algorithm
    const applyForces = () => {
      // Apply repulsive forces between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i]
          const nodeB = nodes[j]
          const dx = nodeB.x - nodeA.x
          const dy = nodeB.y - nodeA.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1
          const force = (1 / distance) * 5

          if (distance < 100) {
            nodeA.vx -= (dx / distance) * force
            nodeA.vy -= (dy / distance) * force
            nodeB.vx += (dx / distance) * force
            nodeB.vy += (dy / distance) * force
          }
        }
      }

      // Apply attractive forces along links
      links.forEach((link) => {
        const dx = link.target.x - link.source.x
        const dy = link.target.y - link.source.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1
        const force = (distance - 80) * 0.01 * link.strength

        link.source.vx += (dx / distance) * force
        link.source.vy += (dy / distance) * force
        link.target.vx -= (dx / distance) * force
        link.target.vy -= (dy / distance) * force
      })

      // Update positions with velocity and damping
      nodes.forEach((node) => {
        node.x += node.vx
        node.y += node.vy
        node.vx *= 0.9
        node.vy *= 0.9

        // Keep nodes within canvas bounds
        if (node.x < node.radius) node.x = node.radius
        if (node.x > canvas.width - node.radius) node.x = canvas.width - node.radius
        if (node.y < node.radius) node.y = node.radius
        if (node.y > canvas.height - node.radius) node.y = canvas.height - node.radius
      })
    }

    // Helper function to get node color based on file path
    function getNodeColor(path: string) {
      if (path.endsWith(".tsx") || path.endsWith(".ts")) return "#3178c6"
      if (path.endsWith(".js") || path.endsWith(".jsx")) return "#f7df1e"
      if (path.endsWith(".css")) return "#264de4"
      if (path.endsWith(".json")) return "#cbcb41"
      if (path.endsWith(".md")) return "#083fa1"
      return "#8a8a8a"
    }

    // Start animation
    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [codeMetrics, graphType, isAnimating])

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    )
  }

  if (!codeMetrics) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Network className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p>No code graph available yet. Fetch a repository to view relationships.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 overflow-auto max-h-[calc(100vh-10rem)]">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center">
                <Network className="h-4 w-4 mr-2" />
                Code Relationship Graph
              </CardTitle>
              <CardDescription>Visual representation of file dependencies</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Tabs value={graphType} onValueChange={(v) => setGraphType(v as "force" | "circular")}>
                <TabsList className="h-8">
                  <TabsTrigger value="force" className="text-xs px-2 py-1">
                    Force
                  </TabsTrigger>
                  <TabsTrigger value="circular" className="text-xs px-2 py-1">
                    Circular
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setIsAnimating(!isAnimating)}>
                {isAnimating ? "Pause" : "Resume"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative h-[400px] w-full rounded-md border bg-muted/30">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
