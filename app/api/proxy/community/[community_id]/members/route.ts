import { proxyApi } from "@/lib/proxyApi";

export async function GET(
  req: Request,
  props: { params: Promise<{ community_id: string }> },
) {
  const params = await props.params;
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") || "1";
  const pageSize = searchParams.get("page_size") || "30";

  return proxyApi(
    `/community/${params.community_id}/members?page=${page}&page_size=${pageSize}`,
  );
}
