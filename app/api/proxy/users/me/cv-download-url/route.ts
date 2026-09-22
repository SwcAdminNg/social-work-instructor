import { proxyApi } from "@/lib/proxyApi";

export async function GET() {
  return proxyApi("/users/me/cv-download-url", { cache: "no-store" });
}
