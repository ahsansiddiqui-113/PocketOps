"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export interface Palette {
  need: string;
  want: string;
  saving: string;
  debt: string;
  coin: string;
  grid: string;
}

export const LIGHT: Palette = { need: "#3b6fd8", want: "#d9822b", saving: "#0f6b4f", debt: "#c2414b", coin: "#e8b931", grid: "#8a948c" };
export const DARK: Palette = { need: "#6c9bff", want: "#ffb35c", saving: "#3ecf9b", debt: "#ff7a85", coin: "#ffd45e", grid: "#56635a" };

const BLOCKS = [
  { key: "need", x: -1.65, h: 2.4 },
  { key: "want", x: -0.55, h: 1.4 },
  { key: "saving", x: 0.55, h: 1.9 },
  { key: "debt", x: 1.65, h: 0.9 },
] as const;

/** Dispose GPU resources we create ourselves (R3F only auto-disposes JSX-declared ones). */
function useDisposable<T extends { dispose(): void }>(factory: () => T): T {
  const obj = useMemo(factory, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => obj.dispose(), [obj]);
  return obj;
}

function Block({ x, h, color, phase }: { x: number; h: number; color: string; phase: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  // Built at its real height (never scaled) so the corner radius stays round on tall blocks.
  const geometry = useDisposable(() => new RoundedBoxGeometry(0.9, h, 0.9, 5, 0.12));
  useFrame(({ clock }) => {
    if (mesh.current) mesh.current.position.y = h / 2 + Math.sin(clock.elapsedTime * 1.2 + phase) * 0.04;
  });
  return (
    <mesh ref={mesh} geometry={geometry} position={[x, h / 2, 0]}>
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
    </mesh>
  );
}

function Coins({ color }: { color: string }) {
  const group = useRef<THREE.Group>(null);
  const geometry = useDisposable(() => new THREE.CylinderGeometry(0.32, 0.32, 0.07, 32));
  const material = useDisposable(() => new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.7 }));
  useEffect(() => {
    material.color.set(color);
  }, [material, color]);

  useFrame((_, dt) => {
    // Clamp: after the canvas resumes from a long pause the first delta can be huge.
    if (group.current) group.current.rotation.y += Math.min(dt, 0.05) * 0.45;
  });

  const coins = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return { x: Math.cos(a) * 2.6, z: Math.sin(a) * 2.6, y: 3.3 + Math.sin(i * 1.7) * 0.25, spin: i };
      }),
    []
  );
  return (
    <group ref={group}>
      {coins.map((c) => (
        <mesh key={c.spin} geometry={geometry} material={material} position={[c.x, c.y, c.z]} rotation={[Math.PI / 2.4, 0, c.spin]} />
      ))}
    </group>
  );
}

function Rig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ pointer, clock }) => {
    if (!group.current) return;
    const ty = pointer.x * 0.5 + Math.sin(clock.elapsedTime * 0.25) * 0.12;
    const tx = -pointer.y * 0.18;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, ty - 0.35, 0.06);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, tx, 0.06);
  });
  return <group ref={group} position={[0, -1.4, 0]}>{children}</group>;
}

export default function HeroCanvas({
  palette,
  running,
  onLost,
}: {
  palette: Palette;
  running: boolean;
  /** Called if the browser drops the WebGL context, so the parent can fall back to the CSS backdrop. */
  onLost: () => void;
}) {
  return (
    <Canvas
      aria-hidden
      dpr={[1, 1.75]}
      frameloop={running ? "always" : "never"}
      camera={{ position: [0, 1.4, 8], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      className="!absolute inset-0"
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onLost();
        });
      }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 7, 5]} intensity={2.2} />
      <pointLight position={[-5, 2, 3]} intensity={18} color={palette.need} />
      <Rig>
        {BLOCKS.map((b, i) => (
          <Block key={b.key} x={b.x} h={b.h} color={palette[b.key]} phase={i * 1.3} />
        ))}
        <gridHelper args={[12, 24, palette.grid, palette.grid]} material-transparent material-opacity={0.28} />
        <Coins color={palette.coin} />
      </Rig>
    </Canvas>
  );
}
