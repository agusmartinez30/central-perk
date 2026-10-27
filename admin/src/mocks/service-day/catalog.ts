import { DEMO_STAFF } from "../staff";
import type { CollectionMethod, StaffMember } from "../types";
import type {
  ConsumptionMomentInfo,
  PaymentMethodInfo,
  Product,
  ProductCategoryInfo,
  ProductOption,
  ProductOptionGroup,
  RequestModeInfo,
} from "./types";

/** "Carta publicada · Versión 42" of the 07 exports. */
export const CATALOG_VERSION = 42;

/**
 * Categories of the 07A rows plus "Sándwiches" for the Sándwich de pollo the 03 orders sell and
 * the empty "Licuados" of 08C. The array keeps the 07 order (selects and chips); `order` is the
 * 08C display order, following the export where a category exists (its Combos, Tortas,
 * Ensaladas, Infusiones and Jugos are not in the menu: "Postres" takes the Tortas slot and
 * "Bebidas" the Jugos one). Descriptions are invented: 08D shows Cafés being edited to
 * "Espresso, filtrados y especialidades de la casa." (its `?state=category-edit` draft).
 */
export const PRODUCT_CATEGORIES: ProductCategoryInfo[] = [
  {
    id: "cafes",
    label: "Cafés",
    description: "Espresso y filtrados de la casa.",
    // The 08D "Imagen cargada" photo (extracted from the export); the other categories have none.
    image: { src: "/images/categories/cafes.jpg", fileName: "categoria-cafes.jpg", width: 700, height: 467, bytes: 51650 },
    visible: true,
    order: 1,
  },
  { id: "bebidas", label: "Bebidas", description: "Jugos exprimidos y bebidas frías.", visible: true, order: 8 },
  { id: "panaderia", label: "Panadería", description: "Medialunas y facturas recién horneadas.", visible: true, order: 3 },
  { id: "tostadas", label: "Tostadas", description: "Panes de masa madre con toppings.", visible: true, order: 2 },
  { id: "tostados", label: "Tostados", description: "Tostados en pan de miga o de campo.", visible: true, order: 5 },
  { id: "sandwiches", label: "Sándwiches", description: "Sándwiches calientes y fríos.", visible: true, order: 6 },
  { id: "hamburguesas", label: "Hamburguesas", description: "Hamburguesas de la casa con papas.", visible: true, order: 7 },
  { id: "postres", label: "Postres", description: "Tortas y postres del día.", visible: true, order: 4 },
  { id: "licuados", label: "Licuados", description: "Licuados de fruta con agua o leche.", visible: true, order: 9 },
];

const momentPhoto = (file: string) => `/images/moments/${file}.webp`;

/**
 * "Momentos de consumo": 07B chips and 08A collections, with the 08A titles and descriptions
 * and the customer app's photos (the 08A covers are the same pictures). The associated
 * categories follow 08A where the category exists ("Combos", "Tortas", "Ensaladas",
 * "Infusiones" and "Jugos" do not: Tortas → Postres, Jugos → Bebidas, Ensaladas → Tostados).
 */
export const CONSUMPTION_MOMENTS: ConsumptionMomentInfo[] = [
  {
    id: "desayunar",
    label: "Desayunar",
    title: "Para desayunar",
    description: "Empezá el día con algo rico.",
    image: momentPhoto("para-desayunar"),
    visible: true,
    order: 1,
    categoryIds: ["cafes", "tostadas", "panaderia", "bebidas"],
  },
  {
    id: "merendar",
    label: "Merendar",
    title: "Para merendar",
    description: "Una pausa que se disfruta.",
    image: momentPhoto("para-merendar"),
    visible: true,
    order: 2,
    categoryIds: ["cafes", "postres", "panaderia", "tostados"],
  },
  {
    id: "cenar",
    label: "Cenar",
    title: "Para cenar",
    description: "Opciones para disfrutar sin apuro.",
    image: momentPhoto("para-cenar"),
    visible: true,
    order: 3,
    categoryIds: ["sandwiches", "hamburguesas", "tostados"],
  },
  {
    id: "tomar",
    label: "Tomar",
    title: "Para tomar",
    description: "Elegí tu bebida favorita.",
    image: momentPhoto("para-tomar"),
    visible: true,
    order: 4,
    categoryIds: ["cafes", "bebidas", "licuados"],
  },
];

const photo = (file: string) => `/images/products/${file}.webp`;

/** 07B "Tamaño" group of the Cappuccino. */
const COFFEE_SIZES: ProductOption[] = [
  { id: "chico", name: "Chico", priceDelta: 0 },
  { id: "mediano", name: "Mediano", priceDelta: 800 },
  { id: "grande", name: "Grande", priceDelta: 1500 },
];

