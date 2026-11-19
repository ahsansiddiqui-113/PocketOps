"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";

/** Pointer-driven 3D tilt with a moving glare. Touch and reduced-motion get a flat card (see .tilt in CSS). */
export function TiltCard({ href, children, accent }: { href: string; children: ReactNode; accent?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const rect = useRef<DOMRect | null>(null); // measured BEFORE tilting; the live rect is transformed
  const raf = useRef(0);

  function onEnter(e: React.PointerEvent<HTMLAnchorElement>) {
    if (e.pointerType === "mouse") rect.current = ref.current?.getBoundingClientRect() ?? null;
  }

  function onMove(e: React.PointerEvent<HTMLAnchorElement>) {
    const r = rect.current;
    if (e.pointerType !== "mouse" || !r) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const px = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      const py = Math.min(1, Math.max(0, (clientY - r.top) / r.height));
      el.style.setProperty("--ry", `${(px - 0.5) * 12}deg`);
      el.style.setProperty("--rx", `${(0.5 - py) * 10}deg`);
      el.style.setProperty("--gx", `${px * 100}%`);
      el.style.setProperty("--gy", `${py * 100}%`);
    });
  }

  function reset() {
    cancelAnimationFrame(raf.current);
    rect.current = null;
    const el = ref.current;
    if (!el) return;
    for (const v of ["--rx", "--ry", "--gx", "--gy"]) el.style.removeProperty(v);
  }

  return (
    <Link
      ref={ref}
      href={href}
      onPointerEnter={onEnter}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className="tilt card block"
      style={accent ? ({ "--accent": accent } as React.CSSProperties) : undefined}
    >
      {children}
    </Link>
  );
}
