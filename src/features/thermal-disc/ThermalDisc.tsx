import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type DiscTexture = "LST" | "NDVI" | "NDBI" | "NDWI" | "OPTIMIZED" | "CORRUPTED";

interface DiscProps {
  texture?: DiscTexture;
  size?: number;
  className?: string;
}

function makeTexture(variant: DiscTexture): THREE.CanvasTexture {
  const S = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(S, S);

  const palettes: Record<DiscTexture, (t: number) => [number, number, number]> = {
    LST: (t) => mix([22, 119, 255], [239, 43, 22], smooth(t)),
    NDVI: (t) => mix([120, 100, 60], [76, 175, 80], smooth(t)),
    NDBI: (t) => mix([70, 70, 80], [255, 138, 76], smooth(t)),
    NDWI: (t) => mix([100, 85, 60], [22, 119, 255], smooth(t)),
    OPTIMIZED: (t) => mix([239, 43, 22], [76, 175, 80], smooth(t)),
    CORRUPTED: () => [17, 17, 17],
  };
  const p = palettes[variant];

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      const nx = (x / S) * 2 - 1;
      const ny = (y / S) * 2 - 1;
      const r = Math.hypot(nx, ny);
      if (r > 1) { img.data[i + 3] = 0; continue; }

      let v: number;
      if (variant === "CORRUPTED") {
        // A missing GIS tile: dark quadrant with scanline glitch
        const dead = x > S * 0.45 && y > S * 0.35 && x < S * 0.8 && y < S * 0.7;
        v = dead ? 0 : 0.35 + 0.3 * Math.sin(x * 0.09) * Math.cos(y * 0.07);
        if (!dead && ((y * 7 + x * 3) % 211 === 0)) v = 1;
      } else {
        // Deterministic pseudo-noise: layered sinusoids + radial hotspot
        const n =
          0.5 +
          0.22 * Math.sin(nx * 5.1 + ny * 3.3) +
          0.16 * Math.sin(nx * 9.7 - ny * 7.9 + 1.7) +
          0.12 * Math.sin(nx * 17.3 + ny * 11.1 + 4.2) -
          0.35 * Math.exp(-((nx + 0.25) ** 2 + (ny - 0.15) ** 2) * 3.2);
        v = n * (1 - 0.15 * r);
      }
      const [rr, gg, bb] = p(Math.min(Math.max(v, 0), 1));
      img.data[i] = rr; img.data[i + 1] = gg; img.data[i + 2] = bb;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  // Rim + graticule for instrument feel
  ctx.strokeStyle = "rgba(17,17,17,0.9)";
  ctx.lineWidth = 10;
  ctx.beginPath(); ctx.arc(S / 2, S / 2, S / 2 - 5, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "rgba(17,17,17,0.35)";
  ctx.lineWidth = 2;
  for (const a of [0, Math.PI / 2]) {
    ctx.beginPath();
    ctx.moveTo(S / 2 + Math.cos(a) * (S / 2 - 12), S / 2 + Math.sin(a) * (S / 2 - 12));
    ctx.lineTo(S / 2 - Math.cos(a) * (S / 2 - 12), S / 2 - Math.sin(a) * (S / 2 - 12));
    ctx.stroke();
  }
  return new THREE.CanvasTexture(canvas);
}

function smooth(t: number) { return t * t * (3 - 2 * t); }
function mix(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return a.map((c, i) => c + (b[i] - c) * t) as [number, number, number];
}

function Disc({ texture }: { texture: DiscTexture }) {
  const mesh = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => makeTexture(texture), [texture]);

  useFrame((state, dt) => {
    if (!mesh.current) return;
    mesh.current.rotation.y += dt * 0.12;
    const targetX = state.pointer.y * 0.35;
    const targetZ = state.pointer.x * 0.2;
    mesh.current.rotation.x += (targetX - mesh.current.rotation.x) * 0.06;
    mesh.current.rotation.z += (targetZ - mesh.current.rotation.z) * 0.06;
  });

  return (
    <mesh ref={mesh} rotation={[0.4, 0, 0]}>
      <cylinderGeometry args={[2.1, 2.1, 0.28, 96]} />
      <meshStandardMaterial map={tex} roughness={0.55} metalness={0.08} />
    </mesh>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} color="#fff6e0" />
      <directionalLight position={[-5, -3, -4]} intensity={0.5} color="#ff5a1f" />
      <pointLight position={[0, 0, 6]} intensity={0.4} color="#ffd43b" />
    </>
  );
}

/** Static CSS fallback (reduced motion / no-WebGL / lazy-hydration). */
export function DiscFallback({ texture = "LST", className }: { texture?: DiscTexture; className?: string }) {
  const grad =
    texture === "NDVI" ? "radial-gradient(circle at 40% 38%, #4CAF50, #6b5636 65%)"
    : texture === "CORRUPTED" ? "radial-gradient(circle at 40% 38%, #333, #111 70%)"
    : "radial-gradient(circle at 40% 38%, #FFD43B, #FF5A1F 45%, #EF2B16 80%)";
  return (
    <div
      role="img"
      aria-label={`Thermal disc — ${texture} (static fallback)`}
      className={`rounded-full border-2 border-ink shadow-[0_0_80px_rgba(255,90,31,0.25)] ${className ?? ""}`}
      style={{ background: grad, width: "100%", height: "100%" }}
    />
  );
}

export default function ThermalDisc({ texture = "LST", className }: DiscProps) {
  const [webglOk, setWebglOk] = useState(true);
  const [activated, setActivated] = useState(false);
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useEffect(() => {
    if (reduced) return;
    try {
      const c = document.createElement("canvas");
      setWebglOk(!!(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setWebglOk(false);
    }
    // Lazy-activate WebGL after first paint to protect LCP.
    const id = requestIdleCallback?.(() => setActivated(true)) ?? window.setTimeout(() => setActivated(true), 300);
    return () => {
      if (typeof id === "number") clearTimeout(id);
      else cancelIdleCallback?.(id as unknown as number);
    };
  }, [reduced]);

  if (reduced || !webglOk || !activated) {
    return (
      <div className={className} style={{ width: "100%", height: "100%" }}>
        <DiscFallback texture={texture} />
      </div>
    );
  }

  return (
    <div className={className} style={{ width: "100%", height: "100%" }} role="img" aria-label={`Interactive thermal disc — ${texture}`}>
      <Canvas camera={{ position: [0, 1.6, 5.2], fov: 42 }} dpr={[1, 1.75]}>
        <Lights />
        <Disc texture={texture} />
      </Canvas>
    </div>
  );
}
