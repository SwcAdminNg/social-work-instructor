import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchApi } from "@/lib/fetchApi";

export async function POST() {
  try {
    const session = await auth();
    if (!session || !(session as any).accessToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const res = await fetchApi("/auth/2fa/totp/start", { method: "POST", body: "{}" });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
