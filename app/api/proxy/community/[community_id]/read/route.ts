import { proxyApi } from "@/lib/proxyApi";

export async function POST(
  _req: Request,
  props: { params: Promise<{ community_id: string }> },
) {
  const params = await props.params;
  return proxyApi(`/community/${params.community_id}/read`, {
    method: "POST",
  });
}
