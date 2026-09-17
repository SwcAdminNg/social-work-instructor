import { NextResponse } from "next/server";
import { publicFetchApi } from "@/lib/fetchApi";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res = await publicFetchApi("/auth/2fa/setup/email/start", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
