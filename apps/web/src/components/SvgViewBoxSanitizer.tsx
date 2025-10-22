"use client";

import { useEffect } from "react";

function parseNumericViewBox(vb: string | null): string | null {
  if (!vb) return null;
  // Extract up to 4 numbers (allow decimals and negative)
  const nums = vb.match(/-?\d*\.?\d+/g);
  if (!nums || nums.length < 4) return null;
  const [minX, minY, width, height] = nums.slice(0, 4).map((n) => Number(n));
  if ([minX, minY, width, height].some((n) => Number.isNaN(n))) return null;
  // Ensure width/height are positive fallbacks
  const w = width > 0 ? width : 24;
  const h = height > 0 ? height : 24;
  return `${minX} ${minY} ${w} ${h}`;
}

function coerceViewBox(el: SVGSVGElement) {
  const raw = el.getAttribute("viewBox");
  // If already valid (only numbers and spaces), skip
  if (raw && /^\s*-?\d*\.?\d+(\s+-?\d*\.?\d+){3}\s*$/.test(raw)) return;

  // Try to parse numeric tokens from the raw value
  const parsed = parseNumericViewBox(raw);
  if (parsed) {
    el.setAttribute("viewBox", parsed);
    return;
  }

  // Fallback: derive from width/height attributes if present
  const widthAttr = el.getAttribute("width") || "24";
  const heightAttr = el.getAttribute("height") || "24";
  const w = Number((widthAttr.match(/-?\d*\.?\d+/) || ["24"])[0]);
  const h = Number((heightAttr.match(/-?\d*\.?\d+/) || ["24"])[0]);
  const safeW = !Number.isNaN(w) && w > 0 ? w : 24;
  const safeH = !Number.isNaN(h) && h > 0 ? h : 24;
  el.setAttribute("viewBox", `0 0 ${safeW} ${safeH}`);
}

export default function SvgViewBoxSanitizer() {
  useEffect(() => {
    const sanitizeAll = (root: ParentNode | Document = document) => {
      root.querySelectorAll<SVGSVGElement>("svg[viewBox]").forEach(coerceViewBox);
    };

    // Initial pass
    sanitizeAll();

    // Observe future mutations to catch dynamically injected SVGs
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const el = node as Element;
          if (el instanceof SVGSVGElement) {
            coerceViewBox(el);
          } else {
            // Search within subtree
            el.querySelectorAll?.("svg[viewBox]").forEach((svg) => {
              if (svg instanceof SVGSVGElement) coerceViewBox(svg);
            });
          }
        });
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
