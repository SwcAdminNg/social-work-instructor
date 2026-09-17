import { proxyApi } from "@/lib/proxyApi";

export async function GET(
  req: Request,
  props: { params: Promise<{ community_id: string }> },
) {
  const params = await props.params;
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") || "1";
  const pageSize = searchParams.get("page_size") || "20";

  return proxyApi(
    `/community/${params.community_id}/messages?page=${page}&page_size=${pageSize}`,
  );
}

export async function POST(
  req: Request,
  props: { params: Promise<{ community_id: string }> },
) {
  const params = await props.params;
  const body = await req.json();

  return proxyApi(`/community/${params.community_id}/messages`, {
    method: "POST",
    body,
  });
}
