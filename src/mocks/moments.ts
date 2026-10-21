import type { Moment, MomentId } from "./types";

const img = (slug: string) => `/images/moments/${slug}.webp`;

export const MOMENTS: Moment[] = [
  {
    id: "para-desayunar",
    title: "Para desayunar",
    subtitle: "Empezá bien el día",
    image: img("para-desayunar"),
    productIds: [
      "tostadas-de-campo",
      "huevos-revueltos",
      "croissant",
      "combo-central",
      "medialunas",
      "tostadas-con-palta",
      "omelette",
      "combo-medialunas",
    ],
    filters: [
      { id: "todos", label: "Todos" },
      { id: "tostadas", label: "Tostadas", productIds: ["tostadas-de-campo", "tostadas-con-palta"] },
      { id: "huevos", label: "Huevos", productIds: ["huevos-revueltos", "omelette"] },
      { id: "panaderia", label: "Panadería", productIds: ["croissant", "medialunas"] },
      { id: "combos", label: "Combos", productIds: ["combo-central", "combo-medialunas"] },
    ],
  },
  {
    id: "para-merendar",
    title: "Para merendar",
    subtitle: "Una pausa rica",
    image: img("para-merendar"),
    productIds: [
      "cappuccino",
      "medialunas",
      "croissant",
      "alfajor-de-maicena",
      "budin-de-limon",
      "latte",
    ],
    filters: [{ id: "todos", label: "Todos" }],
  },
  {
    id: "para-cenar",
    title: "Para cenar",
    subtitle: "Algo para disfrutar",
    image: img("para-cenar"),
    productIds: ["tostado-jamon-queso", "sandwich-caprese", "omelette", "limonada"],
    filters: [{ id: "todos", label: "Todos" }],
  },
  {
    id: "para-tomar",
    title: "Para tomar",
    subtitle: "Frías, calientes y más",
    image: img("para-tomar"),
    productIds: [
      "espresso-doble",
      "cappuccino",
      "flat-white",
      "cafe-con-leche",
      "jugo-de-naranja",
      "limonada",
    ],
    filters: [{ id: "todos", label: "Todos" }],
  },
];

export function getMomentById(id: string): Moment | undefined {
  return MOMENTS.find((moment) => moment.id === (id as MomentId));
}
