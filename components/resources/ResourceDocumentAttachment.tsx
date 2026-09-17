import { ResourceAttachment } from "@/lib/resources";
import { Eye, FileText } from "lucide-react";
import Link from "next/link";
import { ResourceDownloadButton } from "@/components/resources/ResourceDownloadButton";

type ResourceDocumentAttachmentProps = {
  attachment: ResourceAttachment;
  slug: string;
  canAccess: boolean;
};

export function ResourceDocumentAttachment({
  attachment,
  slug,
  canAccess,
}: ResourceDocumentAttachmentProps) {
  const downloadable = canAccess && attachment.document?.downloadable === true;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-[#e7f6ee] text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#b7e4c7]">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
              {attachment.title || attachment.document?.file_name || "Document"}
            </h3>
            <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
              {[attachment.document?.file_name, formatFileSize(attachment.document?.file_size_bytes)]
                .filter(Boolean)
                .join(" · ") || "Document attachment"}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/resources/${slug}/attachments/${attachment.id}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-3 text-sm font-extrabold text-white transition hover:bg-[#1B4332] dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d]"
            >
              <Eye className="h-4 w-4" />
              View
            </Link>

            {downloadable && (
              <ResourceDownloadButton slug={slug} attachmentId={attachment.id} />
            )}
          </div>
          {!downloadable && (
            <p className="max-w-72 text-xs font-semibold text-slate-500 dark:text-slate-400">
              View-only document. Downloads are disabled by the instructor.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function formatFileSize(bytes?: number) {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
