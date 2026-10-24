import { MapPin, Store, Sun, Trees, type LucideIcon } from "lucide-react";
import type { SpaceIcon, SpaceTone } from "@/mocks/service-day";

/** Lucide icon of each 09A space icon id. */
export const SPACE_ICONS: Record<SpaceIcon, LucideIcon> = { store: Store, sun: Sun, trees: Trees, "map-pin": MapPin };

/** Wash and ink behind a space icon. */
export const SPACE_TONES: Record<SpaceTone, string> = {
  brand: "bg-brand-wash text-brand",
  warning: "bg-warning-bg text-warning",
  success: "bg-success-bg text-success",
  neutral: "bg-sand text-muted",
};

/** Names for the space form's icon and tone pickers (invented). */
export const SPACE_ICON_LABELS: Record<SpaceIcon, string> = { store: "Local", sun: "Sol", trees: "Árboles", "map-pin": "Ubicación" };
export const SPACE_TONE_LABELS: Record<SpaceTone, string> = { brand: "Azul", warning: "Ámbar", success: "Verde", neutral: "Neutro" };
