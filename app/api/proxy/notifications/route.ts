import { proxyApi } from "@/lib/proxyApi";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.toString();
  return proxyApi(`/notifications${query ? `?${query}` : ""}`);
}
