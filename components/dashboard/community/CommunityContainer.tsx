import { fetchApi } from "@/lib/fetchApi";
import CommunityChat, { type Community } from "./CommunityChat";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default async function CommunityContainer({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const selectedCommunityId =
    typeof resolvedParams.community === "string"
      ? resolvedParams.community
      : typeof resolvedParams.community_id === "string"
        ? resolvedParams.community_id
      : undefined;
  const resourceReferenceId =
    typeof resolvedParams.resource_reference_id === "string"
      ? resolvedParams.resource_reference_id
      : undefined;
  const resourceName =
    typeof resolvedParams.resource_name === "string"
      ? resolvedParams.resource_name
      : undefined;
  const resourceSlug =
    typeof resolvedParams.resource_slug === "string"
      ? resolvedParams.resource_slug
      : undefined;

  let communities: Community[] = [];
  let error: string | null = null;

  try {
    const res = await fetchApi("/community", { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Failed to load your communities.");
    }

    const json = await res.json().catch(() => ({}));
    communities = Array.isArray(json?.data) ? json.data : [];
  } catch (err: unknown) {
    error = getErrorMessage(
      err,
      "An error occurred while loading Community.",
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[1500px] flex-col gap-5 py-5 lg:py-7">
      <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#2D6A4F] dark:text-[#74c69d]">
            Instructor Community
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">
            Community conversations
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Talk with colleagues, share resources, and keep up with the
            platform-wide General and Help rooms.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : (
        <CommunityChat
          initialCommunities={communities}
          selectedCommunityId={selectedCommunityId}
          initialResourceShare={
            resourceReferenceId
              ? {
                  id: resourceReferenceId,
                  name: resourceName || "Shared resource",
                  slug: resourceSlug,
                }
              : null
          }
        />
      )}
    </div>
  );
}
