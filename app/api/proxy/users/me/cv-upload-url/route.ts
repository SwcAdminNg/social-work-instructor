import { proxyApi } from "@/lib/proxyApi";

export async function POST(req: Request) {
  const body = await req.json();
  return proxyApi("/users/me/cv-upload-url", { method: "POST", body });
}
