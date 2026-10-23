"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import clsx from "clsx";
import { TextField, type TextFieldProps } from "./TextField";

export type PasswordFieldProps = Omit<TextFieldProps, "type" | "trailing" | "icon">;

/** Password input with the 44px "PasswordVisibilityToggle". */
export function PasswordField({ inputClassName, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      inputClassName={clsx("text-[16px] font-semibold", inputClassName)}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="flex size-11 shrink-0 items-center justify-center text-muted hover:text-ink"
        >
          <Icon size={19} aria-hidden="true" />
        </button>
      }
    />
  );
}
