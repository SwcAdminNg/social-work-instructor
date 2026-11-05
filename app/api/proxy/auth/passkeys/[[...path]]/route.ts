import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchApi, publicFetchApi } from "@/lib/fetchApi";

// Forwards passkey requests to the API. Sign-in endpoints are public; the rest
// need a signed-in session. The page origin is added server-side so the API can
// bind each ceremony to this site, and the visitor's browser is passed on so
// devices get a recognisable name.
const PUBLIC = new Set(["login/options", "login/verify", "check"]);
const ALLOWED = /^(|check|login\/options|login\/verify|register\/options|register\/verify|[0-9a-f-]{36})$/i;

function originOf(req: Request) {
  const header = req.headers.get("origin");
  if (header) return header;
  const forwardedHost = req.headers.get("x-forwarded-host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  return forwardedHost ? `${proto}://${forwardedHost}` : new URL(req.url).origin;
}

async function forward(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const subpath = path.join("/");
  if (!ALLOWED.test(subpath)) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const isPublic = PUBLIC.has(subpath);
  if (!isPublic) {
    const session = await auth();
    if (!session || !(session as { accessToken?: string }).accessToken) {
      return NextResponse.json({ message: "Please sign in again." }, { status: 401 });
    }
  }

  let body: string | undefined;
  if (req.method === "POST" || req.method === "PATCH") {
    const json = await req.json().catch(() => ({}));
    if (req.method === "POST") json.origin = originOf(req);
    body = JSON.stringify(json);
  }

  const call = isPublic ? publicFetchApi : fetchApi;
  try {
    const res = await call(`/auth/passkeys${subpath ? `/${subpath}` : ""}`, {
      method: req.method,
      body,
      cache: "no-store",
      headers: { "X-Client-User-Agent": req.headers.get("user-agent") || "" },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "We could not reach the server. Please try again." }, { status: 502 });
  }
}

export { forward as GET, forward as POST, forward as PATCH, forward as DELETE };
