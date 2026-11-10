"use client";

import { forwardRef, useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import * as Select from "@radix-ui/react-select";
import { AlertCircle, Check, ChevronDown, Loader2 } from "lucide-react";

/**
 * The form controls used by every public form. Each one draws the same
 * shell: a soft filled field whose label lifts out of the way, with hint and
 * error text wired up for screen readers. Styles live under ".swf" in
 * app/globals.css.
 */

const join = (...ids: (string | false | null | undefined)[]) => ids.filter(Boolean).join(" ") || undefined;

const noopSubscribe = () => () => {};
/** False while server rendering and hydrating, true afterwards. */
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

type Shared = {
  id: string;
  label: string;
  required?: boolean;
  /** Mark the label "(optional)". */
  optional?: boolean;
  error?: string;
  hint?: ReactNode;
  disabled?: boolean;
  /** Ids of other text that describes the field. */
  describedBy?: string;
};

function LabelText({ label, required, optional }: Pick<Shared, "label" | "required" | "optional">) {
  return (
    <>
      {label}
      {required && <span className="swf-req" aria-hidden="true">*</span>}
      {optional && <span className="swf-opt"> (optional)</span>}
    </>
  );
}

function Below({ id, error, hint, children }: { id: string; error?: string; hint?: ReactNode; children?: ReactNode }) {
  return (
    <>
      {hint && !error && <p id={`${id}-hint`} className="swf-hint">{hint}</p>}
      {children}
      {error && (
        <p id={`${id}-error`} className="swf-error">
          <AlertCircle size={15} aria-hidden="true" />
          {error}
        </p>
      )}
    </>
  );
}

/* ── Single-line field ── */

type TextFieldProps = Shared & {
  name?: string;
  type?: "text" | "email" | "tel" | "url" | "search";
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  icon?: ReactNode;
  autoComplete?: string;
  maxLength?: number;
  /** Shows a tick once the value is good. */
  valid?: boolean;
  /** Extra control under the field, such as a one-tap suggestion. */
  children?: ReactNode;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { id, name, label, type = "text", value, onChange, onBlur, icon, autoComplete, maxLength, valid, required, optional, error, hint, disabled, describedBy, children },
  ref,
) {
  const status = error ? "invalid" : valid ? "valid" : undefined;
  return (
    <div className="swf" data-invalid={error ? "" : undefined} data-disabled={disabled ? "" : undefined}>
      <div className="swf-shell" data-icon={icon ? "" : undefined} data-status={status ? "" : undefined}>
        {icon && <span className="swf-icon" aria-hidden="true">{icon}</span>}
        <input
          ref={ref}
          id={id}
          name={name}
          type={type}
          inputMode={type === "email" ? "email" : type === "tel" ? "tel" : undefined}
          className="swf-input"
          placeholder=" "
          value={value}
          autoComplete={autoComplete}
          autoCapitalize={type === "email" ? "none" : undefined}
          spellCheck={type === "email" ? false : undefined}
          maxLength={maxLength}
          required={required}
          aria-required={required || undefined}
          aria-invalid={!!error || undefined}
          aria-describedby={join(Boolean(hint) && !error && `${id}-hint`, describedBy, error && `${id}-error`)}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
        <label htmlFor={id} className="swf-label">
          <LabelText label={label} required={required} optional={optional} />
        </label>
        {status && (
          <span key={status} className="swf-status" data-kind={status} aria-hidden="true">
            {status === "valid" ? <Check size={14} strokeWidth={3} /> : <AlertCircle size={15} />}
          </span>
        )}
      </div>
      <Below id={id} error={error} hint={hint}>{children}</Below>
    </div>
  );
});

/* ── Long text ── */

type TextAreaProps = Shared & {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  maxLength: number;
  /** Starting height in rows of text. */
  rows?: number;
};

