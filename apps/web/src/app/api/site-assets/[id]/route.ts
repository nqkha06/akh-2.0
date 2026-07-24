import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const backendApiUrl = process.env.API_INTERNAL_URL?.replace(/\/$/, "");
  if (!backendApiUrl) {
    return NextResponse.json({ message: "Missing API configuration." }, { status: 503 });
  }
  const { id } = await context.params;
  const response = await fetch(
    `${backendApiUrl}/admin-media/public/${encodeURIComponent(id)}/content`,
    { headers: { accept: request.headers.get("accept") || "image/*" } },
  );
  const headers = new Headers();
  for (const name of ["cache-control", "content-length", "content-type", "etag", "last-modified"]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(response.ok ? response.body : null, {
    status: response.status,
    headers,
  });
}
