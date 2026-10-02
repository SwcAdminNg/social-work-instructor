import { proxyApi } from "@/lib/proxyApi";

function endpointFromRequest(request: Request, path: string[]) {
  const url = new URL(request.url);
  const query = url.searchParams.toString();
  return `/${path.map(encodeURIComponent).join("/")}${query ? `?${query}` : ""}`;
}

async function readBody(request: Request) {
  const text = await request.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function GET(request: Request, ctx: RouteContext<"/api/proxy/[...path]">) {
  const { path } = await ctx.params;
  return proxyApi(endpointFromRequest(request, path), { cache: "no-store" });
}

export async function POST(request: Request, ctx: RouteContext<"/api/proxy/[...path]">) {
  const { path } = await ctx.params;
  return proxyApi(endpointFromRequest(request, path), {
    method: "POST",
    body: await readBody(request),
  });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/proxy/[...path]">) {
  const { path } = await ctx.params;
  return proxyApi(endpointFromRequest(request, path), {
    method: "PATCH",
    body: await readBody(request),
  });
}

export async function PUT(request: Request, ctx: RouteContext<"/api/proxy/[...path]">) {
  const { path } = await ctx.params;
  return proxyApi(endpointFromRequest(request, path), {
    method: "PUT",
    body: await readBody(request),
  });
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/proxy/[...path]">) {
  const { path } = await ctx.params;
  return proxyApi(endpointFromRequest(request, path), {
    method: "DELETE",
    body: await readBody(request),
  });
}
