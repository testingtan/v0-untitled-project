import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"

  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

// Function to chunk large text for AI processing
export function chunkText(text: string, maxChunkSize = 8000): string[] {
  const chunks: string[] = []
  let currentChunk = ""

  // Split by double newlines to try to keep logical sections together
  const sections = text.split("\n\n")

  for (const section of sections) {
    // If adding this section would exceed the chunk size, start a new chunk
    if (currentChunk.length + section.length + 2 > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk)
      currentChunk = ""
    }

    // Add the section to the current chunk
    if (currentChunk.length > 0) {
      currentChunk += "\n\n"
    }
    currentChunk += section
  }

  // Add the last chunk if it's not empty
  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }

  return chunks
}
