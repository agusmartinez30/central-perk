"use client";

import { useSyncExternalStore } from "react";
import { createVenueState, venueReducer, type VenueAction, type VenueState } from "./venue-state";

/**
 * Client store of the venue configuration (same `useSyncExternalStore` pattern as the auth
 * session). It lives in memory for the browser session: client navigation between `/tables`,
 * `/tables/management` and `/tables/qr` keeps every change, a full reload starts again from the
 * canonical service day. The server, and the first client render while hydrating, always see
 * the seed, so markup never mismatches.
 */
const SEED: VenueState = createVenueState();

let current: VenueState = SEED;
const listeners = new Set<() => void>();

export function getVenueSnapshot(): VenueState {
  return current;
}

export function getServerVenueSnapshot(): VenueState {
  return SEED;
}

export function subscribeToVenue(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Applies an action; subscribers hear only about real changes. Returns the resulting state. */
export function dispatchVenue(action: VenueAction): VenueState {
  const next = venueReducer(current, action);
  if (next !== current) {
    current = next;
    for (const listener of listeners) listener();
  }
  return current;
}

/** Back to the seed (tests). */
export function resetVenueStore() {
  current = SEED;
  listeners.clear();
}

export function useVenue(): VenueState {
  return useSyncExternalStore(subscribeToVenue, getVenueSnapshot, getServerVenueSnapshot);
}
