import { proxyApi } from "@/lib/proxyApi";

export async function POST() {
  return proxyApi("/notifications/read-all", { method: "POST" });
}
