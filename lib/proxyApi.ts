import { NextResponse } from "next/server";
import { auth } from "@/auth";

type SessionWithAccessToken = {
  accessToken?: string;
};

type ProxyOptions = {
  method?: string;
  body?: unknown;
  cache?: RequestCache;
};

export async function proxyApi(endpoint: string, options: ProxyOptions = {}) {
  try {
    const session = (await auth()) as SessionWithAccessToken | null;
    const accessToken = session?.accessToken;

    if (!accessToken) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL || "";

    // Multipart bodies (e.g. AI quiz autocomplete uploads) are passed through
    // untouched so fetch can set the boundary; everything else is JSON.
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };
    if (!isFormData) headers["Content-Type"] = "application/json";

    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: options.method ?? "GET",
      headers,
      body:
        options.body === undefined
          ? undefined
          : isFormData
            ? (options.body as FormData)
            : JSON.stringify(options.body),
      cache: options.cache ?? "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
