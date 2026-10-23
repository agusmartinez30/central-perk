import type { FormEvent, ReactNode } from "react";

type AuthCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  /** When provided the card is a `<form>` and this runs on submit. */
  onSubmit?: () => void;
  children: ReactNode;
};

/** White 500px card with eyebrow, title and description ("Authentication Card"). */
export function AuthCard({ eyebrow, title, description, onSubmit, children }: AuthCardProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.();
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex w-full max-w-[500px] flex-col gap-[18px] rounded-auth bg-surface p-10 shadow-auth outline-1 -outline-offset-[0.5px] outline-line"
    >
      <p className="text-[10px] font-bold text-brand">{eyebrow}</p>
      <h1 className="text-[30px] font-bold text-ink">{title}</h1>
      <p className="text-[13px]/[19px] text-muted">{description}</p>
      {children}
    </form>
  );
}
