"use client";

import type { ReactNode } from "react";
import { LoaderCircle, RotateCw, TriangleAlert } from "lucide-react";
import { Notice } from "@/shared/ui";
import { reloadVenue, useVenueLoad } from "./venue-store";

/**
 * Renders the table screens once the venue configuration has loaded from the API. While it
 * loads (and on the server, so pages stay static) it shows a placeholder; if the API cannot be
 * reached it explains it and offers to retry.
 */
export function VenueGate({ children }: { children: ReactNode }) {
  const load = useVenueLoad();
  if (load.status === "ready") return children;

  return (
    <div className="flex h-[calc(100dvh-72px)] min-h-[760px] items-center justify-center px-6">
      {load.status === "loading" ? (
        <p role="status" className="flex items-center gap-2 text-[13px] font-semibold text-muted">
          <LoaderCircle size={16} aria-hidden="true" className="animate-spin" />
          Cargando mesas…
        </p>
      ) : (
        <div className="flex w-full max-w-[420px] flex-col items-center gap-3">
          <Notice tone="danger" icon={TriangleAlert} title="No pudimos cargar las mesas">
            {load.message}
          </Notice>
          <button
            type="button"
            onClick={() => void reloadVenue()}
            className="flex h-10 items-center gap-1.5 rounded-[9px] px-3 text-[12px] font-bold text-brand hover:bg-brand-wash"
          >
            <RotateCw size={14} aria-hidden="true" />
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