/** 07B/07C "Extras" of the coffees. */
const COFFEE_EXTRAS: ProductOption[] = [
  { id: "shot-extra", name: "Shot extra", priceDelta: 900 },
  { id: "leche-vegetal", name: "Leche vegetal", priceDelta: 700 },
];

/** 07B/07C free "Canela" extra ("Sin cargo") of the Cappuccino. */
const CINNAMON: ProductOption = { id: "canela", name: "Canela", priceDelta: 0 };

/** "Tamaño": single choice, required, with a preselected size. */
function sizeGroup(options: ProductOption[], defaultOptionId: string): ProductOptionGroup {
  return { id: "tamano", title: "Tamaño", selection: "single", required: true, defaultOptionId, options };
}

/** "Extras": multiple choice, optional, "Máximo 2" as 07B. */
function extrasGroup(options: ProductOption[]): ProductOptionGroup {
  return { id: "extras", title: "Extras", selection: "multiple", required: false, max: 2, options };
}

/** Defaults of a product without options, published and available. */
const base = {
  publication: "published",
  available: true,
  archived: false,
  allowCustomerNotes: true,
  optionGroups: [],
} as const satisfies Partial<Product>;

/**
 * Menu of the service day. The 03 unit prices win (Cappuccino grande $5.200, Medialunas
 * $3.900, Tostado clásico $7.200, Limonada $3.600, Tostón de palta $7.500, Café latte $4.200,
 * Tostado de jamón y queso $6.900, Sándwich de pollo $8.900); Cappuccino, Café con leche and
 * Jugo de naranja are priced so the accounts of 02/04/05 add up. The 07A prices of the products
 * the live screens sell lose against them; Hamburguesa clásica and Cheesecake, never sold today,
 * keep their 07A prices. SKUs follow 07A where it shows them (Cappuccino CAF-014, …) and number the
 * other products after them; `commercialRank` keeps the 07A row order ("Orden: relevancia
 * comercial") with the coffees first and the other products between its rows. Photos are the customer app's; the 07A ones are leftovers that do not
 * match their rows, so products without a matching photo have none.
 */
export const PRODUCTS: Product[] = [
  {
    ...base,
    id: "cappuccino",
    sku: "CAF-014",
    commercialRank: 1,
    name: "Cappuccino",
    price: 4600,
    categoryId: "cafes",
    description: "Espresso intenso con leche vaporizada y espuma cremosa.",
    image: photo("cappuccino"),
    moments: ["desayunar", "merendar"],
    optionGroups: [sizeGroup(COFFEE_SIZES, "mediano"), extrasGroup([...COFFEE_EXTRAS, CINNAMON])],
  },
  {
    ...base,
    id: "cappuccino-grande",
    sku: "CAF-015",
    commercialRank: 2,
    name: "Cappuccino grande",
    price: 5200,
    categoryId: "cafes",
    description: "Doble espresso con leche vaporizada y espuma, en taza grande.",
    image: photo("cappuccino"),
    moments: ["desayunar", "merendar"],
    optionGroups: [extrasGroup(COFFEE_EXTRAS)],
  },
  {
    ...base,
    id: "cafe-latte",
    sku: "CAF-016",
    commercialRank: 3,
    name: "Café latte",
    price: 4200,
    categoryId: "cafes",
    description: "Espresso suave con mucha leche y una capa fina de espuma.",
    image: photo("cappuccino"),
    moments: ["desayunar", "merendar", "tomar"],
    optionGroups: [extrasGroup([{ id: "leche-vegetal", name: "Leche vegetal", priceDelta: 700 }])],
  },
  {
    ...base,
    id: "cafe-con-leche",
    sku: "CAF-017",
    commercialRank: 4,
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
    sku: "BEB-019",
    commercialRank: 10,
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
    sku: "PAN-002",
    commercialRank: 6,
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
    sku: "TOS-011",
    commercialRank: 7,
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
    sku: "TOS-012",
    commercialRank: 8,
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
    sku: "TOS-006",
    commercialRank: 5,
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
    sku: "SAN-004",
    commercialRank: 9,
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
    sku: "BEB-018",
    commercialRank: 11,
    name: "Limonada",
    price: 3600,
    categoryId: "bebidas",
    description: "Limonada con menta y jengibre.",
    moments: ["tomar"],
  },
  {
    ...base,
    id: "hamburguesa-clasica",
    sku: "HAM-003",
    commercialRank: 12,
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
    sku: "POS-009",
    commercialRank: 13,
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
