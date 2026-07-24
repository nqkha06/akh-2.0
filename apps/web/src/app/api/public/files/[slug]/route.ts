import { NextResponse, type NextRequest } from "next/server"

export const runtime = "nodejs"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const backendApiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "")
  if (!backendApiUrl) {
    return NextResponse.json(
      { message: "Missing API configuration." },
      { status: 503 },
    )
  }

  const { slug } = await context.params
  const response = await fetch(
    `${backendApiUrl}/files/link/${encodeURIComponent(slug)}/download`,
    {
      cache: "no-store",
      headers: {
        accept: request.headers.get("accept") || "application/octet-stream",
      },
    },
  )
  const headers = new Headers()

  for (const name of [
    "cache-control",
    "content-disposition",
    "content-length",
    "content-type",
  ]) {
    const value = response.headers.get(name)
    if (value) headers.set(name, value)
  }

  return new Response(response.ok ? response.body : null, {
    status: response.status,
    headers,
  })
}
