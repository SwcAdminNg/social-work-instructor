"use client";

import { useRef, useState, useEffect } from "react";

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled,
  autoFocus,
}: {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [firedComplete, setFiredComplete] = useState(false);

  useEffect(() => {
    if (autoFocus) inputsRef.current[0]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (value.length === length) {
      if (!firedComplete) {
        setFiredComplete(true);
        onComplete?.(value);
      }
    } else {
      setFiredComplete(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, length]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const setDigitAt = (index: number, digit: string) => {
    const chars = value.split("");
    chars[index] = digit;
    onChange(chars.join("").slice(0, length));
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) {
      setDigitAt(index, "");
      return;
    }
    setDigitAt(index, digit);
    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        setDigitAt(index, "");
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
        setDigitAt(index - 1, "");
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    const nextIndex = Math.min(pasted.length, length - 1);
    inputsRef.current[nextIndex]?.focus();
  };

  return (
    <div
      role="group"
      aria-label="Verification code"
      className="flex items-center justify-between gap-2"
    >
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`Verification code digit ${i + 1} of ${length}`}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className={`
            w-full h-[54px] text-center text-lg font-bold rounded-xl border bg-white dark:bg-white/5
            text-gray-900 dark:text-white outline-none transition-all duration-150
            border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20
            focus:border-[#2D6A4F] dark:focus:border-[#52b788] focus:shadow-[0_0_0_3px_rgba(45,106,79,0.12)] dark:focus:shadow-[0_0_0_3px_rgba(82,183,136,0.12)]
            disabled:opacity-60 disabled:cursor-not-allowed
          `}
        />
      ))}
    </div>
  );
}