const RING = 2 * Math.PI * 8;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { id, name, label, value, onChange, onBlur, placeholder, maxLength, rows, required, optional, error, hint, disabled, describedBy },
  ref,
) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);
  const used = Math.min(1, value.length / maxLength);

  // Grow with the text where the browser cannot size the field by itself.
  useEffect(() => {
    const el = innerRef.current;
    if (!el || CSS.supports("field-sizing", "content")) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className="swf" data-invalid={error ? "" : undefined} data-disabled={disabled ? "" : undefined}>
      <div className="swf-shell swf-shell--area">
        <textarea
          ref={(node) => {
            innerRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          id={id}
          name={name}
          className="swf-input swf-textarea"
          style={rows ? { minHeight: `${rows * 1.5 + 2.6}rem` } : undefined}
          placeholder={placeholder || " "}
          value={value}
          maxLength={maxLength}
          required={required}
          aria-required={required || undefined}
          aria-invalid={!!error || undefined}
          aria-describedby={join(Boolean(hint) && !error && `${id}-hint`, describedBy, error && `${id}-error`)}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
        />
        <label htmlFor={id} className="swf-label">
          <LabelText label={label} required={required} optional={optional} />
        </label>
        <div className="swf-area-foot" data-near={used > 0.9 ? "" : undefined} aria-hidden="true">
          <span>
            {value.length}/{maxLength}
          </span>
          <svg className="swf-ring" width="20" height="20" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8" />
            <circle cx="10" cy="10" r="8" strokeDasharray={RING} strokeDashoffset={RING * (1 - used)} />
          </svg>
        </div>
      </div>
      <Below id={id} error={error} hint={hint} />
    </div>
  );
});

/* ── Select ── */

export type Option = { value: string; label: string };

type SelectFieldProps = Shared & {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: Option[];
  /** Shown while nothing is chosen. */
  placeholder?: string;
  /** A choosable first entry that stands for "no value", such as "All topics". */
  emptyLabel?: string;
  /** A shorter, pill-shaped field for filter bars. */
  compact?: boolean;
};

// Radix does not allow an empty string as an item value.
const NONE = "__none__";

export function SelectField({
  id, name, label, value, onChange, onBlur, options, placeholder = "Choose one", emptyLabel, compact, required, optional, error, hint, disabled, describedBy,
}: SelectFieldProps) {
  const hydrated = useHydrated();
  const shell = `swf-shell${compact ? " swf-shell--compact" : ""}`;
  const described = join(Boolean(hint) && !error && `${id}-hint`, describedBy, error && `${id}-error`);
  const labelEl = (
    <label htmlFor={id} className="swf-label">
      <LabelText label={label} required={required} optional={optional} />
    </label>
  );

  return (
    <div className="swf" data-invalid={error ? "" : undefined} data-disabled={disabled ? "" : undefined}>
      {hydrated ? (
        <Select.Root
          value={value || (emptyLabel ? NONE : "")}
          onValueChange={(next) => onChange(next === NONE ? "" : next)}
          onOpenChange={(open) => {
            if (!open) onBlur?.();
          }}
          disabled={disabled}
        >
          <SelectShell className={shell}>
            <Select.Trigger
              id={id}
              className="swf-input swf-select"
              aria-required={required || undefined}
              aria-invalid={!!error || undefined}
              aria-describedby={described}
            >
              <Select.Value placeholder={placeholder} />
            </Select.Trigger>
            {labelEl}
            <span className="swf-chevron" aria-hidden="true">
              <ChevronDown size={17} />
            </span>
          </SelectShell>
          {name && <input type="hidden" name={name} value={value} />}
          <Select.Portal>
            <Select.Content className="swf-menu" position="popper" sideOffset={8} collisionPadding={12} data-lenis-prevent>
              <Select.Viewport className="swf-menu-view">
                {emptyLabel && <Item value={NONE}>{emptyLabel}</Item>}
                {options.map((option) => (
                  <Item key={option.value} value={option.value}>
                    {option.label}
                  </Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      ) : (
        // Before the page is interactive (or without JavaScript) a native select does the job.
        <div className={shell} data-lifted="">
          <select
            id={id}
            name={name}
            className="swf-input swf-select"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-required={required || undefined}
            aria-invalid={!!error || undefined}
            aria-describedby={described}
            disabled={disabled}
          >
            <option value="">{emptyLabel ?? placeholder}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {labelEl}
          <span className="swf-chevron" aria-hidden="true">
            <ChevronDown size={17} />
          </span>
        </div>
      )}
      <Below id={id} error={error} hint={hint} />
    </div>
  );
}

/** The shell needs to know when its menu is open, to turn the chevron. */
function SelectShell({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const shell = ref.current;
    const trigger = shell?.querySelector("[data-state]");
    if (!shell || !trigger) return;
    const sync = () => {
      if (trigger.getAttribute("data-state") === "open") shell.setAttribute("data-open", "");
      else shell.removeAttribute("data-open");
    };
    const observer = new MutationObserver(sync);
    observer.observe(trigger, { attributes: true, attributeFilter: ["data-state"] });
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} data-lifted="">
      {children}
    </div>
  );
}

function Item({ value, children }: { value: string; children: ReactNode }) {
  return (
    <Select.Item value={value} className="swf-option">
      <Select.ItemText>{children}</Select.ItemText>
      <Select.ItemIndicator className="swf-option-tick">
        <Check size={13} strokeWidth={3} />
      </Select.ItemIndicator>
    </Select.Item>
  );
}

/* ── One or several choices, as pills ── */

type ChoiceGroupProps = Omit<Shared, "label"> & {
  name: string;
  legend: string;
  /** "radio" picks one; "checkbox" picks any number. */
  type?: "radio" | "checkbox";
  options: Option[];
  /** The chosen values. */
  value: string[];
  onToggle: (value: string) => void;
};

export function ChoiceGroup({
  id, name, legend, type = "radio", options, value, onToggle, required, optional, error, hint, disabled, describedBy,
}: ChoiceGroupProps) {
  return (
    <fieldset
      className="swf-fieldset"
      aria-required={type === "radio" ? required || undefined : undefined}
      aria-invalid={!!error || undefined}
      aria-describedby={join(Boolean(hint) && !error && `${id}-hint`, describedBy, error && `${id}-error`)}
      disabled={disabled}
    >
      <legend className="swf-legend">
        <LabelText label={legend} required={required} optional={optional} />
      </legend>
      {/* Focusable by script so the error summary can jump here. */}
      <div id={id} tabIndex={-1} className="swf-chips" data-invalid={error ? "" : undefined}>
        {options.map((option) => (
          <label key={option.value} className="swf-chip">
            <input
              type={type}
              name={name}
              value={option.value}
              checked={value.includes(option.value)}
              onChange={() => onToggle(option.value)}
            />
            <span className="swf-chip-face">
              <span className="swf-chip-mark" aria-hidden="true">
                <Check size={13} strokeWidth={3} />
              </span>
              {option.label}
            </span>
          </label>
        ))}
      </div>
      <div className="mt-2.5 grid gap-2 empty:hidden">
        <Below id={id} error={error} hint={hint} />
      </div>
    </fieldset>
  );
}

/* ── Supporting pieces ── */

export function FormNote({ id, icon, children }: { id?: string; icon: ReactNode; children: ReactNode }) {
  return (
    <p id={id} className="swf-note">
      {icon}
      <span>{children}</span>
    </p>
  );
}

export const FormAlert = forwardRef<HTMLDivElement, { title: ReactNode; titleId?: string; children?: ReactNode }>(
  function FormAlert({ title, titleId, children }, ref) {
    return (
      <div ref={ref} tabIndex={-1} className="swf-alert" role="alert" aria-labelledby={titleId}>
        <AlertCircle size={20} aria-hidden="true" />
        <div>
          <h3 id={titleId}>{title}</h3>
          {children}
        </div>
      </div>
    );
  },
);

export function RequiredNote({ id }: { id?: string }) {
  return (
    <p id={id} className="swf-hint">
      Fields marked <span className="swf-req" aria-hidden="true">*</span>
      <span className="sr-only">with an asterisk</span> are required.
    </p>
  );
}

/** Spam trap: real visitors never see or fill this. */
export function SpamTrap() {
  return (
    <div className="swf-trap" aria-hidden="true">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

export function SubmitButton({ sending, sendingLabel = "Sending…", children }: { sending: boolean; sendingLabel?: string; children: ReactNode }) {
  return (
    <button type="submit" className="sw-btn swf-submit" disabled={sending} aria-disabled={sending}>
      <span>{sending ? sendingLabel : children}</span>
      <span className="sw-btn-dot" aria-hidden="true">
        {sending ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <>
            <SendArrow />
            <SendArrow />
          </>
        )}
      </span>
    </button>
  );
}

function SendArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export const FormSuccess = forwardRef<HTMLHeadingElement, { title: string; body: string; reference?: string | null; againLabel: string; onAgain: () => void }>(
  function FormSuccess({ title, body, reference, againLabel, onAgain }, ref) {
    return (
      <div className="swf-success" role="status">
        <span className="swf-success-mark" aria-hidden="true">
          <Check size={34} strokeWidth={2.5} />
        </span>
        <h3 ref={ref} tabIndex={-1} className="sw-display m-0 max-w-[18ch] text-[clamp(1.6rem,3vw,2.2rem)] text-ink outline-none">
          {title}
        </h3>
        <p>{body}</p>
        {reference && (
          <p className="swf-ref">
            Reference: <strong>{reference}</strong>
          </p>
        )}
        <button type="button" className="sw-btn sw-btn--ghost mt-2 text-ink" onClick={onAgain}>
          <span>{againLabel}</span>
          <span className="sw-btn-dot" aria-hidden="true">
            <SendArrow />
            <SendArrow />
          </span>
        </button>
      </div>
    );
  },
);
