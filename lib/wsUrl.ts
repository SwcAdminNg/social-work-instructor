export function getWsBaseUrl() {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL || "";
  return apiUrl.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
}
