"use client";

import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Cloud, Fingerprint, KeyRound, Laptop, Pencil, Plus, Trash2, X } from "lucide-react";
import { IconSpinner } from "@/components/auth/shared/icons";
import {
  addPasskey,
  listPasskeys,
  type Passkey,
  PasskeyError,
  passkeysSupported,
  removePasskey,
  renamePasskey,
} from "@/lib/passkeys";

const noopSubscribe = () => () => {};
const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

function relative(iso?: string | null) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return dateFormat.format(new Date(iso));
}

export const PASSKEYS_QUERY_KEY = ["passkeys"];

/** Settings card for the signed-in user's passkeys. */
export function PasskeySettings() {
  const queryClient = useQueryClient();
  const supported = useSyncExternalStore(noopSubscribe, passkeysSupported, () => true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data: passkeys = [], isPending, isError } = useQuery({
    queryKey: PASSKEYS_QUERY_KEY,
    queryFn: listPasskeys,
    staleTime: 30_000,
  });

  const add = useMutation({
    mutationFn: () => addPasskey(),
    onSuccess: (passkey) => {
      queryClient.setQueryData<Passkey[]>(PASSKEYS_QUERY_KEY, (current = []) => [passkey, ...current]);
      toast.success("Passkey added. Next time, sign in with your fingerprint or face.");
    },
    onError: (error: PasskeyError) => {
      if (!error.cancelled) toast.error(error.message);
    },
  });

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renamePasskey(id, name),
    onSuccess: (passkey) => {
      queryClient.setQueryData<Passkey[]>(PASSKEYS_QUERY_KEY, (current = []) => current.map((p) => (p.id === passkey.id ? passkey : p)));
      setEditingId(null);
      toast.success("Passkey renamed.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removePasskey(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Passkey[]>(PASSKEYS_QUERY_KEY, (current = []) => current.filter((p) => p.id !== id));
      setConfirmId(null);
      toast.success("Passkey removed. It can no longer be used to sign in.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const startRename = (passkey: Passkey) => {
    setEditingId(passkey.id);
    setDraftName(passkey.name);
    setConfirmId(null);
  };

  return (
    <div className="max-w-4xl">
      <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center flex-shrink-0">
              <Fingerprint className="w-6 h-6 text-[#2D6A4F] dark:text-[#52b788]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Passkeys</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl">
                Sign in with your fingerprint, face or screen lock instead of a password and code. Your
                fingerprint never leaves your device.
              </p>
            </div>
          </div>
          {supported && (
            <button
              type="button"
              onClick={() => add.mutate()}
              disabled={add.isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2D6A4F] px-5 text-sm font-semibold text-white transition-all hover:bg-[#1B4332] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-progress disabled:opacity-70 shadow-md shadow-[#2D6A4F]/20"
            >
              {add.isPending ? <IconSpinner className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
              {add.isPending ? "Follow your device’s prompt…" : passkeys.length ? "Add another passkey" : "Add a passkey"}
            </button>
          )}
        </div>

        {!supported && (
          <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
            This browser does not support passkeys. Try the latest Chrome, Safari, Edge or Firefox.
          </p>
        )}

        {isPending ? (
          <div className="flex h-24 items-center justify-center">
            <IconSpinner className="h-6 w-6 animate-spin text-[#2D6A4F]" />
          </div>
        ) : isError ? (
          <p className="text-sm text-red-600 dark:text-red-400">We could not load your passkeys. Refresh the page to try again.</p>
        ) : passkeys.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center dark:border-gray-800">
            <KeyRound className="mx-auto mb-3 h-8 w-8 text-gray-400" aria-hidden="true" />
            <p className="font-semibold text-gray-900 dark:text-white">No passkeys yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
              Add one on each phone or computer you use. Passkeys saved to iCloud Keychain or Google Password Manager also
              work on your other signed-in devices.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800" aria-label="Your passkeys">
            {passkeys.map((passkey) => {
              const editing = editingId === passkey.id;
              const confirming = confirmId === passkey.id;
              return (
                <li key={passkey.id} className="flex flex-wrap items-center gap-4 py-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F] dark:bg-[#52b788]/10 dark:text-[#52b788]">
                    {passkey.synced ? <Cloud className="h-5 w-5" aria-hidden="true" /> : <Laptop className="h-5 w-5" aria-hidden="true" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    {editing ? (
                      <form
                        className="flex flex-wrap items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (draftName.trim()) rename.mutate({ id: passkey.id, name: draftName.trim() });
                        }}
                      >
                        <label htmlFor={`passkey-name-${passkey.id}`} className="sr-only">Passkey name</label>
                        <input
                          id={`passkey-name-${passkey.id}`}
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          maxLength={100}
                          autoFocus
                          onKeyDown={(e) => e.key === "Escape" && setEditingId(null)}
                          className="h-10 min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-base text-gray-900 outline-none focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#2D6A4F]/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        />
                        <button type="submit" disabled={rename.isPending} className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#2D6A4F] text-white" aria-label="Save name">
                          {rename.isPending ? <IconSpinner className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300" aria-label="Cancel renaming">
                          <X className="h-4 w-4" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{passkey.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {[
                            passkey.provider,
                            passkey.synced ? "Synced across your devices" : "This device only",
                            `Added ${dateFormat.format(new Date(passkey.created_at))}`,
                            passkey.last_used_at ? `Last used ${relative(passkey.last_used_at)}` : "Not used yet",
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </>
                    )}
                  </div>
                  {!editing && (
                    <div className="flex items-center gap-2">
                      {confirming ? (
                        <>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Remove this passkey?</span>
                          <button
                            type="button"
                            onClick={() => remove.mutate(passkey.id)}
                            disabled={remove.isPending}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            {remove.isPending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Remove
                          </button>
                          <button type="button" onClick={() => setConfirmId(null)} className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300">
                            Keep
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => startRename(passkey)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white" aria-label={`Rename ${passkey.name}`}>
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => { setConfirmId(passkey.id); setEditingId(null); }} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10" aria-label={`Remove ${passkey.name}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
