import { proxyApi } from "@/lib/proxyApi";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ document_id: string }> },
) {
  const params = await props.params;
  const body = await req.json();
  return proxyApi(`/users/me/documents/${params.document_id}`, {
    method: "PATCH",
    body,
  });
}

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ document_id: string }> },
) {
  const params = await props.params;
  return proxyApi(`/users/me/documents/${params.document_id}`, {
    method: "DELETE",
  });
}
