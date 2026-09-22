import { signOut } from "@/auth";
import { NextRequest } from "next/server";

function getSafeCallbackUrl(req: NextRequest) {
  const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") || "/dashboard";

  if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return "/dashboard";
  }

  return callbackUrl;
}

export async function GET(req: NextRequest) {
  // Capture where they were trying to go so we can return them there after they log back in
  const callbackUrl = getSafeCallbackUrl(req);
  
  // Destroys the NextAuth session cookie and redirects to login
  await signOut({ redirectTo: `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` });
}
