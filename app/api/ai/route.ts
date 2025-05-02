import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { prompt, systemPrompt, stream } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Create the request body for OpenRouter
    const requestBody = {
      model: "google/gemini-2.0",
      messages: [
        { role: "system", content: systemPrompt || "You are a helpful AI assistant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      stream: stream || false,
    }

    // If streaming is requested, handle it differently
    if (stream) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://codeinsight.app",
          "X-Title": "CodeInsight",
        },
        body: JSON.stringify(requestBody),
      })

      // Return the stream directly
      return new Response(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      })
    } else {
      // For non-streaming requests
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://codeinsight.app",
          "X-Title": "CodeInsight",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      return NextResponse.json({ text: data.choices[0].message.content })
    }
  } catch (error) {
    console.error("Error generating AI response:", error)
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 })
  }
}
