import { proxyApi } from "@/lib/proxyApi";

export async function POST(
  req: Request,
  props: { params: Promise<{ document_id: string }> },
) {
  const params = await props.params;
  const body = await req.json();
  return proxyApi(`/users/me/documents/${params.document_id}/upload-url`, {
    method: "POST",
    body,
  });
}
