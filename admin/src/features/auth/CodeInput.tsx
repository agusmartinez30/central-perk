"use client";

import { useState } from "react";
import clsx from "clsx";
import { MFA_CODE_LENGTH, sanitizeMfaCode } from "./validation";

type CodeInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
};

/**
 * "Six Digit Verification Code": one real input (so typing, paste and one-time-code autofill
 * all work) laid transparently over six display boxes.
 */
export function CodeInput({ id, label, value, onChange, invalid = false }: CodeInputProps) {
  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(value.length, MFA_CODE_LENGTH - 1);

  return (
    <div className="relative w-full">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={MFA_CODE_LENGTH}
        value={value}
        onChange={(event) => onChange(sanitizeMfaCode(event.target.value))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-invalid={invalid || undefined}
        className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
      />
      <div aria-hidden="true" className="flex w-full gap-2">
        {Array.from({ length: MFA_CODE_LENGTH }, (_, index) => {
          const digit = value[index];
          const active = focused && index === activeIndex;
          return (
            <div
              key={index}
              className={clsx(
                "flex h-14 flex-1 items-center justify-center rounded-field bg-surface text-[20px] font-bold",
                digit ? "text-ink" : "text-muted",
                invalid
                  ? "outline-2 -outline-offset-1 outline-danger"
                  : active
                    ? "outline-2 -outline-offset-1 outline-brand"
                    : "outline-1 -outline-offset-[0.5px] outline-line",
              )}
            >
              {digit ?? "—"}
            </div>
          );
        })}
      </div>
    </div>
  );
}
