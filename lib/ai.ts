// Function to generate AI response using OpenRouter's Gemini-2.0 API
export async function generateAIResponse(
  prompt: string,
  turboMode: boolean,
  codebaseSummary: string,
  digestChunks: string[],
  repoOwner: string,
  repoName: string,
): Promise<string> {
  try {
    // Create a system prompt that includes information about the codebase
    let systemPrompt = `You are CodeInsight, an AI assistant specialized in analyzing and improving code. 
    You provide detailed, helpful responses about code structure, best practices, and suggestions for improvements.
    ${turboMode ? "You are running in Turbo Mode, which enables ultra-fast analysis of large codebases." : ""}
    
    When suggesting code improvements:
    1. Explain the reasoning behind your suggestions
    2. Provide code examples with proper syntax highlighting
    3. Focus on both functionality and readability
    4. Consider performance implications
    5. ALWAYS include the full file path when suggesting changes (e.g., src/components/index.tsx)
    
    You're analyzing the repository: ${repoOwner}/${repoName}
    
    Format your responses using Markdown for better readability.`

    // Add codebase summary to the system prompt
    if (codebaseSummary) {
      systemPrompt += `\n\nHere is a summary of the codebase you're analyzing:\n${codebaseSummary}`
    }

    // Determine which chunks of the codebase are most relevant to the query
    const relevantChunks = findRelevantChunks(prompt, digestChunks)

    // Create messages array with system prompt
    const messages = [{ role: "system", content: systemPrompt }]

    // Add relevant code chunks as context
    if (relevantChunks.length > 0) {
      messages.push({
        role: "system",
        content: "Here are the most relevant parts of the codebase for your reference:",
      })

      // Add up to 5 most relevant chunks to provide more context
      relevantChunks.slice(0, 5).forEach((chunk) => {
        messages.push({ role: "system", content: chunk })
      })
    }

    // Add the user's prompt
    messages.push({ role: "user", content: prompt })

    // Use OpenRouter's Gemini-2.0 API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://codeinsight.app", // Replace with your actual domain
        "X-Title": "CodeInsight",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-thinking-exp:free",
        messages,
        temperature: 0.7,
        max_tokens: 4096, // Increased token limit for more detailed responses
      }),
    })

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error("Error generating AI response:", error)
    return "I encountered an error while analyzing your code. Please try again."
  }
}

// Update the streamAIResponse function to include codebase context
export async function streamAIResponse(
  prompt: string,
  turboMode: boolean,
  codebaseSummary: string,
  digestChunks: string[],
  repoOwner: string,
  repoName: string,
  onChunk: (chunk: string) => void,
) {
  try {
    // Create a system prompt that includes information about the codebase
    let systemPrompt = `You are CodeInsight, an AI assistant specialized in analyzing and improving code. 
    You provide detailed, helpful responses about code structure, best practices, and suggestions for improvements.
    ${turboMode ? "You are running in Turbo Mode, which enables ultra-fast analysis of large codebases." : ""}
    
    When suggesting code improvements:
    1. Explain the reasoning behind your suggestions
    2. Provide code examples with proper syntax highlighting
    3. Focus on both functionality and readability
    4. Consider performance implications
    5. ALWAYS include the full file path when suggesting changes (e.g., src/components/index.tsx)
    
    You're analyzing the repository: ${repoOwner}/${repoName}
    
    Format your responses using Markdown for better readability.`

    // Add codebase summary to the system prompt
    if (codebaseSummary) {
      systemPrompt += `\n\nHere is a summary of the codebase you're analyzing:\n${codebaseSummary}`
    }

    // Determine which chunks of the codebase are most relevant to the query
    const relevantChunks = findRelevantChunks(prompt, digestChunks)

    // Create messages array with system prompt
    const messages = [{ role: "system", content: systemPrompt }]

    // Add relevant code chunks as context
    if (relevantChunks.length > 0) {
      messages.push({
        role: "system",
        content: "Here are the most relevant parts of the codebase for your reference:",
      })

      // Add up to 5 most relevant chunks to provide more context
      relevantChunks.slice(0, 5).forEach((chunk) => {
        messages.push({ role: "system", content: chunk })
      })
    }

    // Add the user's prompt
    messages.push({ role: "user", content: prompt })

    // Use OpenRouter's Gemini-2.0 API with streaming
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://codeinsight.app", // Replace with your actual domain
        "X-Title": "CodeInsight",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-thinking-exp:free",
        messages,
        temperature: 0.7,
        max_tokens: 4096, // Increased token limit for more detailed responses
        stream: true,
      }),
    })

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error("Failed to get reader from response")
    }

    let fullText = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split("\n").filter((line) => line.trim() !== "")

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6)
          if (data === "[DONE]") continue

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content || ""
            if (content) {
              fullText += content
              onChunk(content)
            }
          } catch (e) {
            console.error("Error parsing JSON:", e)
          }
        }
      }
    }

    return fullText
  } catch (error) {
    console.error("Error streaming AI response:", error)
    onChunk("\n\nI encountered an error while analyzing your code. Please try again.")
    return "I encountered an error while analyzing your code. Please try again."
  }
}

// Function to find relevant chunks of code based on the user's query
function findRelevantChunks(query: string, chunks: string[]): string[] {
  if (!chunks.length) return []

  // Simple relevance scoring based on keyword matching
  const queryKeywords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3) // Only consider words longer than 3 characters

  // Score each chunk based on keyword matches
  const scoredChunks = chunks.map((chunk) => {
    const chunkLower = chunk.toLowerCase()
    let score = 0

    // Count keyword occurrences
    queryKeywords.forEach((keyword) => {
      const regex = new RegExp(keyword, "g")
      const matches = chunkLower.match(regex)
      if (matches) {
        score += matches.length
      }
    })

    // Boost score for chunks with file paths that match keywords
    const filePathMatches = queryKeywords.filter((keyword) =>
      chunk.match(new RegExp(`## File: .*${keyword}.*`, "i")),
    ).length

    score += filePathMatches * 5 // Higher weight for file path matches

    return { chunk, score }
  })

  // Sort by score (descending) and return the chunks
  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0) // Only return chunks with some relevance
    .map((item) => item.chunk)
}
