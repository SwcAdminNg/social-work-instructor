import { signOut } from "@/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  // Capture where they were trying to go so we can return them there after they log back in
  const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") || "/dashboard";
  
  // Destroys the NextAuth session cookie and redirects to login
  await signOut({ redirectTo: `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` });
}
