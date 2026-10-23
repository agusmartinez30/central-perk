import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/mocks/types";
import { QuickAddButton } from "@/features/cart";
import { formatPrice } from "@/shared/lib/format-price";

type ProductCardProps = {
  product: Product;
};

const menuPrice = (product: Product) => `ARS ${formatPrice(product.price)}`;

/** Featured product card ("Los favoritos del café"). The whole card links to the detail. */
export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="relative flex h-[232px] min-w-0 flex-1 flex-col gap-2 rounded-panel bg-surface p-2">
      <div className="relative h-[108px] w-full shrink-0 overflow-hidden rounded-[13px]">
        <Image src={product.image} alt="" fill sizes="160px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h3 className="truncate text-[15px] font-bold text-ink">
          <Link href={`/product/${product.id}`} className="after:absolute after:inset-0">
            {product.shortName ?? product.name}
          </Link>
        </h3>
        <p className="line-clamp-2 text-[10px] leading-3 text-muted">{product.description}</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-ink">{menuPrice(product)}</span>
        <QuickAddButton productId={product.id} size={32} />
      </div>
    </article>
  );
}

/** Compact full-width row used in the category sections of the menu. */
export function ProductRow({ product }: ProductCardProps) {
  return (
    <article className="relative flex h-[72px] w-full items-center gap-2.5 rounded-[15px] bg-surface p-2">
      <div className="relative h-14 w-[58px] shrink-0 overflow-hidden rounded-[11px]">
        <Image src={product.image} alt="" fill sizes="58px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h3 className="truncate text-[13px] font-bold text-ink">
          <Link href={`/product/${product.id}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        <p className="truncate text-[10px] text-muted">{product.description}</p>
        <span className="text-[11px] font-bold text-ink">{menuPrice(product)}</span>
      </div>
      <QuickAddButton productId={product.id} size={30} />
    </article>
  );
}
