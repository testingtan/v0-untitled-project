"use client"

import { useEffect } from "react"
import { useRepo } from "@/components/repo-context"

// This component centralizes keyboard shortcut handling
export function KeyboardShortcutsHelper({
  setShowBottomPanel,
  setShowRightPanel,
}: {
  setShowBottomPanel: (show: boolean) => void
  setShowRightPanel: (show: boolean) => void
}) {
  const { setActiveTab } = useRepo()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent handling shortcuts when typing in input fields
      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
        // Only handle global shortcuts like Ctrl+K, Ctrl+J, etc.
        if (e.ctrlKey && e.key === "k") {
          e.preventDefault()
          // Open command palette
          document.dispatchEvent(new CustomEvent("open-command-palette"))
        }

        if (e.ctrlKey && e.key === "j") {
          e.preventDefault()
          setShowBottomPanel((prev) => !prev)
        }

        if (e.ctrlKey && e.key === "b") {
          e.preventDefault()
          setShowRightPanel((prev) => !prev)
        }

        return
      }

      // Tab navigation shortcuts
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

      // Panel toggle shortcuts
      if (e.ctrlKey && e.key === "j") {
        e.preventDefault()
        setShowBottomPanel((prev) => !prev)
      }
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault()
        setShowRightPanel((prev) => !prev)
      }

      // Focus shortcuts
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault()
        // Focus chat input
        document.querySelector(".chat-input")?.focus()
      }
      if (e.ctrlKey && e.key === "`") {
        e.preventDefault()
        // Focus terminal input
        document.querySelector(".terminal-input")?.focus()
      }

      // Command palette
      if (e.ctrlKey && e.key === "k") {
        e.preventDefault()
        // Open command palette
        document.dispatchEvent(new CustomEvent("open-command-palette"))
      }

      // Search
      if (e.ctrlKey && e.shiftKey && e.key === "F") {
        e.preventDefault()
        setActiveTab("search")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [setActiveTab, setShowBottomPanel, setShowRightPanel])

  return null
}
