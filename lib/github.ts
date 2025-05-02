import type { FileTree } from "@/types/repo"
import { Octokit } from "@octokit/rest"

// Initialize Octokit with the GitHub token from environment variables
const getOctokit = () => {
  return new Octokit({
    auth: process.env.NEXT_PUBLIC_GITHUB_TOKEN || "",
  })
}

// Function to fetch repository contents
export async function fetchRepoContents(owner: string, repo: string, path = ""): Promise<FileTree[]> {
  try {
    const octokit = getOctokit()
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path,
    })

    if (Array.isArray(response.data)) {
      // Sort items to put directories first, then files
      const sortedItems = [...response.data].sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name) // Alphabetical within same type
        }
        return a.type === "dir" ? -1 : 1 // Directories first
      })

      const contents = await Promise.all(
        sortedItems.map(async (item) => {
          const fileTree: FileTree = {
            name: item.name,
            path: item.path, // Use relative path for better reference
            fullPath: `${owner}/${repo}/${item.path}`, // Include owner/repo in full path
            type: item.type === "dir" ? "directory" : "file",
            size: item.size,
          }

          if (item.type === "dir") {
            fileTree.children = await fetchRepoContents(owner, repo, item.path)
          } else if (item.type === "file") {
            // Determine language based on file extension
            const extension = item.name.split(".").pop()?.toLowerCase() || ""
            fileTree.language = getLanguageFromExtension(extension)
          }

          return fileTree
        }),
      )

      return contents
    }

    return []
  } catch (error) {
    console.error("Error fetching repository contents:", error)
    return []
  }
}

// Function to fetch file content
export async function fetchFileContent(owner: string, repo: string, path: string): Promise<string> {
  try {
    const octokit = getOctokit()
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path,
    })

    if (!Array.isArray(response.data) && response.data.type === "file") {
      // If the content is base64 encoded
      if (response.data.encoding === "base64" && response.data.content) {
        return Buffer.from(response.data.content, "base64").toString("utf-8")
      }

      return response.data.content || ""
    }

    return ""
  } catch (error) {
    console.error("Error fetching file content:", error)
    return ""
  }
}

// Function to fetch repository languages
export async function fetchRepoLanguages(owner: string, repo: string): Promise<Record<string, number>> {
  try {
    const octokit = getOctokit()
    const { data } = await octokit.repos.listLanguages({
      owner,
      repo,
    })

    return data
  } catch (error) {
    console.error("Error fetching repository languages:", error)
    return {}
  }
}

// Helper function to determine language from file extension
function getLanguageFromExtension(extension: string): string {
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    rb: "ruby",
    java: "java",
    go: "go",
    php: "php",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
    md: "markdown",
    yml: "yaml",
    yaml: "yaml",
  }

  return languageMap[extension] || "text"
}

// Function to fetch the entire repository as a text digest
export async function fetchRepositoryDigest(owner: string, repo: string): Promise<string> {
  try {
    const octokit = getOctokit()

    // Get the default branch
    const { data: repoData } = await octokit.repos.get({
      owner,
      repo,
    })

    const defaultBranch = repoData.default_branch

    // Get the tree recursively
    const { data: treeData } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: defaultBranch,
      recursive: "1",
    })

    // Filter out large binary files, only process text files
    const textFileExtensions = [
      ".js",
      ".jsx",
      ".ts",
      ".tsx",
      ".py",
      ".rb",
      ".java",
      ".go",
      ".php",
      ".html",
      ".css",
      ".scss",
      ".json",
      ".md",
      ".yml",
      ".yaml",
      ".xml",
      ".c",
      ".cpp",
      ".h",
      ".cs",
      ".swift",
      ".kt",
      ".rs",
      ".sh",
      ".bash",
      ".txt",
      ".sql",
      ".graphql",
      ".prisma",
      ".env.example",
      ".gitignore",
    ]

    const filesToProcess = treeData.tree
      .filter(
        (item) =>
          item.type === "blob" &&
          item.size < 500000 && // Skip files larger than 500KB
          (textFileExtensions.some((ext) => item.path.endsWith(ext)) || !item.path.includes(".")),
      )
      .slice(0, 1000) // Limit to 1000 files to prevent excessive API calls

    // Process files in batches to avoid rate limiting
    const batchSize = 10
    let digest = `# Repository: ${owner}/${repo}\n\n`

    for (let i = 0; i < filesToProcess.length; i += batchSize) {
      const batch = filesToProcess.slice(i, i + batchSize)
      const batchPromises = batch.map(async (file) => {
        try {
          const content = await fetchFileContent(owner, repo, file.path)
          return `## File: ${file.path}\n\`\`\`\n${content}\n\`\`\`\n\n`
        } catch (error) {
          console.error(`Error fetching ${file.path}:`, error)
          return `## File: ${file.path}\n*Error fetching content*\n\n`
        }
      })

      const batchResults = await Promise.all(batchPromises)
      digest += batchResults.join("")
    }

    return digest
  } catch (error) {
    console.error("Error creating repository digest:", error)
    return "Error: Failed to create repository digest."
  }
}

