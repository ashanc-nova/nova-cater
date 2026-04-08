import { useEffect } from 'react';

export const MAIN_SCROLL_READY_EVENT = 'main-scroll-ready';
export const MAIN_SCROLL_UNREADY_EVENT = 'main-scroll-unready';

/** Shared threshold (px): scroll position above which OrderFloater and AllergenLegend hide on mobile. */
export const MAIN_SCROLL_HIDE_THRESHOLD_PX = 60;

/**
 * Dispatches when the main scroll container is mounted.
 * Used so consumers (e.g. OrderFloater) can attach to the scroll container when it appears (e.g. after HomePage loading).
 * Render as a child of the element with data-main-scroll.
 */
export function MainScrollReadyNotifier() {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(MAIN_SCROLL_READY_EVENT));
    return () => {
      window.dispatchEvent(new CustomEvent(MAIN_SCROLL_UNREADY_EVENT));
    };
  }, []);
  return null;
}
