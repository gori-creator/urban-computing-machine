import React from "react";
import { random } from "remotion";
import { clamp, lerp, rauschen } from "./mathe";

export const LINIEN_FARBE = "#59F3FF";

type P = { x: number; y: number };

/**
 * Die leuchtende Verbindung zwischen zwei Tributen.
 * - locker: hängt durch
 * - gespannt (Abstand >= maxLaenge): gerade + vibriert
 * - riss (0..1): Linie reißt in der Mitte und zieht sich zurück
 */
export const Verbindung: React.FC<{
  a: P;
  b: P;
  maxLaenge: number;
  frame: number;
  helligkeit?: number; // 0..1+
  riss?: number;
  farbe?: string;
  dicke?: number;
  seed?: string;
}> = ({ a, b, maxLaenge, frame, helligkeit = 1, riss = 0, farbe = LINIEN_FARBE, dicke = 1, seed = "v" }) => {
  if (helligkeit <= 0) return null;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const locker = clamp(1 - dist / maxLaenge);
  const durchhang = Math.sqrt(Math.max(0, maxLaenge * maxLaenge - dist * dist)) * 0.35;
  const spannung = clamp((dist / maxLaenge - 0.92) / 0.08);
  const vib = rauschen(seed, frame * 1.7) * 10 * spannung;
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + durchhang * locker + vib };

  // Flackern
  const flacker = 0.85 + 0.15 * rauschen(seed + "f", frame * 0.8);
  const op = clamp(helligkeit * flacker, 0, 1.3);

  // Punkt auf der Kurve (quadratisch)
  const q = (t: number) => ({
    x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * mid.x + t * t * b.x,
    y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * mid.y + t * t * b.y,
  });
  const segment = (t0: number, t1: number) => {
    const pts = Array.from({ length: 13 }, (_, i) => q(lerp(t0, t1, i / 12)));
    return "M " + pts.map((p) => `${p.x} ${p.y}`).join(" L ");
  };

  const pfade =
    riss > 0
      ? [segment(0, 0.5 * (1 - riss)), segment(1 - 0.5 * (1 - riss), 1)]
      : [segment(0, 1)];

  const funken =
    riss > 0 && riss < 1
      ? Array.from({ length: 14 }).map((_, i) => {
          const w = random(`${seed}-fw-${i}`) * Math.PI * 2;
          const v = 40 + random(`${seed}-fv-${i}`) * 160;
          const m = q(0.5);
          return (
            <circle
              key={i}
              cx={m.x + Math.cos(w) * v * riss}
              cy={m.y + Math.sin(w) * v * riss + 120 * riss * riss}
              r={4 * (1 - riss) + 1}
              fill="white"
            />
          );
        })
      : null;

  return (
    <g opacity={op} style={{ mixBlendMode: "screen" }}>
      {pfade.map((d, i) => (
        <g key={i}>
          <path d={d} stroke={farbe} strokeWidth={26 * dicke} fill="none" strokeLinecap="round" opacity={0.35} filter="url(#glowGross)" />
          <path d={d} stroke={farbe} strokeWidth={9 * dicke} fill="none" strokeLinecap="round" filter="url(#glow)" />
          <path d={d} stroke="white" strokeWidth={3 * dicke} fill="none" strokeLinecap="round" />
        </g>
      ))}
      {/* Leuchtende Knoten an den Enden */}
      <circle cx={a.x} cy={a.y} r={7 * dicke} fill="white" filter="url(#glow)" />
      <circle cx={b.x} cy={b.y} r={7 * dicke} fill="white" filter="url(#glow)" />
      <g filter="url(#glow)">{funken}</g>
    </g>
  );
};
