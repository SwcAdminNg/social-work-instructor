"use client";

import { useState } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import * as RadixMenu from "@radix-ui/react-dropdown-menu";
import { AlertTriangle, X, type LucideIcon } from "lucide-react";
import { Button, Field, Textarea, cn } from "./primitives";

/* ───────────────────────── Dialog ───────────────────────── */

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  iconTone?: "brand" | "danger" | "warning" | "violet";
  size?: "sm" | "md" | "lg" | "xl";
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** Prevent closing by clicking outside (e.g. while a request is in flight). */
  dismissible?: boolean;
};

const ICON_TONE = {
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-400/12 dark:text-brand-300",
  danger: "bg-rose-50 text-rose-600 dark:bg-rose-500/12 dark:text-rose-300",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/12 dark:text-amber-300",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/12 dark:text-violet-300",
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  iconTone = "brand",
  size = "md",
  children,
  footer,
  dismissible = true,
}: DialogProps) {
  const width = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];
  return (
    <RadixDialog.Root open={open} onOpenChange={(v) => (dismissible || v ? onOpenChange(v) : undefined)}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[60] animate-fade-in bg-slate-950/50 backdrop-blur-[2px]" />
        <RadixDialog.Content
          onInteractOutside={(e) => !dismissible && e.preventDefault()}
          className={cn(
            "fixed left-1/2 top-1/2 z-[61] flex max-h-[min(90vh,52rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_32px_80px_-24px_rgba(15,23,42,0.45)] outline-none dark:border-ink-line dark:bg-ink-surface",
            width,
          )}
        >
          <div className="animate-pop-in flex min-h-0 flex-1 flex-col">
            <div className="flex items-start gap-4 border-b border-slate-100 px-6 pb-4 pt-5 dark:border-ink-line">
              {Icon && (
                <span className={cn("grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl", ICON_TONE[iconTone])}>
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <RadixDialog.Title className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  {title}
                </RadixDialog.Title>
                {description ? (
                  <RadixDialog.Description className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {description}
                  </RadixDialog.Description>
                ) : (
                  <RadixDialog.Description className="sr-only">{typeof title === "string" ? title : "Dialog"}</RadixDialog.Description>
                )}
              </div>
              <RadixDialog.Close asChild>
                <Button variant="ghost" size="sm" iconOnly icon={X} aria-label="Close" className="-mr-2 -mt-1" />
              </RadixDialog.Close>
            </div>
            {children && <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>}
            {footer && (
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-end dark:border-ink-line dark:bg-white/[0.02]">
                {footer}
              </div>
            )}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/* ───────────────────────── Sheet (side drawer) ───────────────────────── */

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  width = "max-w-2xl",
  headerExtra,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  headerExtra?: React.ReactNode;
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[60] animate-fade-in bg-slate-950/40 backdrop-blur-[2px]" />
        <RadixDialog.Content
          className={cn(
            "fixed inset-y-0 right-0 z-[61] flex w-full animate-slide-in-right flex-col border-l border-slate-200 bg-[#fbfbfd] shadow-[-24px_0_60px_-30px_rgba(15,23,42,0.4)] outline-none dark:border-ink-line dark:bg-ink-page",
            width,
          )}
        >
          <div className="flex items-start gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:px-6 dark:border-ink-line dark:bg-ink-surface">
            <div className="min-w-0 flex-1">
              <RadixDialog.Title className="truncate font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {title}
              </RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</RadixDialog.Description>
              ) : (
                <RadixDialog.Description className="sr-only">{typeof title === "string" ? title : "Panel"}</RadixDialog.Description>
              )}
              {headerExtra && <div className="mt-3">{headerExtra}</div>}
            </div>
            <RadixDialog.Close asChild>
              <Button variant="ghost" size="sm" iconOnly icon={X} aria-label="Close" className="-mr-2" />
            </RadixDialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          {footer && (
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3.5 sm:px-6 dark:border-ink-line dark:bg-ink-surface">
              {footer}
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/* ───────────────────────── Confirm ───────────────────────── */

/**
 * Confirmation dialog. `onConfirm` may be async; the dialog stays open with a
 * spinner until it resolves and closes on success. Throwing keeps it open.
 * Pass `reason` to collect a typed note (e.g. "why are you archiving?").
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "danger",
  onConfirm,
  reason,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "brand" | "warning";
  onConfirm: (reason: string) => unknown | Promise<unknown>;
  reason?: { label: string; placeholder?: string; required?: boolean; minLength?: number };
  children?: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const tooShort = !!reason && (reason.required || (reason.minLength ?? 0) > 0) && text.trim().length < (reason.minLength ?? 1);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm(text.trim());
      setText("");
      onOpenChange(false);
    } catch {
      // the caller reports the error (toast); keep the dialog open
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !busy && onOpenChange(v)}
      dismissible={!busy}
      size="sm"
      icon={AlertTriangle}
      iconTone={tone}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} loading={busy} disabled={tooShort} onClick={confirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
      {reason && (
        <Field
          label={reason.label}
          optional={!reason.required && !reason.minLength}
          hint={reason.minLength ? `At least ${reason.minLength} characters.` : undefined}
          className={children ? "mt-4" : undefined}
        >
          <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={reason.placeholder} autoFocus />
        </Field>
      )}
    </Dialog>
  );
}

/* ───────────────────────── Menu ───────────────────────── */

export type MenuItem =
  | { label: string; icon?: LucideIcon; onSelect: () => void; danger?: boolean; disabled?: boolean; hint?: string }
  | "separator";

export function Menu({ trigger, items, align = "end" }: { trigger: React.ReactNode; items: MenuItem[]; align?: "start" | "end" }) {
  return (
    <RadixMenu.Root modal={false}>
      <RadixMenu.Trigger asChild>{trigger}</RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content
          align={align}
          sideOffset={6}
          className="z-[70] min-w-48 animate-pop-in rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_48px_-16px_rgba(15,23,42,0.35)] dark:border-ink-line dark:bg-ink-raised"
        >
          {items.map((item, i) =>
            item === "separator" ? (
              <RadixMenu.Separator key={i} className="my-1 h-px bg-slate-100 dark:bg-ink-line" />
            ) : (
              <RadixMenu.Item
                key={item.label}
                disabled={item.disabled}
                onSelect={item.onSelect}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40",
                  item.danger
                    ? "text-rose-600 data-[highlighted]:bg-rose-50 dark:text-rose-300 dark:data-[highlighted]:bg-rose-500/10"
                    : "text-slate-700 data-[highlighted]:bg-slate-100 dark:text-slate-200 dark:data-[highlighted]:bg-white/8",
                )}
              >
                {item.icon && <item.icon className="h-4 w-4 flex-shrink-0 opacity-80" />}
                <span className="flex-1">{item.label}</span>
                {item.hint && <span className="text-xs text-slate-400">{item.hint}</span>}
              </RadixMenu.Item>
            ),
          )}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
}
