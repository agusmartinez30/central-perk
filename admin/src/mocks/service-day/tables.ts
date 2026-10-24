import type { TableSector, TableSectorInfo, VenueTable } from "./types";

/** 09A "Sector" options, in the order the filter lists them. */
export const TABLE_SECTORS: TableSectorInfo[] = [
  { id: "interior", label: "Interior" },
  { id: "terraza", label: "Terraza" },
  { id: "patio", label: "Patio" },
];

type TableSeed = {
  number: number;
  sector: TableSector;
  capacity: number;
  version: number;
  token: string;
  generatedOn: string;
  generatedBy: string;
  description?: string;
};

/**
 * The twelve tables of 02 with the 09A sectors and capacities. Tokens are fixed so the printed
 * codes are stable across reloads; Mesa 07 carries the 09B/09C data (version 18, token
 * "4pX9kR2mL7" generated today by Sofía M., one rotation audited as #QR-118).
 */
const SEEDS: TableSeed[] = [
  { number: 1, sector: "interior", capacity: 2, version: 4, token: "Hq3vN8tWc2", generatedOn: "2026-03-02", generatedBy: "María G." },
  { number: 2, sector: "interior", capacity: 4, version: 3, token: "bR7mK2xPq9", generatedOn: "2026-03-02", generatedBy: "María G." },
  { number: 3, sector: "interior", capacity: 4, version: 5, token: "Tz4cY9gLw6", generatedOn: "2026-03-02", generatedBy: "María G." },
  { number: 4, sector: "interior", capacity: 2, version: 3, token: "pM8sD3fRk5", generatedOn: "2026-03-02", generatedBy: "María G." },
  { number: 5, sector: "terraza", capacity: 4, version: 6, token: "Wn2jX7hBv4", generatedOn: "2026-04-15", generatedBy: "María G." },
  { number: 6, sector: "terraza", capacity: 2, version: 4, token: "cK9tQ5zMe3", generatedOn: "2026-04-15", generatedBy: "María G." },
  {
    number: 7,
    sector: "interior",
    capacity: 4,
    version: 18,
    token: "4pX9kR2mL7",
    generatedOn: "2026-10-21",
    generatedBy: "Sofía M.",
    description: "Cerca de la ventana",
  },
  { number: 8, sector: "terraza", capacity: 6, version: 5, token: "Ry6dG2wNs8", generatedOn: "2026-04-15", generatedBy: "María G." },
  { number: 9, sector: "patio", capacity: 4, version: 2, token: "Lf3bV8qTy7", generatedOn: "2026-05-20", generatedBy: "Sofía M." },
  { number: 10, sector: "patio", capacity: 6, version: 3, token: "Ue5nH9rCx2", generatedOn: "2026-05-20", generatedBy: "Sofía M." },
  { number: 11, sector: "patio", capacity: 4, version: 2, token: "gJ7wP4kZa6", generatedOn: "2026-05-20", generatedBy: "Sofía M." },
  { number: 12, sector: "patio", capacity: 2, version: 2, token: "Xa8eS3mDu5", generatedOn: "2026-05-20", generatedBy: "Sofía M." },
];

const pad = (value: number) => String(value).padStart(2, "0");

/** Every table of the venue, all enabled with an active QR as in 09A. */
export const VENUE_TABLES: VenueTable[] = SEEDS.map((seed) => ({
  id: `tbl_${pad(seed.number)}`,
  number: seed.number,
  label: `Mesa ${pad(seed.number)}`,
  sector: seed.sector,
  capacity: seed.capacity,
  description: seed.description ?? "",
  enabled: true,
  version: seed.version,
  qr: { token: seed.token, generatedOn: seed.generatedOn, generatedBy: seed.generatedBy },
  // 09C "Revocado · Rotado … · auditoría #QR-118": the credential Mesa 07's code replaced today.
  revokedQrs:
    seed.number === 7
      ? [{ token: "Ma2rB6vKe9", generatedOn: "2026-03-02", generatedBy: "María G.", revokedOn: "2026-10-21", auditId: "QR-118" }]
      : [],
}));
