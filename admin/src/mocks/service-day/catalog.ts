import { DEMO_STAFF } from "../staff";
import type { CollectionMethod, StaffMember } from "../types";
import type {
  ConsumptionMomentInfo,
  PaymentMethodInfo,
  Product,
  ProductCategoryInfo,
  ProductOption,
  RequestModeInfo,
} from "./types";

/** "Carta publicada · Versión 42" of the 07 exports. */
export const CATALOG_VERSION = 42;

/** Categories of the 07A rows plus "Sándwiches" for the Sándwich de pollo the 03 orders sell. */
export const PRODUCT_CATEGORIES: ProductCategoryInfo[] = [
  { id: "cafes", label: "Cafés" },
  { id: "bebidas", label: "Bebidas" },
  { id: "panaderia", label: "Panadería" },
  { id: "tostadas", label: "Tostadas" },
  { id: "tostados", label: "Tostados" },
  { id: "sandwiches", label: "Sándwiches" },
  { id: "hamburguesas", label: "Hamburguesas" },
  { id: "postres", label: "Postres" },
];

/** "Momentos de consumo" chips of 07B. */
export const CONSUMPTION_MOMENTS: ConsumptionMomentInfo[] = [
  { id: "desayunar", label: "Desayunar" },
  { id: "merendar", label: "Merendar" },
  { id: "cenar", label: "Cenar" },
  { id: "tomar", label: "Tomar" },
];

const photo = (file: string) => `/images/products/${file}.webp`;

/** 07B "Tamaño" group of the Cappuccino. */
const COFFEE_SIZES: ProductOption[] = [
  { id: "chico", name: "Chico", priceDelta: 0 },
  { id: "mediano", name: "Mediano", priceDelta: 800 },
  { id: "grande", name: "Grande", priceDelta: 1500 },
];

/** 07B/07C "Extras" of the Cappuccino. */
const COFFEE_EXTRAS: ProductOption[] = [
  { id: "shot-extra", name: "Shot extra", priceDelta: 900 },
  { id: "leche-vegetal", name: "Leche vegetal", priceDelta: 700 },
];

/** Defaults of a product without options, published and available. */
const base = {
  publication: "published",
  available: true,
  archived: false,
  allowCustomerNotes: true,
  sizes: [],
  extras: [],
} as const satisfies Partial<Product>;

/**
 * Menu of the service day. The 03 unit prices win (Cappuccino grande $5.200, Medialunas
 * $3.900, Tostado clásico $7.200, Limonada $3.600, Tostón de palta $7.500, Café latte $4.200,
 * Tostado de jamón y queso $6.900, Sándwich de pollo $8.900); Cappuccino, Café con leche and
 * Jugo de naranja are priced so the accounts of 02/04/05 add up. The 07A prices of the products
 * the live screens sell lose against them; Hamburguesa clásica and Cheesecake, never sold today,
 * keep their 07A prices. Photos are the customer app's; the 07A ones are leftovers that do not
 * match their rows, so products without a matching photo have none.
 */
export const PRODUCTS: Product[] = [
  {
    ...base,
    id: "cappuccino",
    name: "Cappuccino",
    price: 4600,
    categoryId: "cafes",
    description: "Espresso intenso con leche vaporizada y espuma cremosa.",
    image: photo("cappuccino"),
    moments: ["desayunar", "merendar"],
    sizes: COFFEE_SIZES,
    defaultSizeId: "mediano",
    extras: COFFEE_EXTRAS,
  },
  {
    ...base,
    id: "cappuccino-grande",
    name: "Cappuccino grande",
    price: 5200,
    categoryId: "cafes",
    description: "Doble espresso con leche vaporizada y espuma, en taza grande.",
    image: photo("cappuccino"),
    moments: ["desayunar", "merendar"],
    extras: COFFEE_EXTRAS,
  },
  {
    ...base,
    id: "cafe-latte",
    name: "Café latte",
    price: 4200,
    categoryId: "cafes",
    description: "Espresso suave con mucha leche y una capa fina de espuma.",
    image: photo("cappuccino"),
    moments: ["desayunar", "merendar", "tomar"],
    extras: [{ id: "leche-vegetal", name: "Leche vegetal", priceDelta: 700 }],
  },
  {
    ...base,
    id: "cafe-con-leche",
    name: "Café con leche",
    price: 3800,
    categoryId: "cafes",
    description: "Espresso con leche caliente, servido en taza.",
    image: photo("cappuccino"),
    moments: ["desayunar", "merendar"],
  },
  {
    ...base,
    id: "jugo-naranja",
    name: "Jugo de naranja",
    price: 5100,
    categoryId: "bebidas",
    description: "Naranjas exprimidas en el momento.",
    image: photo("combo-central"),
    moments: ["desayunar", "tomar"],
  },
  {
    ...base,
    id: "medialuna",
    name: "Medialuna",
    plural: "Medialunas",
    price: 3900,
    categoryId: "panaderia",
    description: "Medialunas de manteca recién horneadas.",
    image: photo("medialunas"),
    moments: ["desayunar", "merendar"],
  },
  {
    ...base,
    id: "tostado-clasico",
    name: "Tostado clásico",
    plural: "Tostados clásicos",
    price: 7200,
    categoryId: "tostados",
    description: "Pan de miga tostado con jamón cocido y queso.",
    image: photo("tostado-jamon-queso"),
    moments: ["merendar", "cenar"],
  },
  {
    ...base,
    id: "tostado-jamon-queso",
    name: "Tostado de jamón y queso",
    price: 6900,
    categoryId: "tostados",
    description: "Pan de campo con jamón cocido y queso fundido.",
    image: photo("tostado-jamon-queso"),
    moments: ["merendar", "cenar"],
  },
  {
    ...base,
    id: "toston-palta",
    name: "Tostón de palta",
    price: 7500,
    categoryId: "tostadas",
    description: "Pan de masa madre con palta, tomate y semillas.",
    image: photo("tostadas-de-campo"),
    moments: ["desayunar", "merendar"],
  },
  {
    ...base,
    id: "sandwich-pollo",
    name: "Sándwich de pollo",
    price: 8900,
    categoryId: "sandwiches",
    description: "Pollo grillado, lechuga, tomate y mayonesa de la casa.",
    image: photo("tostado-jamon-queso"),
    moments: ["cenar"],
  },
  {
    ...base,
    id: "limonada",
    name: "Limonada",
    price: 3600,
    categoryId: "bebidas",
    description: "Limonada con menta y jengibre.",
    moments: ["tomar"],
  },
  {
    ...base,
    id: "hamburguesa-clasica",
    name: "Hamburguesa clásica",
    price: 12500,
    categoryId: "hamburguesas",
    description: "Medallón de carne, cheddar, lechuga y tomate, con papas fritas.",
    moments: ["cenar"],
    available: false,
  },
  {
    ...base,
    id: "cheesecake",
    name: "Cheesecake",
    price: 6800,
    categoryId: "postres",
    description: "Cheesecake de frutos rojos sobre base de galletitas.",
    moments: ["merendar"],
    publication: "draft",
  },
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
