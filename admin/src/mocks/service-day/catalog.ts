import { DEMO_STAFF } from "../staff";
import type { CollectionMethod, StaffMember } from "../types";
import type { PaymentMethodInfo, Product, RequestModeInfo } from "./types";

/**
 * Menu of the service day. The 03 unit prices win (Cappuccino grande $5.200, Medialunas
 * $3.900, Tostado clásico $7.200, Limonada $3.600, Tostón de palta $7.500, Café latte $4.200,
 * Tostado de jamón y queso $6.900, Sándwich de pollo $8.900); Cappuccino, Café con leche and
 * Jugo de naranja are priced so the accounts of 02/04/05 add up.
 */
export const PRODUCTS: Product[] = [
  { id: "cappuccino", name: "Cappuccino", price: 4600 },
  { id: "cappuccino-grande", name: "Cappuccino grande", price: 5200 },
  { id: "cafe-latte", name: "Café latte", price: 4200 },
  { id: "cafe-con-leche", name: "Café con leche", price: 3800 },
  { id: "jugo-naranja", name: "Jugo de naranja", price: 5100 },
  { id: "medialuna", name: "Medialuna", plural: "Medialunas", price: 3900 },
  { id: "tostado-clasico", name: "Tostado clásico", plural: "Tostados clásicos", price: 7200 },
  { id: "tostado-jamon-queso", name: "Tostado de jamón y queso", price: 6900 },
  { id: "toston-palta", name: "Tostón de palta", price: 7500 },
  { id: "sandwich-pollo", name: "Sándwich de pollo", price: 8900 },
  { id: "limonada", name: "Limonada", price: 3600 },
];

/** Staff on shift: the 10A session user, the 04 assignees and the 05 cashiers. */
export const STAFF: StaffMember[] = [
  DEMO_STAFF,
  { id: "staff-maria", name: "María G.", role: "Encargada de salón", email: "maria@cafecentral.com" },
  { id: "staff-martin", name: "Martín A.", role: "Mozo", email: "martin@cafecentral.com" },
  { id: "staff-mariana", name: "Mariana", role: "Cajera", email: "mariana@cafecentral.com" },
  { id: "staff-lucas", name: "Lucas", role: "Cajero", email: "lucas@cafecentral.com" },
];

/** "Medios de cobro" with the 06 names, in the order of the 06 export. */
export const PAYMENT_METHODS: PaymentMethodInfo[] = [
  { id: "cash", label: "Efectivo" },
  { id: "card", label: "Tarjeta" },
  { id: "transfer", label: "Transferencia" },
  { id: "other", label: "Otro" },
];

/** "Modalidades para solicitar la cuenta" with the 06 names and the short chips of 02/04/05/10A. */
export const REQUEST_MODES: RequestModeInfo[] = [
  { id: "table", label: "En mesa", shortLabel: "En mesa" },
  { id: "register", label: "En caja", shortLabel: "En caja" },
  { id: "transfer", label: "Por transferencia", shortLabel: "Transferencia" },
];

/** Name of a collection method, as 06 calls it. */
export function getPaymentMethodLabel(method: CollectionMethod): string {
  return PAYMENT_METHODS.find((item) => item.id === method)?.label ?? method;
}

/** Short chip label of a request mode ("Transferencia" for 06's "Por transferencia"). */
export function getRequestModeShortLabel(mode: RequestModeInfo["id"]): string {
  return REQUEST_MODES.find((item) => item.id === mode)?.shortLabel ?? mode;
}
