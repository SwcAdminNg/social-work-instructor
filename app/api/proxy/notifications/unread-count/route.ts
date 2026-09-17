import { proxyApi } from "@/lib/proxyApi";

export async function GET() {
  return proxyApi("/notifications/unread-count");
}
