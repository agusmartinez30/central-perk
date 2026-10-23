import { ArrowLeftRight, ConciergeBell, Store, type LucideIcon } from "lucide-react";
import type { PaymentPreference } from "@/features/table-session";

export type PaymentOption = {
  id: PaymentPreference;
  label: string;
  description: string;
  icon: LucideIcon;
};

/** Payment preferences of screen 08, in display order. */
export const PAYMENT_OPTIONS: readonly PaymentOption[] = [
  { id: "table", label: "En la mesa", description: "El personal se acerca a cobrar", icon: ConciergeBell },
  { id: "cashier", label: "En caja", description: "Me acerco a pagar al mostrador", icon: Store },
  {
    id: "transfer",
    label: "Por transferencia",
    description: "Quiero abonar mediante transferencia bancaria",
    icon: ArrowLeftRight,
  },
];

export function getPaymentOption(preference: PaymentPreference): PaymentOption {
  return PAYMENT_OPTIONS.find((option) => option.id === preference) ?? PAYMENT_OPTIONS[1];
}
