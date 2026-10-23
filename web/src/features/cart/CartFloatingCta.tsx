"use client";

import { FloatingCartCta } from "@/shared/ui";
import { useCart } from "./CartProvider";

type CartFloatingCtaProps = {
  variant?: "bag" | "count";
};

/** Shows the floating "Ver mi pedido" bar only while the cart has items. */
export function CartFloatingCta({ variant }: CartFloatingCtaProps) {
  const { itemCount, subtotal } = useCart();
  if (itemCount === 0) return null;
  return <FloatingCartCta itemCount={itemCount} total={subtotal} variant={variant} />;
}
