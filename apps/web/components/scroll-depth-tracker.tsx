"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * Scroll depth tracker · emite eventos GA4 quando user atinge 25/50/75/100% da página.
 * Reseta em mudança de rota.
 */
export function ScrollDepthTracker() {
  const fired = useRef<Set<number>>(new Set());
  const lastPath = useRef<string>("");

  useEffect(() => {
    function check() {
      const path = window.location.pathname;
      if (path !== lastPath.current) {
        fired.current.clear();
        lastPath.current = path;
      }
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = Math.min(100, Math.round((scrollTop / docHeight) * 100));
      for (const threshold of [25, 50, 75, 100]) {
        if (pct >= threshold && !fired.current.has(threshold)) {
          fired.current.add(threshold);
          trackEvent("scroll_depth", {
            percent: threshold,
            page_path: path,
          });
        }
      }
    }
    let ticking = false;
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          check();
          ticking = false;
        });
        ticking = true;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
