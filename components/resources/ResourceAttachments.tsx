import { ResourceAttachment, ResourceRead, formatDuration } from "@/lib/resources";
import { ResourceDocumentAttachment } from "@/components/resources/ResourceDocumentAttachment";
import { ExternalLink, Link2, Lock, PlayCircle } from "lucide-react";
import Link from "next/link";

type ResourceAttachmentsProps = {
  resource: ResourceRead;
};

export function ResourceAttachments({ resource }: ResourceAttachmentsProps) {
  if (resource.can_access === false) {
    const loginRequired = resource.access_reason === "LOGIN_REQUIRED";
    const href = loginRequired
      ? `/login?callbackUrl=/resources/${resource.slug || resource.id}`
      : resource.course_id
        ? `/courses/${resource.course_id}`
        : "/courses";

    return (
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/60">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm dark:bg-slate-950 dark:text-slate-300">
          <Lock className="h-6 w-6" />
        </span>
        <h2 className="mt-5 text-2xl font-extrabold text-slate-950 dark:text-white">
          {loginRequired ? "Log in to unlock this resource" : "Enroll to unlock this resource"}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
          {loginRequired
            ? "Create an account or log in to access the documents, links, and recordings attached to this library entry."
            : "This resource is part of a course library. Once you are enrolled, the attachments open automatically here."}
        </p>
        <Link
          href={href}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[#2D6A4F] px-5 text-sm font-extrabold text-white shadow-sm shadow-[#2D6A4F]/20 transition hover:bg-[#1B4332] dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d]"
        >
          {loginRequired ? "Log in" : "View course"}
        </Link>
      </section>
    );
  }

  const attachments = [...(resource.attachments || [])].sort(
    (a, b) => (a.order_index || 0) - (b.order_index || 0),
  );

  if (attachments.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Attachments are not available for this resource yet.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white">
        Attachments
      </h2>
      <div className="space-y-4">
        {attachments.map((attachment) => (
          <AttachmentCard
            key={attachment.id}
            attachment={attachment}
            slug={resource.slug || resource.id}
            canAccess={resource.can_access === true}
          />
        ))}
      </div>
    </section>
  );
}

function AttachmentCard({
  attachment,
  slug,
  canAccess,
}: {
  attachment: ResourceAttachment;
  slug: string;
  canAccess: boolean;
}) {
  if (attachment.attachment_type === "VIDEO") {
    const duration = formatDuration(attachment.video?.duration_seconds);
    const isReady = attachment.video?.status === "READY" && attachment.video?.playback_url;

    return (
      <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <PlayCircle className="h-5 w-5 text-[#2D6A4F] dark:text-[#b7e4c7]" />
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-sm font-extrabold text-slate-950 dark:text-white">
              {attachment.title || "Video"}
            </h3>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {isReady ? duration || "Ready to watch" : attachment.video?.status || "Processing"}
            </p>
          </div>
        </div>
        {isReady ? (
          <div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Open this recording in a focused video player.
              </p>
            </div>
            <Link
              href={`/resources/${slug}/attachments/${attachment.id}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-4 text-sm font-extrabold text-white transition hover:bg-[#1B4332] dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d]"
            >
              <PlayCircle className="h-4 w-4" />
              Watch
            </Link>
          </div>
        ) : (
          <div className="p-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            This video is still being prepared.
          </div>
        )}
      </article>
    );
  }

  if (attachment.attachment_type === "LINKS") {
    const label = attachment.link?.label || attachment.title || "Open link";
    return (
      <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-[#e7f6ee] text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]">
              <Link2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                {label}
              </h3>
              {attachment.link?.description && (
                <p className="mt-1 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">
                  {attachment.link.description}
                </p>
              )}
              {attachment.link?.url && (
                <p className="mt-2 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {attachment.link.url}
                </p>
              )}
            </div>
          </div>
          {attachment.link?.url && (
            <a
              href={attachment.link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 flex-shrink-0 items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-4 text-sm font-extrabold text-white transition hover:bg-[#1B4332] dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d]"
            >
              <ExternalLink className="h-4 w-4" />
              Open
            </a>
          )}
        </div>
      </article>
    );
  }

  return (
    <ResourceDocumentAttachment
      attachment={attachment}
      slug={slug}
      canAccess={canAccess}
    />
  );
}
