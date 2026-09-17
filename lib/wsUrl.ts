export function getWsBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) return explicit;

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL || "";
  return apiUrl.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
}
