import { proxyApi } from "@/lib/proxyApi";

export async function GET() {
  return proxyApi("/users/me/documents", { cache: "no-store" });
}

export async function POST(req: Request) {
  const body = await req.json();
  return proxyApi("/users/me/documents", { method: "POST", body });
}
