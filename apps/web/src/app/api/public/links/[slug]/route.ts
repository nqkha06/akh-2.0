import { completeLinkVisit } from "@/lib/api-client";

const corsHeaders = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const visitToken = new URL(request.url).searchParams.get("visitToken");
    if (!visitToken) {
      return Response.json(
        {
          statusCode: 400,
          message: "Thiếu visit token.",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }
    const link = await completeLinkVisit(slug, visitToken);

    return Response.json(link, {
      headers: corsHeaders,
    });
  } catch {
    return Response.json(
      {
        statusCode: 404,
        message: "Không tìm thấy link.",
      },
      {
        status: 404,
        headers: corsHeaders,
      },
    );
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
