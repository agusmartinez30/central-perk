import type { CartLine } from "@/features/cart";
import { describeChoices, getProductById, getUnitPrice } from "@/mocks/menu";
import type { Ars, TableOrder } from "@/mocks/types";
import { formatPrice } from "@/shared/lib/format-price";

export type CartLineView = {
  line: CartLine;
  name: string;
  image: string;
  unitPrice: Ars;
  lineTotal: Ars;
  /** Cart row text (04): chosen options, or "2 unidades · $3.800 c/u" for plain lines. */
  details: string;
  /** Summary row text (05): chosen options, or "2 unidades". */
  summary: string;
  note?: string;
};

export function formatUnits(quantity: number): string {
  return `${quantity} ${quantity === 1 ? "unidad" : "unidades"}`;
}

/** Display data for a cart line, priced from the menu; null when the product is gone. */
export function getCartLineView(line: CartLine): CartLineView | null {
  const product = getProductById(line.productId);
  if (!product) return null;
  const unitPrice = getUnitPrice(product, line.choiceIds);
  const choices = describeChoices(product, line.choiceIds);
  const units = formatUnits(line.quantity);
  return {
    line,
    name: product.name,
    image: product.image,
    unitPrice,
    lineTotal: unitPrice * line.quantity,
    details: choices || `${units} · ${formatPrice(unitPrice)} c/u`,
    summary: choices || units,
    note: line.note,
  };
}

/** Number of items in an order (sum of quantities), as shown on the receipt. */
export function countOrderItems(order: TableOrder): number {
  return order.lines.reduce((sum, line) => sum + line.quantity, 0);
}