// Function to create a summarized digest for large codebases
export async function createCodebaseSummary(owner: string, repo: string): Promise<string> {
  try {
    const octokit = getOctokit()

    // Get repository information
    const { data: repoData } = await octokit.repos.get({
      owner,
      repo,
    })

    // Get languages used in the repository
    const { data: languages } = await octokit.repos.listLanguages({
      owner,
      repo,
    })

    // Get directory structure
    const { data: treeData } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: repoData.default_branch,
      recursive: "1",
    })

    // Create a directory structure representation
    const directoryStructure: Record<string, string[]> = {}
    treeData.tree.forEach((item) => {
      const parts = item.path.split("/")
      const dir = parts.length > 1 ? parts.slice(0, -1).join("/") : "/"

      if (!directoryStructure[dir]) {
        directoryStructure[dir] = []
      }

      if (parts.length > 1) {
        directoryStructure[dir].push(parts[parts.length - 1])
      } else {
        directoryStructure["/"].push(item.path)
      }
    })

    // Format the summary
    let summary = `# Repository Summary: ${owner}/${repo}\n\n`

    // Basic info
    summary += `## Repository Information\n`
    summary += `- Name: ${repoData.name}\n`
    summary += `- Description: ${repoData.description || "No description"}\n`
    summary += `- Default Branch: ${repoData.default_branch}\n`
    summary += `- Stars: ${repoData.stargazers_count}\n`
    summary += `- Forks: ${repoData.forks_count}\n\n`

    // Languages
    summary += `## Languages\n`
    const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0)
    Object.entries(languages).forEach(([language, bytes]) => {
      const percentage = ((bytes / totalBytes) * 100).toFixed(1)
      summary += `- ${language}: ${percentage}%\n`
    })
    summary += "\n"

    // Important files
    const importantFiles = [
      "package.json",
      "requirements.txt",
      "Gemfile",
      "build.gradle",
      "pom.xml",
      "Cargo.toml",
      "go.mod",
      "composer.json",
      "README.md",
      ".gitignore",
    ]

    const foundImportantFiles = treeData.tree
      .filter((item) => importantFiles.includes(item.path.split("/").pop() || ""))
      .slice(0, 10)

    if (foundImportantFiles.length > 0) {
      summary += `## Key Configuration Files\n`

      for (const file of foundImportantFiles) {
        try {
          const content = await fetchFileContent(owner, repo, file.path)
          summary += `### ${file.path}\n\`\`\`\n${content}\n\`\`\`\n\n`
        } catch (error) {
          console.error(`Error fetching ${file.path}:`, error)
        }
      }
    }

    // Directory structure (limited to main directories)
    summary += `## Directory Structure\n`
    Object.entries(directoryStructure)
      .filter(([dir]) => dir === "/" || !dir.includes("/"))
      .forEach(([dir, files]) => {
        summary += `### ${dir === "/" ? "Root" : dir}\n`
        const fileCount = files.length
        if (fileCount <= 10) {
          files.forEach((file) => (summary += `- ${file}\n`))
        } else {
          files.slice(0, 10).forEach((file) => (summary += `- ${file}\n`))
          summary += `- ... and ${fileCount - 10} more files\n`
        }
        summary += "\n"
      })

    return summary
  } catch (error) {
    console.error("Error creating codebase summary:", error)
    return "Error: Failed to create codebase summary."
  }
}
