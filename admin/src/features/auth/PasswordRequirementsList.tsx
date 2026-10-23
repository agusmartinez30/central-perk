import { Check } from "lucide-react";
import clsx from "clsx";
import type { PasswordRequirement } from "./validation";

/** Live checklist of the "Password Requirements" box (11C). */
export function PasswordRequirementsList({ requirements }: { requirements: PasswordRequirement[] }) {
  return (
    <div className="flex w-full flex-col gap-2 rounded-field bg-cream p-3.5">
      <p className="text-[11px] font-bold text-ink">Tu contraseña debe incluir:</p>
      <ul className="flex flex-col gap-2">
        {requirements.map((rule) => (
          <li key={rule.id} className="flex items-center gap-2">
            <Check
              size={15}
              aria-hidden="true"
              className={clsx("shrink-0", rule.met ? "text-success" : "text-line")}
            />
            <span className="text-[11px] text-muted">
              {rule.label}
              <span className="sr-only">{rule.met ? " (cumplido)" : " (pendiente)"}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
