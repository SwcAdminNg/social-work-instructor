"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Download,
  FileCheck2,
  FileText,
  FolderOpen,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { IconSpinner } from "@/components/auth/shared/icons";
import { formatBytes } from "@/lib/formatBytes";

type InstructorDocument = {
  id: string;
  name: string;
  file_name: string;
  mime_type?: string | null;
  file_size_bytes?: number | null;
  download_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

type ProfileUserWithCv = {
  cv_file_name?: string | null;
};

type UploadUrlData = {
  upload_url?: string;
  cv_file_name?: string;
  document_id?: string;
};

type MutationState = {
  cv?: boolean;
  create?: boolean;
  replaceId?: string | null;
  renameId?: string | null;
  deleteId?: string | null;
};

function getMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

async function putFile(uploadUrl: string, file: File) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });

  if (!res.ok) {
    throw new Error("The file upload failed. Please choose the file again.");
  }
}

async function parseJson(res: Response) {
  return res.json().catch(() => ({}));
}

function fileMeta(document: InstructorDocument) {
  return [
    document.file_name,
    typeof document.file_size_bytes === "number"
      ? formatBytes(document.file_size_bytes)
      : null,
  ]
    .filter(Boolean)
    .join(" • ");
}

export function InstructorDocumentsSettings() {
  const queryClient = useQueryClient();
  const cvInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [documentName, setDocumentName] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [mutation, setMutation] = useState<MutationState>({});

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<ProfileUserWithCv> => {
      const res = await fetch("/api/proxy/users/me");
      if (!res.ok) throw new Error("Failed to load profile.");
      const json = await parseJson(res);
      return json.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: documents = [],
    isPending: documentsLoading,
  } = useQuery({
    queryKey: ["instructor-documents"],
    queryFn: async (): Promise<InstructorDocument[]> => {
      const res = await fetch("/api/proxy/users/me/documents");
      const json = await parseJson(res);
      if (!res.ok) {
        throw new Error(json.message || "Failed to load instructor documents.");
      }
      return Array.isArray(json.data) ? json.data : [];
    },
  });

  async function uploadCv(file: File) {
    setMutation((current) => ({ ...current, cv: true }));
    try {
      const res = await fetch("/api/proxy/users/me/cv-upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_name: file.name,
          content_type: file.type || "application/octet-stream",
        }),
      });
      const json = await parseJson(res);
      if (!res.ok) throw new Error(json.message || "Could not prepare CV upload.");

      const data: UploadUrlData = json.data || {};
      if (!data.upload_url) throw new Error("The CV upload response was incomplete.");

      await putFile(data.upload_url, file);
      queryClient.setQueryData<ProfileUserWithCv | undefined>(
        ["profile"],
        (current) =>
          current
            ? { ...current, cv_file_name: data.cv_file_name || file.name }
            : current,
      );
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("CV uploaded successfully.");
    } catch (error) {
      toast.error(getMessage(error, "Failed to upload CV."));
    } finally {
      setMutation((current) => ({ ...current, cv: false }));
    }
  }

  async function downloadCv() {
    try {
      const res = await fetch("/api/proxy/users/me/cv-download-url");
      const json = await parseJson(res);
      if (!res.ok) throw new Error(json.message || "No CV is available yet.");
      const url = json?.data?.download_url;
      if (!url) throw new Error("The CV download response was incomplete.");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(getMessage(error, "Could not open your CV."));
    }
  }

  async function createDocument() {
    if (!documentName.trim()) {
      toast.error("Give this document a name first.");
      return;
    }
    if (!documentFile) {
      toast.error("Choose a file before uploading.");
      return;
    }

    setMutation((current) => ({ ...current, create: true }));
    try {
      const res = await fetch("/api/proxy/users/me/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: documentName.trim(),
          file_name: documentFile.name,
          content_type: documentFile.type || "application/octet-stream",
        }),
      });
      const json = await parseJson(res);
      if (!res.ok) throw new Error(json.message || "Could not prepare document upload.");

      const uploadUrl = json?.data?.upload_url;
      if (!uploadUrl) throw new Error("The document upload response was incomplete.");

      await putFile(uploadUrl, documentFile);
      setDocumentName("");
      setDocumentFile(null);
      if (documentInputRef.current) documentInputRef.current.value = "";
      await queryClient.invalidateQueries({ queryKey: ["instructor-documents"] });
      toast.success("Document added successfully.");
    } catch (error) {
      toast.error(getMessage(error, "Failed to add document."));
    } finally {
      setMutation((current) => ({ ...current, create: false }));
    }
  }

  async function replaceDocument(document: InstructorDocument, file: File) {
    setMutation((current) => ({ ...current, replaceId: document.id }));
    try {
      const res = await fetch(
        `/api/proxy/users/me/documents/${document.id}/upload-url`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: document.name,
            file_name: file.name,
            content_type: file.type || "application/octet-stream",
          }),
        },
      );
      const json = await parseJson(res);
      if (!res.ok) throw new Error(json.message || "Could not prepare replacement.");
      const uploadUrl = json?.data?.upload_url;
      if (!uploadUrl) throw new Error("The replacement upload response was incomplete.");

      await putFile(uploadUrl, file);
      await queryClient.invalidateQueries({ queryKey: ["instructor-documents"] });
      toast.success("Document file replaced.");
    } catch (error) {
      toast.error(getMessage(error, "Failed to replace document."));
    } finally {
      setMutation((current) => ({ ...current, replaceId: null }));
    }
  }

  async function renameDocument(documentId: string) {
    if (!editingName.trim()) {
      toast.error("Document name cannot be empty.");
      return;
    }

    setMutation((current) => ({ ...current, renameId: documentId }));
    try {
      const res = await fetch(`/api/proxy/users/me/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      const json = await parseJson(res);
      if (!res.ok) throw new Error(json.message || "Could not rename document.");

      setEditingId(null);
      setEditingName("");
      await queryClient.invalidateQueries({ queryKey: ["instructor-documents"] });
      toast.success("Document renamed.");
    } catch (error) {
      toast.error(getMessage(error, "Failed to rename document."));
    } finally {
      setMutation((current) => ({ ...current, renameId: null }));
    }
  }

  async function deleteDocument(documentId: string) {
    setMutation((current) => ({ ...current, deleteId: documentId }));
    try {
      const res = await fetch(`/api/proxy/users/me/documents/${documentId}`, {
        method: "DELETE",
      });
      const json = await parseJson(res);
      if (!res.ok) throw new Error(json.message || "Could not delete document.");

      await queryClient.invalidateQueries({ queryKey: ["instructor-documents"] });
      toast.success("Document deleted.");
    } catch (error) {
      toast.error(getMessage(error, "Failed to delete document."));
    } finally {
      setMutation((current) => ({ ...current, deleteId: null }));
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Profile Documents
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
          Keep your instructor CV and supporting credentials current for profile
          verification and professional review.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-[#b7e4c7] bg-[#f1fbf6] p-6 text-[#173f2d] shadow-sm dark:border-[#2f6f55] dark:bg-[#10261c] dark:text-[#d8f3dc]">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-white text-[#2D6A4F] shadow-sm dark:bg-[#173326] dark:text-[#52b788]">
              <FileCheck2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold">Current CV</p>
              <p className="mt-1 truncate text-xs font-semibold text-[#315f49] dark:text-[#b7e4c7]">
                {profile?.cv_file_name || "No CV uploaded yet"}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row xl:flex-col">
            <button
              type="button"
              onClick={() => cvInputRef.current?.click()}
              disabled={mutation.cv}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-4 text-sm font-bold text-white transition hover:bg-[#1B4332] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#52b788] dark:text-[#06130d] dark:hover:bg-[#74c69d]"
            >
              {mutation.cv ? (
                <IconSpinner className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
              {profile?.cv_file_name ? "Replace CV" : "Upload CV"}
            </button>
            <button
              type="button"
              onClick={downloadCv}
              disabled={!profile?.cv_file_name}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#a6d8bd] bg-white px-4 text-sm font-bold text-[#2D6A4F] transition hover:bg-[#e7f6ee] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#2f6f55] dark:bg-[#173326] dark:text-[#b7e4c7] dark:hover:bg-[#1d3d2e]"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>

          <input
            ref={cvInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) uploadCv(file);
            }}
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#121212]">
          <div className="mb-5 flex items-start gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-[#2D6A4F]/10 text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#52b788]">
              <Plus className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                Add Supporting Document
              </h3>
              <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                Upload licenses, certifications, letters, or other named files.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_auto]">
            <input
              type="text"
              value={documentName}
              onChange={(event) => setDocumentName(event.target.value)}
              placeholder="Document name, e.g. License"
              className="h-11 rounded-md border border-gray-200 bg-gray-50 px-4 text-sm font-medium outline-none transition focus:border-[#2D6A4F] focus:bg-white focus:ring-2 focus:ring-[#2D6A4F]/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:bg-gray-900"
            />
            <label className="flex h-11 min-w-0 cursor-pointer items-center gap-2 rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 text-sm font-bold text-gray-600 transition hover:border-[#2D6A4F] hover:text-[#2D6A4F] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {documentFile ? documentFile.name : "Choose file"}
              </span>
              <input
                ref={documentInputRef}
                type="file"
                className="sr-only"
                onChange={(event) => setDocumentFile(event.target.files?.[0] || null)}
              />
            </label>
            <button
              type="button"
              onClick={createDocument}
              disabled={mutation.create}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-5 text-sm font-bold text-white transition hover:bg-[#1B4332] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {mutation.create ? (
                <IconSpinner className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
              Upload
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#121212]">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
              Supporting Documents
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Each download link is refreshed when the list loads.
            </p>
          </div>
          <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-extrabold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {documents.length}
          </span>
        </div>

        {documentsLoading ? (
          <div className="flex h-32 items-center justify-center">
            <IconSpinner className="h-7 w-7 animate-spin text-[#2D6A4F]" />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-md bg-[#2D6A4F]/10 text-[#2D6A4F] dark:bg-[#52b788]/15 dark:text-[#52b788]">
              <FolderOpen className="h-6 w-6" />
            </span>
            <div>
              <p className="font-extrabold text-gray-900 dark:text-white">
                No supporting documents yet
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add the credentials you want available from your instructor profile.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {documents.map((document) => {
              const isEditing = editingId === document.id;
              const busy =
                mutation.replaceId === document.id ||
                mutation.renameId === document.id ||
                mutation.deleteId === document.id;

              return (
                <li
                  key={document.id}
                  className="grid grid-cols-1 gap-4 px-6 py-5 lg:grid-cols-[1fr_auto]"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <input
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          className="h-10 w-full max-w-md rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-bold outline-none transition focus:border-[#2D6A4F] focus:bg-white focus:ring-2 focus:ring-[#2D6A4F]/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        />
                      ) : (
                        <p className="truncate text-sm font-extrabold text-gray-900 dark:text-white">
                          {document.name}
                        </p>
                      )}
                      <p className="mt-1 truncate text-xs font-medium text-gray-500 dark:text-gray-400">
                        {fileMeta(document)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => renameDocument(document.id)}
                          disabled={busy}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#2D6A4F] px-3 text-xs font-bold text-white transition hover:bg-[#1B4332] disabled:opacity-70"
                        >
                          {mutation.renameId === document.id ? (
                            <IconSpinner className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditingName("");
                          }}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                          aria-label="Cancel rename"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <a
                          href={document.download_url || "#"}
                          target="_blank"
                          rel="noreferrer"
                          aria-disabled={!document.download_url}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gray-200 px-3 text-xs font-bold text-gray-700 transition hover:bg-gray-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Open
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(document.id);
                            setEditingName(document.name);
                          }}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gray-200 px-3 text-xs font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => replaceInputRefs.current[document.id]?.click()}
                          disabled={busy}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gray-200 px-3 text-xs font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-70 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          {mutation.replaceId === document.id ? (
                            <IconSpinner className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDocument(document.id)}
                          disabled={busy}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-red-200 px-3 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-70 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-950/20"
                        >
                          {mutation.deleteId === document.id ? (
                            <IconSpinner className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Delete
                        </button>
                        <input
                          ref={(node) => {
                            replaceInputRefs.current[document.id] = node;
                          }}
                          type="file"
                          className="sr-only"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (file) replaceDocument(document, file);
                          }}
                        />
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
