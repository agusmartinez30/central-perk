import Link from "next/link";
import {
  Armchair,
  BookOpen,
  ClipboardList,
  CreditCard,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/shared/ui";
import type { BestSellerBar } from "./overview-view";

/** "Productos más vendidos" ranking with proportional bars. */
export function BestSellers({ products }: { products: BestSellerBar[] }) {
  return (
    <Card as="section" aria-label="Productos más vendidos" className="flex w-full flex-1 flex-col gap-0.5 p-3">
      <h3 className="text-[14px] font-bold text-ink">Productos más vendidos</h3>
      <p className="text-[11px] text-muted">Últimos 7 días · excluye cancelados</p>
      <ol className="flex flex-1 flex-col">
        {products.map((product) => (
          <li key={product.name} className="flex flex-1 items-center gap-2.5">
            <span className="w-[120px] shrink-0 text-[12px] font-semibold text-ink">{product.name}</span>
            <span aria-hidden="true" className="relative h-2 flex-1 rounded-[4px] bg-sand">
              <span
                className="absolute inset-y-0 left-0 rounded-[4px] bg-brand"
                style={{ width: `${product.ratio * 100}%` }}
              />
            </span>
            <span className="w-8 shrink-0 text-right text-[12px] font-bold text-brand">
              {product.quantity}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

const QUICK_ACTIONS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Gestionar pedidos", href: "/orders", icon: ClipboardList },
  { label: "Mesas", href: "/tables", icon: Armchair },
  { label: "Cuentas", href: "/bill-requests", icon: ReceiptText },
  { label: "Editar carta", href: "/menu", icon: BookOpen },
  { label: "Cobros", href: "/history", icon: CreditCard },
];

/** Shortcut tiles under the ranking ("Quick Actions"). */
export function QuickActions() {
  return (
    <nav aria-label="Accesos rápidos" className="flex h-[76px] w-full shrink-0 gap-1.5">
      {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex h-[76px] min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-tile bg-surface p-2 outline-1 -outline-offset-[0.5px] outline-line transition-colors hover:bg-brand-wash"
        >
          <Icon size={20} aria-hidden="true" className="shrink-0 text-brand" />
          <span className="text-center text-[11px]/[1.25] font-bold text-ink">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
