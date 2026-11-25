"use client";

import { useEffect } from "react";

/**
 * Anti-flicker reveal: content renders VISIBLE. On mount we hide only the
 * elements that are clearly offscreen (once), then reveal on intersection.
 * A watchdog force-reveals everything after 2.5s so nothing can stay hidden.
 */
export function RevealScript({ disabled = false }: { disabled?: boolean }) {
  useEffect(() => {
    if (disabled) return;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!nodes.length) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const vh = window.innerHeight || 800;
    const pending: HTMLElement[] = [];
    for (const el of nodes) {
      if (el.dataset.revealDone === "1") continue;
      const rect = el.getBoundingClientRect();
      if (rect.top > vh * 1.05) {
        el.dataset.hidden = "1";
        pending.push(el);
      } else {
        el.dataset.revealDone = "1";
      }
    }
    if (!pending.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.dataset.hidden = "0";
            el.dataset.revealDone = "1";
            io.unobserve(el);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    pending.forEach((el) => io.observe(el));

    const watchdog = window.setTimeout(() => {
      pending.forEach((el) => {
        el.dataset.hidden = "0";
        el.dataset.revealDone = "1";
      });
      io.disconnect();
    }, 2500);

    return () => {
      window.clearTimeout(watchdog);
      io.disconnect();
    };
  }, [disabled]);

  return null;
}
