"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { DARK, LIGHT } from "./HeroCanvas";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), { ssr: false });

/** If WebGL is unavailable the canvas throws; fall back silently to the CSS backdrop. */
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function lowPowerDevice(): boolean {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  return Boolean(nav.connection?.saveData) || (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2;
}

/**
 * Fixed-size box (no layout shift). The 3D canvas loads after the page is idle and is skipped for
 * reduced-motion / data-saver / low-power users; the gradient fallback is always rendered underneath.
 */
export function HeroScene() {
  const box = useRef<HTMLDivElement>(null);
  const [allowed, setAllowed] = useState(false);
  const [lost, setLost] = useState(false);
  const [visible, setVisible] = useState(true);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    let idle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const evaluate = () => {
      if (reduce.matches || lowPowerDevice()) return setAllowed(false);
      // Wait until the hero text has painted and the main thread is idle before pulling in three.js.
      const go = () => setAllowed(true);
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(go, { timeout: 1500 });
      else timer = setTimeout(go, 300);
    };
    evaluate();

    setDark(scheme.matches);
    const onScheme = (e: MediaQueryListEvent) => setDark(e.matches);
    scheme.addEventListener("change", onScheme);
    reduce.addEventListener("change", evaluate); // honor a runtime preference change

    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    if (box.current) io.observe(box.current);

    return () => {
      scheme.removeEventListener("change", onScheme);
      reduce.removeEventListener("change", evaluate);
      io.disconnect();
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={box} aria-hidden className="hero-stage relative h-[260px] w-full overflow-hidden rounded-[22px] sm:h-[360px]">
      <div className="hero-fallback absolute inset-0" />
      {allowed && !lost && (
        <Boundary>
          <HeroCanvas palette={dark ? DARK : LIGHT} running={visible} onLost={() => setLost(true)} />
        </Boundary>
      )}
    </div>
  );
}
