import { proxyApi } from "@/lib/proxyApi";

export async function POST(
  req: Request,
  props: { params: Promise<{ community_id: string }> },
) {
  const params = await props.params;
  const body = await req.json();

  return proxyApi(`/community/${params.community_id}/attachments/upload-url`, {
    method: "POST",
    body,
  });
}
