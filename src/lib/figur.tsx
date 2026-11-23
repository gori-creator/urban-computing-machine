import React from "react";
import { lerp } from "./mathe";

// ================================================================
//  Tribut-Figur: Silhouette mit Gelenken (Skelett-Animation)
// ================================================================
//  Winkel in Grad. Gliedmaßen: 0 = gerade nach unten, positiv = nach vorne.
//  Knie: positiv = Unterschenkel knickt nach hinten.
//  Ellbogen: positiv = Unterarm knickt nach vorne/oben.

export type Pose = {
  lean: number; // Oberkörper-Neigung (positiv = nach vorne)
  kopf: number; // Kopfneigung zusätzlich
  armV: [number, number]; // vorderer Arm: [Schulter, Ellbogen]
  armH: [number, number]; // hinterer Arm
  beinV: [number, number]; // vorderes Bein: [Hüfte, Knie]
  beinH: [number, number]; // hinteres Bein
  hub?: number; // extra Höhe (Sprung / Flugphase)
};

const L = { oberschenkel: 48, unterschenkel: 48, rumpf: 72, hals: 10, kopf: 23, oberarm: 40, unterarm: 38 };

const rad = (g: number) => (g * Math.PI) / 180;
const nachUnten = (winkel: number, laenge: number) => ({
  x: Math.sin(rad(winkel)) * laenge,
  y: Math.cos(rad(winkel)) * laenge,
});

export const mischePose = (a: Pose, b: Pose, t: number): Pose => ({
  lean: lerp(a.lean, b.lean, t),
  kopf: lerp(a.kopf, b.kopf, t),
  armV: [lerp(a.armV[0], b.armV[0], t), lerp(a.armV[1], b.armV[1], t)],
  armH: [lerp(a.armH[0], b.armH[0], t), lerp(a.armH[1], b.armH[1], t)],
  beinV: [lerp(a.beinV[0], b.beinV[0], t), lerp(a.beinV[1], b.beinV[1], t)],
  beinH: [lerp(a.beinH[0], b.beinH[0], t), lerp(a.beinH[1], b.beinH[1], t)],
  hub: lerp(a.hub ?? 0, b.hub ?? 0, t),
});

// ---------- Posen-Bibliothek ----------
export const POSEN = {
  stehen: (f = 0): Pose => {
    const atem = Math.sin(f / 18);
    return { lean: 2 + atem, kopf: 0, armV: [6 + atem * 2, 12], armH: [-6 - atem * 2, 12], beinV: [4, 3], beinH: [-4, 3] };
  },
  rennen: (phase: number): Pose => {
    const s = Math.sin(phase);
    const k1 = 18 + 75 * Math.max(0, Math.sin(phase + 1.4));
    const k2 = 18 + 75 * Math.max(0, Math.sin(phase + Math.PI + 1.4));
    return {
      lean: 16,
      kopf: -6,
      armV: [-45 * s, 85],
      armH: [45 * s, 85],
      beinV: [42 * s, k1],
      beinH: [-42 * s, k2],
      hub: 8 * Math.abs(Math.cos(phase)),
    };
  },
  schleichen: (phase: number): Pose => {
    const s = Math.sin(phase);
    return {
      lean: 38,
      kopf: -30,
      armV: [30 + 10 * s, 70],
      armH: [10 - 10 * s, 60],
      beinV: [35 + 20 * s, 70 + 15 * Math.max(0, s)],
      beinH: [-5 - 20 * s, 70 + 15 * Math.max(0, -s)],
    };
  },
  stolpern: (): Pose => ({ lean: 50, kopf: -10, armV: [80, 10], armH: [60, 20], beinV: [10, 40], beinH: [-50, 70] }),
  knien: (): Pose => ({ lean: 20, kopf: 10, armV: [40, 30], armH: [20, 30], beinV: [85, 88], beinH: [-25, 115] }),
  zurueckgerissen: (): Pose => ({ lean: -28, kopf: 15, armV: [-30, 30], armH: [-60, 20], beinV: [35, 10], beinH: [-10, 25] }),
  ziehen: (): Pose => ({ lean: -12, kopf: 5, armV: [95, 5], armH: [70, 30], beinV: [30, 15], beinH: [-25, 20] }),
  armHoch: (f = 0): Pose => ({ ...POSEN.stehen(f), armV: [170, 10], kopf: -10 }),
  gefallen: (): Pose => ({ lean: 70, kopf: 20, armV: [70, 10], armH: [50, 10], beinV: [60, 70], beinH: [10, 90] }),
  kampfbereit: (f = 0): Pose => {
    const a = Math.sin(f / 10);
    return { lean: 12 + a, kopf: -8, armV: [55, 60], armH: [35, 70], beinV: [28, 22], beinH: [-22, 18] };
  },
};

