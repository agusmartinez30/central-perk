"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

const CUP_ANIMATION_PATH = "/animations/coffee-animation.json";
const LOADING_ANIMATION_PATH = "/animations/coffee-loading.json";
/**
 * The loading counter sits in a thin strip at the middle of its 512x512
 * canvas; crop to that strip so it can be laid out under the cup.
 */
const LOADING_VIEW_BOX = "142 226 160 60";
/** Safety net in case the animations fail to load or never complete. */
const MAX_DURATION_MS = 4000;
const FADE_OUT_MS = 400;

type Phase = "playing" | "leaving" | "done";

/**
 * Full-screen brand splash shown on every hard load. Plays the coffee cup
 * and the loading counter Lotties once (3s) over the brand blue, then fades
 * out and unmounts.
 */
export function SplashScreen() {
  const cupRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("playing");

  useEffect(() => {
    let cancelled = false;
    const destroyers: Array<() => void> = [];
    const leave = () => {
      if (!cancelled) setPhase("leaving");
    };
    const fallback = window.setTimeout(leave, MAX_DURATION_MS);

    // lottie-web touches `document` on import, so it must load client-side.
    import("lottie-web/build/player/lottie_light").then(({ default: lottie }) => {
      if (cancelled || !cupRef.current || !loadingRef.current) return;
      const common = { renderer: "svg", loop: false, autoplay: true } as const;

      const cup = lottie.loadAnimation({
        ...common,
        container: cupRef.current,
        path: CUP_ANIMATION_PATH,
      });
      const loading = lottie.loadAnimation({
        ...common,
        container: loadingRef.current,
        path: LOADING_ANIMATION_PATH,
        rendererSettings: { viewBoxSize: LOADING_VIEW_BOX },
      });

      // Both last 3s; the cup drives the exit.
      cup.addEventListener("complete", leave);
      cup.addEventListener("data_failed", leave);
      destroyers.push(() => cup.destroy(), () => loading.destroy());
    }, leave);

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
      destroyers.forEach((destroy) => destroy());
    };
  }, []);

  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = window.setTimeout(() => setPhase("done"), FADE_OUT_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      role="status"
      aria-label="Cargando"
      className={clsx(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand transition-opacity ease-out",
        phase === "leaving" && "pointer-events-none opacity-0",
      )}
      style={{ transitionDuration: `${FADE_OUT_MS}ms` }}
    >
      <div ref={cupRef} aria-hidden className="size-64" />
      <div ref={loadingRef} aria-hidden className="h-12 w-32" />
    </div>
  );
}
