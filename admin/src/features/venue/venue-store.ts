"use client";

import { useSyncExternalStore } from "react";
import { sessionStore } from "@/features/auth/session-store";
import { fetchTablesConfig, sendTablesRequest, type TablesApiError, type TablesRequest, type TablesResult, type VenueConfig } from "./tables-api";
import { toTablesRequests } from "./venue-commands";
import { VENUE_UNAVAILABLE } from "./venue-errors";
import { createVenueState, venueReducer, type VenueAction, type VenueState } from "./venue-state";

/**
 * Client store of the venue configuration (same `useSyncExternalStore` pattern as the auth
 * session). Spaces and tables come from `GET /api/tables/config` and every change goes through
 * the API, whose answer (the full configuration) replaces them; live sessions and history stay
 * on the service-day mocks. The server, and the first client render while hydrating, see an
 * empty `loading` venue, so pages stay static and markup never mismatches.
 */

export type VenueLoad = { status: "loading" } | { status: "ready" } | { status: "error"; message: string };

export type VenueCommit = { ok: true; before: VenueState; venue: VenueState } | { ok: false; error: TablesApiError };

export type VenueApi = {
  load: () => Promise<TablesResult<VenueConfig>>;
  send: (request: TablesRequest) => Promise<TablesResult<VenueConfig>>;
};

const LOADING: VenueLoad = { status: "loading" };
const READY: VenueLoad = { status: "ready" };

/** Floor-plan edits show on drop and are reverted if the API refuses them. */
const LAYOUT_ACTIONS = new Set<VenueAction["type"]>(["move-table", "resize-table", "set-table-shape"]);

export function createVenueStore(api: VenueApi, { onUnauthorized }: { onUnauthorized: () => void }) {
  const empty: VenueState = { ...createVenueState(), spaces: [], tables: [] };
  let venue = empty;
  let load: VenueLoad = LOADING;
  /** Last configuration the API answered: what a refused layout edit reverts to. */
  let confirmed: VenueConfig = { spaces: [], tables: [] };
  let loading = false;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((listener) => listener());

  const apply = (config: VenueConfig) => {
    confirmed = config;
    venue = { ...venue, spaces: config.spaces, tables: config.tables };
  };

  const fetchConfig = async () => {
    loading = true;
    const result = await api.load();
    loading = false;
    if (result.ok) {
      apply(result.value);
      load = READY;
    } else if (result.error.kind === "unauthorized") {
      // Signed out: the AuthGuard sends the visitor to /login; the next subscriber loads again.
      load = LOADING;
      onUnauthorized();
    } else {
      load = { status: "error", message: VENUE_UNAVAILABLE };
    }
    emit();
  };

  return {
    getVenue: (): VenueState => venue,
    getServerVenue: (): VenueState => empty,
    getLoad: (): VenueLoad => load,
    getServerLoad: (): VenueLoad => LOADING,

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      if (load === LOADING && !loading) void fetchConfig();
      return () => {
        listeners.delete(listener);
      };
    },

    /** "Reintentar" after a failed load. */
    async reload(): Promise<void> {
      if (loading) return;
      load = LOADING;
      emit();
      await fetchConfig();
    },

    /** Sends `action` to the API and replaces the configuration with its answer. */
    async commit(action: VenueAction): Promise<VenueCommit> {
      const before = venue;
      if (LAYOUT_ACTIONS.has(action.type)) {
        const preview = venueReducer(venue, action);
        if (preview !== venue) {
          venue = preview;
          emit();
        }
      }
      let saved: VenueConfig | null = null;
      let error: TablesApiError | null = null;
      for (const request of toTablesRequests(action, before)) {
        const result = await api.send(request);
        if (!result.ok) {
          error = result.error;
          break;
        }
        saved = result.value;
      }
      // What the API already saved stays, even when a later request failed.
      if (saved) apply(saved);
      else if (venue !== before) venue = { ...venue, spaces: confirmed.spaces, tables: confirmed.tables };
      if (venue !== before) emit();
      if (error?.kind === "unauthorized") onUnauthorized();
      return error ? { ok: false, error } : { ok: true, before, venue };
    },
  };
}

const store = createVenueStore(
  { load: fetchTablesConfig, send: sendTablesRequest },
  { onUnauthorized: () => sessionStore.signOut() },
);

export const commitVenue = store.commit;
export const reloadVenue = store.reload;

export function useVenue(): VenueState {
  return useSyncExternalStore(store.subscribe, store.getVenue, store.getServerVenue);
}

export function useVenueLoad(): VenueLoad {
  return useSyncExternalStore(store.subscribe, store.getLoad, store.getServerLoad);
}