// ---------- Geometrie berechnen ----------
export const skelett = (p: Pose, s: number) => {
  const huefteRel = { x: 0, y: 0 };
  const knieV = nachUnten(p.beinV[0], L.oberschenkel);
  const fussV = { x: knieV.x + nachUnten(p.beinV[0] - p.beinV[1], L.unterschenkel).x, y: knieV.y + nachUnten(p.beinV[0] - p.beinV[1], L.unterschenkel).y };
  const knieH = nachUnten(p.beinH[0], L.oberschenkel);
  const fussH = { x: knieH.x + nachUnten(p.beinH[0] - p.beinH[1], L.unterschenkel).x, y: knieH.y + nachUnten(p.beinH[0] - p.beinH[1], L.unterschenkel).y };
  // Tiefster Punkt (Fuß oder Knie) steht auf dem Boden
  const tiefster = Math.max(fussV.y, fussH.y, knieV.y, knieH.y);
  const hy = -tiefster - (p.hub ?? 0);

  const schulter = { x: Math.sin(rad(p.lean)) * L.rumpf, y: hy - Math.cos(rad(p.lean)) * L.rumpf };
  const kw = p.lean + p.kopf;
  const kopf = {
    x: schulter.x + Math.sin(rad(kw)) * (L.hals + L.kopf),
    y: schulter.y - Math.cos(rad(kw)) * (L.hals + L.kopf),
  };
  const arm = (a: [number, number]) => {
    const e = nachUnten(a[0], L.oberarm);
    const h = nachUnten(a[0] + a[1], L.unterarm);
    return {
      ellbogen: { x: schulter.x + e.x, y: schulter.y + e.y },
      hand: { x: schulter.x + e.x + h.x, y: schulter.y + e.y + h.y },
    };
  };
  const sc = (pt: { x: number; y: number }) => ({ x: pt.x * s, y: pt.y * s });
  const verschoben = (pt: { x: number; y: number }) => sc({ x: pt.x, y: pt.y + hy });
  return {
    huefte: sc({ x: huefteRel.x, y: hy }),
    schulter: sc(schulter),
    kopf: sc(kopf),
    kopfWinkel: kw,
    knieV: verschoben(knieV),
    fussV: verschoben(fussV),
    knieH: verschoben(knieH),
    fussH: verschoben(fussH),
    armV: { ellbogen: sc(arm(p.armV).ellbogen), hand: sc(arm(p.armV).hand) },
    armH: { ellbogen: sc(arm(p.armH).ellbogen), hand: sc(arm(p.armH).hand) },
    taille: sc({ x: Math.sin(rad(p.lean)) * 22, y: hy - Math.cos(rad(p.lean)) * 22 }),
  };
};

export type Frisur = "zopf" | "stachel" | "kurz" | "keine";

/** Weltposition eines Skelettpunkts (für Linien, Fadenkreuz usw.) */
export const weltPunkt = (
  x: number,
  y: number,
  pose: Pose,
  s: number,
  richtung: 1 | -1,
  punkt: "taille" | "kopf" | "schulter" | "huefte",
  kippen = 0,
) => {
  const sk = skelett(pose, s);
  const p0 = sk[punkt];
  const a = rad(kippen);
  const p = { x: p0.x * Math.cos(a) - p0.y * Math.sin(a), y: p0.x * Math.sin(a) + p0.y * Math.cos(a) };
  return { x: x + p.x * richtung, y: y + p.y };
};

