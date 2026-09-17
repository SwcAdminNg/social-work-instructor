import { proxyApi } from "@/lib/proxyApi";

export async function POST() {
  return proxyApi("/community/presence/heartbeat", { method: "POST" });
}
