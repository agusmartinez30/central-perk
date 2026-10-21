/** Integer amount in Argentine pesos (no cents). */
export type Ars = number;

export type CategoryId = "todos" | "cafes" | "desayunos" | "comidas" | "bebidas" | "postres";

export type Category = {
  id: CategoryId;
  label: string;
};

export type ProductBadge = "Favorito" | "Nuevo" | "Combo";

export type OptionChoice = {
  id: string;
  label: string;
  /** Price change relative to `Product.price` (the default configuration). */
  priceDelta: Ars;
};

export type OptionGroup = {
  id: string;
  /** Short name used in summaries, e.g. "Tamaño". */
  name: string;
  /** Heading shown on the product detail, e.g. "Elegí el tamaño". */
  title: string;
  required: boolean;
  selection: "single" | "multiple";
  /** Preselected choice for required single-selection groups. */
  defaultChoiceId?: string;
  /** `absolute` shows the resulting price ("$3.800"); `delta` shows "+$900" / "Incluida". */
  priceDisplay: "absolute" | "delta";
  choices: OptionChoice[];
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  /** Shorter name for compact cards, when the design uses one. */
  shortName?: string;
  description: string;
  /** Longer copy for the product detail screen. */
  longDescription?: string;
  /** Price of the default configuration (what menu cards display). */
  price: Ars;
  category: Exclude<CategoryId, "todos">;
  image: string;
  badge?: ProductBadge;
  optionGroups?: OptionGroup[];
};

export type MomentId = "para-desayunar" | "para-merendar" | "para-cenar" | "para-tomar";

export type MomentFilter = {
  id: string;
  label: string;
  /** Products shown for this filter; omitted for "Todos" (all moment products). */
  productIds?: string[];
};

export type Moment = {
  id: MomentId;
  title: string;
  subtitle: string;
  image: string;
  productIds: string[];
  filters: MomentFilter[];
};

export type OrderStatus = "pending" | "preparing" | "delivered" | "cancelled";

export type OrderLine = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: Ars;
  /** Human-readable summary of chosen options, e.g. "Mediano · Leche de almendras". */
  customization?: string;
  note?: string;
};

export type TableOrder = {
  id: string;
  /** Display number without the hash, e.g. "1042". */
  number: string;
  customerName: string;
  /** Local time as shown in the UI, e.g. "11:35". */
  time: string;
  status: OrderStatus;
  lines: OrderLine[];
};

export type TableInfo = {
  number: string;
  cafeName: string;
  sharedAccount: boolean;
};
