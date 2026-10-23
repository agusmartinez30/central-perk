import Link from "next/link";

type PanelHeaderProps = {
  title: string;
  linkLabel: string;
  href: string;
};

/** Panel title with its "Ver … →" link. */
export function PanelHeader({ title, linkLabel, href }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-[14px] font-bold text-ink">{title}</h3>
      <Link href={href} className="text-[12px] font-bold text-brand hover:underline">
        {linkLabel}
      </Link>
    </div>
  );
}