export const Tribut: React.FC<{
  x: number;
  y: number; // Bodenhöhe
  pose: Pose;
  s?: number;
  richtung?: 1 | -1;
  farbe?: string;
  frisur?: Frisur;
  frame?: number;
  deckkraft?: number;
  rand?: string; // farbiger Rand (Gegenlicht)
  randBreite?: number;
  kippen?: number; // ganzen Körper um die Füße drehen (Grad) – z. B. Umfallen
}> = ({ x, y, pose, s = 1, richtung = 1, farbe = "#07060a", frisur = "keine", frame = 0, deckkraft = 1, rand, randBreite = 5, kippen = 0 }) => {
  const k = skelett(pose, s);
  const pfad = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) =>
    `M ${a.x} ${a.y} L ${b.x} ${b.y} L ${c.x} ${c.y}`;

  const glieder = (zusatz: number, col: string) => (
    <g stroke={col} strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* hinteres Bein + Arm */}
      <path d={pfad(k.huefte, k.knieH, k.fussH)} strokeWidth={(20 + zusatz) * s} />
      <path d={pfad(k.schulter, k.armH.ellbogen, k.armH.hand)} strokeWidth={(13 + zusatz) * s} />
      {/* Rumpf: breite Schultern, schmalere Hüfte */}
      {(() => {
        const dx = k.schulter.x - k.huefte.x;
        const dy = k.schulter.y - k.huefte.y;
        const l = Math.hypot(dx, dy) || 1;
        const nx = -dy / l;
        const ny = dx / l;
        const hb = 15 * s;
        const sb = 22 * s;
        const brust = { x: k.huefte.x + dx * 0.72, y: k.huefte.y + dy * 0.72 };
        return (
          <path
            d={`M ${k.huefte.x + nx * hb} ${k.huefte.y + ny * hb} L ${brust.x + nx * sb} ${brust.y + ny * sb} L ${k.schulter.x + nx * sb * 0.8} ${k.schulter.y + ny * sb * 0.8} L ${k.schulter.x - nx * sb * 0.8} ${k.schulter.y - ny * sb * 0.8} L ${brust.x - nx * sb} ${brust.y - ny * sb} L ${k.huefte.x - nx * hb} ${k.huefte.y - ny * hb} Z`}
            fill={col}
            strokeWidth={(14 + zusatz) * s}
          />
        );
      })()}
      {/* Hals */}
      <path d={`M ${k.schulter.x} ${k.schulter.y} L ${(k.schulter.x + k.kopf.x) / 2} ${(k.schulter.y + k.kopf.y) / 2}`} strokeWidth={(14 + zusatz) * s} />
      {/* vorderes Bein + Arm */}
      <path d={pfad(k.huefte, k.knieV, k.fussV)} strokeWidth={(20 + zusatz) * s} />
      <path d={pfad(k.schulter, k.armV.ellbogen, k.armV.hand)} strokeWidth={(13 + zusatz) * s} />
    </g>
  );

  const kopfR = L.kopf * s;
  const haare = (col: string, zusatz: number) => {
    const kx = k.kopf.x;
    const ky = k.kopf.y;
    if (frisur === "zopf") {
      // hoher Pferdeschwanz nach hinten, schwingt beim Laufen
      const sw = Math.sin(frame / 4) * 0.35;
      const flug = Math.min(1, Math.max(0, pose.lean / 30));
      const r = kopfR;
      const ax = kx - r * 0.55;
      const ay = ky - r * 0.8;
      const cx = kx - r * 1.7;
      const cy = ky - r * (0.9 + flug * 0.3) + sw * r;
      const ex = kx - r * (1.9 + flug * 0.8);
      const ey = ky + r * (0.9 - flug * 0.9) + sw * r * 1.6;
      return (
        <path
          d={`M ${ax} ${ay} Q ${cx} ${cy} ${ex} ${ey}`}
          stroke={col}
          strokeWidth={(13 + zusatz) * s}
          strokeLinecap="round"
          fill="none"
        />
      );
    }
    if (frisur === "stachel") {
      const zacken = [-0.9, -0.4, 0.1, 0.6];
      return (
        <g fill={col}>
          {zacken.map((z, i) => {
            const a = rad(k.kopfWinkel) + z - 0.3;
            const bx = kx + Math.sin(a) * kopfR * 0.85;
            const by = ky - Math.cos(a) * kopfR * 0.85;
            const sx = kx + Math.sin(a - 0.15) * kopfR * (1.45 + (i % 2) * 0.15);
            const sy = ky - Math.cos(a - 0.15) * kopfR * (1.45 + (i % 2) * 0.15);
            return (
              <path key={i} d={`M ${bx - 7 * s} ${by} L ${sx} ${sy} L ${bx + 7 * s} ${by + 3 * s} Z`} stroke={col} strokeWidth={zusatz * s} strokeLinejoin="round" />
            );
          })}
        </g>
      );
    }
    if (frisur === "kurz") {
      return <ellipse cx={kx - 2 * s} cy={ky - kopfR * 0.35} rx={kopfR * 1.08 + zusatz * s * 0.5} ry={kopfR * 0.75 + zusatz * s * 0.5} fill={col} />;
    }
    return null;
  };

  return (
    <g transform={`translate(${x} ${y}) scale(${richtung} 1) rotate(${kippen})`} opacity={deckkraft}>
      {rand && (
        <g filter="url(#unschaerfe)" opacity={0.9}>
          {glieder(randBreite, rand)}
          <circle cx={k.kopf.x} cy={k.kopf.y} r={kopfR + (randBreite / 2) * s} fill={rand} />
          {haare(rand, randBreite)}
        </g>
      )}
      {glieder(0, farbe)}
      <circle cx={k.kopf.x} cy={k.kopf.y} r={kopfR} fill={farbe} />
      {haare(farbe, 0)}
    </g>
  );
};

/** Bodenschatten */
export const Schatten: React.FC<{ x: number; y: number; s?: number; deckkraft?: number }> = ({ x, y, s = 1, deckkraft = 0.45 }) => (
  <ellipse cx={x} cy={y + 4} rx={55 * s} ry={9 * s} fill="black" opacity={deckkraft} filter="url(#unschaerfe)" />
);
