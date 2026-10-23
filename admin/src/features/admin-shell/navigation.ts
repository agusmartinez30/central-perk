import {
  Armchair,
  BookOpen,
  ClipboardList,
  CreditCard,
  History,
  LayoutDashboard,
  LayoutGrid,
  Package,
  QrCode,
  ReceiptText,
  Settings,
  Tags,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export const BRAND_NAME = "Café Central";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Top bar layout of the module's export; defaults to the 10A section title. */
  topbar?: TopbarVariant;
};

/**
 * `section`: 10A top bar ("Café Central · Resumen", connection pill, compact profile).
 * `location`: 02 top bar (branch and shift, round notifications button, larger profile).
 * `live-location`: 03 top bar (branch and shift plus an "En vivo" pill and 12/10px profile copy),
 *   reused by 04, whose 11/9px profile copy maps to the same 12/10px scale.
 * `verified-location`: 05 top bar, like `live-location` but with a "Datos verificados" pill and a
 *   notifications button without the unread dot.
 * `admin-location`: 06 top bar, the branch without the shift plus an "Administrador" pill and the
 *   dot-less bell of 05.
 * `catalog`: 07 top bar, "Café Central · Carta digital" with a "Sincronizado" pill and the dot-less
 *   bell of 05.
 */
export type TopbarVariant =
  | "section"
  | "location"
  | "live-location"
  | "verified-location"
  | "admin-location"
  | "catalog";

/** Branch and shift shown by the `location` top bar. */
export const TOPBAR_LOCATION = `${BRAND_NAME} · Sede Centro · Turno mañana`;

/** Title of the `catalog` top bar. */
export const TOPBAR_CATALOG = `${BRAND_NAME} · Carta digital`;

/** Branch alone, as the `admin-location` top bar shows it. */
export const TOPBAR_BRANCH = `${BRAND_NAME} · Sede Centro`;

/**
 * Sidebar modules in the order of the 10A export, plus "Personal y permisos" (from 12A),
 * which the 10A sidebar omits.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: "overview", label: "Resumen", href: "/", icon: LayoutDashboard },
  { id: "tables", label: "Mesas", href: "/tables", icon: Armchair, topbar: "location" },
  { id: "table-management", label: "Gestión de mesas", href: "/tables/management", icon: LayoutGrid },
  { id: "table-qr", label: "Mesas y códigos QR", href: "/tables/qr", icon: QrCode },
  { id: "orders", label: "Pedidos", href: "/orders", icon: ClipboardList, topbar: "live-location" },
  {
    id: "bill-requests",
    label: "Solicitudes de cuenta",
    href: "/bill-requests",
    icon: ReceiptText,
    topbar: "live-location",
  },
  { id: "history", label: "Historial", href: "/history", icon: History, topbar: "verified-location" },
  { id: "menu", label: "Carta digital", href: "/menu", icon: BookOpen },
  { id: "products", label: "Productos", href: "/menu/products", icon: Package, topbar: "catalog" },
  { id: "categories", label: "Categorías y momentos", href: "/menu/categories", icon: Tags },
  { id: "settings", label: "Configuración", href: "/settings", icon: Settings },
  { id: "payments", label: "Pagos", href: "/payments", icon: CreditCard, topbar: "admin-location" },
  { id: "staff", label: "Personal y permisos", href: "/staff", icon: UsersRound },
];

function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

function matchesRoute(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The nav item owning `pathname`; nested routes resolve to the most specific item. */
export function findActiveNavItem(
  pathname: string,
  items: readonly NavItem[] = NAV_ITEMS,
): NavItem | null {
  const path = normalizePath(pathname);
  let best: NavItem | null = null;
  for (const item of items) {
    if (matchesRoute(path, item.href) && (!best || item.href.length > best.href.length)) {
      best = item;
    }
  }
  return best;
}

/** Top bar heading, e.g. "Café Central · Resumen". */
export function getSectionTitle(pathname: string): string {
  const item = findActiveNavItem(pathname);
  return item ? `${BRAND_NAME} · ${item.label}` : BRAND_NAME;
}

export function getNavItem(id: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.id === id);
}

export type TopbarConfig = { variant: TopbarVariant; title: string };

export function getTopbarConfig(pathname: string): TopbarConfig {
  const variant = findActiveNavItem(pathname)?.topbar ?? "section";
  if (variant === "section") return { variant, title: getSectionTitle(pathname) };
  if (variant === "catalog") return { variant, title: TOPBAR_CATALOG };
  return { variant, title: variant === "admin-location" ? TOPBAR_BRANCH : TOPBAR_LOCATION };
}
