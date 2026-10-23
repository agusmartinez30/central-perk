import { Check } from "lucide-react";

type CheckboxProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/** 16px checkbox with a muted 10px label ("Shared Device Reminder"). */
export function Checkbox({ id, label, checked, onChange }: CheckboxProps) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 select-none">
      <span className="relative flex size-4 shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer absolute inset-0 cursor-pointer appearance-none rounded-[4px] bg-surface outline-1 -outline-offset-[0.5px] outline-line checked:bg-brand checked:outline-brand focus-visible:outline-2 focus-visible:outline-brand"
        />
        <Check
          size={12}
          strokeWidth={3}
          aria-hidden="true"
          className="pointer-events-none relative hidden text-white peer-checked:block"
        />
      </span>
      <span className="text-[10px] text-muted">{label}</span>
    </label>
  );
}
