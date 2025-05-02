"use client"
import { cn } from "@/lib/utils"

interface PrismProps {
  language?: string
  showLineNumbers?: boolean
  children: string
  className?: string
}

export function Prism({ language = "typescript", showLineNumbers = false, children, className, ...props }: PrismProps) {
  // Simple syntax highlighting for common tokens
  const highlightCode = (code: string) => {
    // Replace strings (both single and double quotes)
    code = code.replace(/(["'])(.*?)\1/g, '<span class="text-amber-300">$&</span>')

    // Replace keywords
    const keywords = [
      "function",
      "const",
      "let",
      "var",
      "return",
      "if",
      "else",
      "for",
      "while",
      "class",
      "interface",
      "type",
      "import",
      "export",
      "from",
      "as",
      "async",
      "await",
      "try",
      "catch",
      "throw",
      "new",
      "this",
      "super",
      "extends",
      "implements",
    ]
    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "g")
      code = code.replace(regex, `<span class="text-purple-400">${keyword}</span>`)
    })

    // Replace comments
    code = code.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span class="text-green-500">$&</span>')

    // Replace numbers
    code = code.replace(/\b(\d+)\b/g, '<span class="text-blue-400">$&</span>')

    // Replace JSX tags
    code = code.replace(/(&lt;\/?\w+)/g, '<span class="text-blue-500">$&</span>')

    return code
  }

  // Add line numbers if requested
  const addLineNumbers = (code: string) => {
    const lines = code.split("\n")
    return lines
      .map(
        (line, i) => `<div class="table-row">
        <span class="table-cell pr-4 text-right text-muted-foreground text-xs select-none">${i + 1}</span>
        <span class="table-cell">${line || " "}</span>
      </div>`,
      )
      .join("")
  }

  const processedCode = showLineNumbers
    ? `<div class="table w-full">${addLineNumbers(highlightCode(children))}</div>`
    : highlightCode(children)

  return (
    <pre className={cn("p-4 rounded-md bg-muted/50 overflow-x-auto font-mono text-sm", className)} {...props}>
      <div dangerouslySetInnerHTML={{ __html: processedCode }} />
    </pre>
  )
}
