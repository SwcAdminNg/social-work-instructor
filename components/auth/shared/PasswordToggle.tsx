"use client";

import { IconEyeClosed, IconEyeOpen } from "./icons";

export function PasswordToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "Hide password" : "Show password"}
      className="flex h-9 w-9 items-center justify-center rounded text-swc-ink-3 hover:text-swc-label"
    >
      {visible ? <IconEyeClosed /> : <IconEyeOpen />}
    </button>
  );
}
