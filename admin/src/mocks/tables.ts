import type { ManagedTable, TablesBoard } from "./types";

type TableSeed = Omit<ManagedTable, "id">;

const available = (number: number): TableSeed => ({
  number,
  status: "available",
  confirmedOrders: 0,
  pendingKitchenOrders: 0,
  accountTotal: 0,
});

/**
 * The twelve tables of 02 · Gestión de mesas. Kitchen counts and bill wait times that the
 * cards do not show (all but Mesa 05, which the quick-detail panel shows) are illustrative.
 */
const SEEDS: TableSeed[] = [
  available(1),
  { number: 2, status: "occupied", confirmedOrders: 2, pendingKitchenOrders: 0, accountTotal: 16800 },
  { number: 3, status: "occupied", confirmedOrders: 3, pendingKitchenOrders: 2, accountTotal: 28400 },
  available(4),
  {
    number: 5,
    status: "bill-requested",
    confirmedOrders: 3,
    pendingKitchenOrders: 1,
    accountTotal: 21500,
    paymentPreference: "table",
    billRequestedMinutesAgo: 2,
  },
  { number: 6, status: "occupied", confirmedOrders: 1, pendingKitchenOrders: 0, accountTotal: 8900 },
  {
    number: 7,
    status: "bill-requested",
    confirmedOrders: 2,
    pendingKitchenOrders: 0,
    accountTotal: 19900,
    paymentPreference: "register",
    billRequestedMinutesAgo: 7,
  },
  { number: 8, status: "occupied", confirmedOrders: 4, pendingKitchenOrders: 1, accountTotal: 36700 },
  available(9),
  {
    number: 10,
    status: "bill-requested",
    confirmedOrders: 4,
    pendingKitchenOrders: 0,
    accountTotal: 31200,
    paymentPreference: "transfer",
    billRequestedMinutesAgo: 18,
  },
  { number: 11, status: "occupied", confirmedOrders: 2, pendingKitchenOrders: 0, accountTotal: 14300 },
  available(12),
];

const TABLES: ManagedTable[] = SEEDS.map((seed) => ({
  id: `table-${String(seed.number).padStart(2, "0")}`,
  ...seed,
}));

/** Live tables board of 02, with Mesa 05 open in the quick-detail panel as in the design. */
export const TABLES_BOARD: TablesBoard = {
  syncedAt: "10:42:18",
  tables: TABLES,
  selectedTableId: "table-05",
};
