import { NextResponse } from "next/server"
import { Octokit } from "@octokit/rest"

export async function POST(request: Request) {
  try {
    const { owner, repo, path } = await request.json()

    if (!owner || !repo) {
      return NextResponse.json({ error: "Owner and repo are required" }, { status: 400 })
    }

    // Initialize Octokit with the GitHub token from environment variables
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN || "",
    })

    const response = await octokit.repos.getContent({
      owner,
      repo,
      path: path || "",
    })

    return NextResponse.json(response.data)
  } catch (error) {
    console.error("Error fetching from GitHub:", error)
    return NextResponse.json({ error: "Failed to fetch from GitHub" }, { status: 500 })
  }
}
