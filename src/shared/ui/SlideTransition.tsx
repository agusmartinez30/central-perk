import { ViewTransition, type ReactNode } from "react";

/** Transition types carried by links that should slide the page (see `.nav-*` in globals.css). */
export const NAV_FORWARD = ["nav-forward"];
export const NAV_BACK = ["nav-back"];

// Entering and leaving pages get distinct classes so the CSS can stack their groups.
const enter = { "nav-forward": "nav-forward-enter", "nav-back": "nav-back-enter", default: "none" };
const exit = { "nav-forward": "nav-forward-exit", "nav-back": "nav-back-exit", default: "none" };

/**
 * Wraps a page so it slides horizontally on navigations tagged with `NAV_FORWARD` / `NAV_BACK`.
 * Must sit in each `page.tsx`, not a layout: layouts persist, so enter/exit never fire there.
 */
export function SlideTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={enter} exit={exit} default="none">
      {/*
       * One opaque element per page: screens render fragments on the frame's background, so
       * without it each child is snapshotted separately and the other page shows through.
       */}
      <div className="flex flex-1 flex-col bg-cream">{children}</div>
    </ViewTransition>
  );
}
