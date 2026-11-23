import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { clamp } from "./mathe";

export const W = 1080;
export const H = 1920;

/** Kamera: zoomt auf Punkt (x, y), dazu Wackler. Alles in Szenen-Koordinaten (1080×1920). */
export const Kamera: React.FC<{
  x?: number;
  y?: number;
  zoom?: number;
  rot?: number;
  wackler?: { x: number; y: number; r: number };
  children: React.ReactNode;
}> = ({ x = W / 2, y = H / 2, zoom = 1, rot = 0, wackler, children }) => {
  const wx = wackler?.x ?? 0;
  const wy = wackler?.y ?? 0;
  const wr = wackler?.r ?? 0;
  return (
    <g
      transform={`translate(${W / 2 + wx} ${H / 2 + wy}) rotate(${rot + wr}) scale(${zoom}) translate(${-x} ${-y})`}
    >
      {children}
    </g>
  );
};

/** Bühne: SVG in voller Größe mit Standard-Filtern */
export const Buehne: React.FC<{ children: React.ReactNode; hintergrund?: string }> = ({
  children,
  hintergrund = "#000",
}) => (
  <svg
    viewBox={`0 0 ${W} ${H}`}
    width={W}
    height={H}
    style={{ position: "absolute", inset: 0, background: hintergrund }}
  >
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="10" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="glowGross" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="28" />
      </filter>
      <filter id="weich" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="40" />
      </filter>
      <filter id="unschaerfe" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
    </defs>
    {children}
  </svg>
);

/** Partikel (Asche, Funken, Glühwürmchen) */
export const Partikel: React.FC<{
  anzahl: number;
  seed: string;
  farbe: string;
  groesse?: [number, number];
  tempo?: number; // Pixel pro Frame nach oben (negativ = fallen)
  drift?: number;
  bereich?: { x: number; y: number; w: number; h: number };
  glow?: boolean;
  flackern?: boolean;
}> = ({
  anzahl,
  seed,
  farbe,
  groesse = [2, 6],
  tempo = 1.5,
  drift = 30,
  bereich = { x: -100, y: -100, w: W + 200, h: H + 200 },
  glow = true,
  flackern = false,
}) => {
  const frame = useCurrentFrame();
  return (
    <g filter={glow ? "url(#glow)" : undefined}>
      {Array.from({ length: anzahl }).map((_, i) => {
        const r0 = random(`${seed}-x-${i}`);
        const r1 = random(`${seed}-y-${i}`);
        const r2 = random(`${seed}-s-${i}`);
        const v = tempo * (0.5 + r2);
        let y = (r1 * bereich.h - frame * v) % bereich.h;
        if (y < 0) y += bereich.h;
        const x = bereich.x + r0 * bereich.w + Math.sin(frame / 25 + i) * drift;
        const g = groesse[0] + r2 * (groesse[1] - groesse[0]);
        const op = flackern
          ? clamp(0.5 + 0.5 * Math.sin(frame / (5 + r0 * 8) + i * 3))
          : 0.5 + r2 * 0.5;
        return <circle key={i} cx={x} cy={bereich.y + y} r={g} fill={farbe} opacity={op} />;
      })}
    </g>
  );
};

/** Filmkorn + Vignette über allem */
export const FilmLook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)",
        }}
      />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.09, mixBlendMode: "overlay" }}>
        <filter id="korn">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 12} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter="url(#korn)" />
      </svg>
    </AbsoluteFill>
  );
};

/** Weißer (oder farbiger) Blitz */
export const Blitz: React.FC<{ start: number; dauer?: number; farbe?: string; staerke?: number }> = ({
  start,
  dauer = 8,
  farbe = "white",
  staerke = 0.9,
}) => {
  const frame = useCurrentFrame();
  const d = frame - start;
  if (d < 0 || d > dauer) return null;
  return (
    <AbsoluteFill style={{ background: farbe, opacity: staerke * (1 - d / dauer) }} />
  );
};

/** Lichtstrahlen, die aus einem Punkt kommen */
export const Strahlen: React.FC<{
  x: number;
  y: number;
  laenge: number;
  anzahl?: number;
  farbe?: string;
  deckkraft: number;
  drehung?: number;
}> = ({ x, y, laenge, anzahl = 14, farbe = "#FFE9B0", deckkraft, drehung = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${drehung})`} opacity={deckkraft} style={{ mixBlendMode: "screen" }}>
    <defs>
      <radialGradient id="strahlVerlauf">
        <stop offset="0" stopColor={farbe} stopOpacity={0.9} />
        <stop offset="1" stopColor={farbe} stopOpacity={0} />
      </radialGradient>
    </defs>
    {Array.from({ length: anzahl }).map((_, i) => {
      const a = (i / anzahl) * Math.PI * 2;
      const b = a + (Math.PI * 2) / anzahl / 2.6;
      return (
        <path
          key={i}
          d={`M 0 0 L ${Math.cos(a) * laenge} ${Math.sin(a) * laenge} L ${Math.cos(b) * laenge} ${Math.sin(b) * laenge} Z`}
          fill="url(#strahlVerlauf)"
        />
      );
    })}
  </g>
);
