import React from "react";
import { Pose, skelett } from "./figur";

// =============================================================
//  Cartoon-Tribut: flache 2D-Figur mit Kleidung, dicker Outline
//  und Gesicht (Ausdrücke). Nutzt dasselbe Skelett wie die Silhouetten.
// =============================================================

export type Ausdruck = "neutral" | "entschlossen" | "panik" | "schmerz" | "angst" | "erleichtert";
export type Look = {
  haut: string;
  oberteil: string;
  hose: string;
  schuhe: string;
  haare: string;
  frisur: "zopf" | "stachel" | "kurz";
};

export const LOOKS = {
  lira: { haut: "#f1c7a1", oberteil: "#3f7d4c", hose: "#5a4532", schuhe: "#2b211a", haare: "#8b3a1d", frisur: "zopf" },
  tam: { haut: "#e9b98f", oberteil: "#d0782f", hose: "#46536a", schuhe: "#2b211a", haare: "#3a291c", frisur: "stachel" },
} satisfies Record<string, Look>;

export const zufallsLook = (i: number): Look => {
  const ob = ["#b23a3a", "#3a63b2", "#8a3ab2", "#c9a13a", "#3aa38f", "#6b6b6b", "#b25f3a"];
  const ha = ["#2b1d12", "#6b4423", "#d9b26b", "#1b1b1b", "#9a4a22"];
  const hu = ["#f1c7a1", "#d9a074", "#a8704a", "#7a4b2e", "#f5d3b5"];
  return {
    haut: hu[i % hu.length],
    oberteil: ob[i % ob.length],
    hose: ["#3d3d4a", "#4a3d2d", "#2d3d4a"][i % 3],
    schuhe: "#1e1712",
    haare: ha[(i * 3) % ha.length],
    frisur: (["kurz", "zopf", "stachel"] as const)[i % 3],
  };
};

const dunkler = (hex: string, f = 0.78) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return `rgb(${r},${g},${b})`;
};

const LINIE = "#16121a";

export const CartoonTribut: React.FC<{
  x: number;
  y: number;
  pose: Pose;
  s: number;
  look: Look;
  richtung?: 1 | -1;
  ausdruck?: Ausdruck;
  frame?: number;
  kippen?: number;
  deckkraft?: number;
  licht?: string; // Randlicht-Farbe (Gegenlicht von der Sonne)
}> = ({ x, y, pose, s, look, richtung = 1, ausdruck = "neutral", frame = 0, kippen = 0, deckkraft = 1, licht }) => {
  const k = skelett(pose, s);
  const o = 5.5 * s; // Outline-Stärke
  const kopfR = 30 * s;
  const kx = k.kopf.x;
  const ky = k.kopf.y - 4 * s;

  const glied = (pfad: string, breite: number, farbe: string) => (
    <>
      <path d={pfad} stroke={LINIE} strokeWidth={breite + o * 2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={pfad} stroke={farbe} strokeWidth={breite} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  );
  const p3 = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) => `M ${a.x} ${a.y} L ${b.x} ${b.y} L ${c.x} ${c.y}`;

  // Rumpf als Form
  const dx = k.schulter.x - k.huefte.x;
  const dy = k.schulter.y - k.huefte.y;
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l;
  const ny = dx / l;
  const hb = 17 * s;
  const sb = 21 * s;
  const rumpf = `M ${k.huefte.x + nx * hb} ${k.huefte.y + ny * hb} L ${k.schulter.x + nx * sb} ${k.schulter.y + ny * sb} L ${k.schulter.x - nx * sb} ${k.schulter.y - ny * sb} L ${k.huefte.x - nx * hb} ${k.huefte.y - ny * hb} Z`;

  const fuss = (knie: { x: number; y: number }, f: { x: number; y: number }, farbe: string) => {
    const w = Math.atan2(f.y - knie.y, f.x - knie.x) - Math.PI / 2;
    return (
      <g transform={`translate(${f.x} ${f.y}) rotate(${(w * 180) / Math.PI * 0.4})`}>
        <ellipse cx={6 * s} cy={2 * s} rx={15 * s} ry={8 * s} fill={farbe} stroke={LINIE} strokeWidth={o} />
      </g>
    );
  };
  const hand = (p: { x: number; y: number }) => <circle cx={p.x} cy={p.y} r={8.5 * s} fill={look.haut} stroke={LINIE} strokeWidth={o} />;

  // ---------- Haare ----------
  const haareHinten = () => {
    if (look.frisur !== "zopf") return null;
    const flug = Math.min(1, Math.max(0, pose.lean / 30));
    const sw = Math.sin(frame / 5) * 0.25;
    const ax = kx - kopfR * 0.6;
    const ay = ky - kopfR * 0.55;
    const ex = kx - kopfR * (1.5 + flug * 0.7);
    const ey = ky + kopfR * (0.7 - flug * 0.8) + sw * kopfR;
    const d = `M ${ax} ${ay} Q ${kx - kopfR * 1.6} ${ky - kopfR * 0.9 + sw * kopfR} ${ex} ${ey}`;
    return (
      <>
        <path d={d} stroke={LINIE} strokeWidth={17 * s + o * 2} strokeLinecap="round" fill="none" />
        <path d={d} stroke={look.haare} strokeWidth={17 * s} strokeLinecap="round" fill="none" />
      </>
    );
  };
  const haareOben = () => {
    if (look.frisur === "stachel") {
      const zacken = [-1.9, -1.45, -1.0, -0.55, -0.1];
      const pts = zacken
        .map((a, i) => {
          const r1 = kopfR * 0.98;
          const r2 = kopfR * (1.38 + (i % 2) * 0.12);
          const a1 = a - 0.2;
          const a2 = a + 0.25;
          return `L ${kx + Math.cos(a1) * r1} ${ky + Math.sin(a1) * r1} L ${kx + Math.cos(a) * r2} ${ky + Math.sin(a) * r2} L ${kx + Math.cos(a2) * r1} ${ky + Math.sin(a2) * r1}`;
        })
        .join(" ");
      return (
        <path
          d={`M ${kx - kopfR} ${ky} ${pts} L ${kx + kopfR * 0.55} ${ky - kopfR * 0.55} Q ${kx} ${ky - kopfR * 0.4} ${kx - kopfR * 0.6} ${ky - kopfR * 0.1} Z`}
          fill={look.haare}
          stroke={LINIE}
          strokeWidth={o}
          strokeLinejoin="round"
        />
      );
    }
    // Zopf/kurz: Haarkappe
    return (
      <path
        d={`M ${kx - kopfR * 1.02} ${ky + kopfR * 0.15} A ${kopfR * 1.02} ${kopfR * 1.02} 0 0 1 ${kx + kopfR * 0.85} ${ky - kopfR * 0.55} Q ${kx + kopfR * 0.2} ${ky - kopfR * 0.55} ${kx - kopfR * 0.25} ${ky - kopfR * 0.15} Q ${kx - kopfR * 0.55} ${ky + kopfR * 0.05} ${kx - kopfR * 1.02} ${ky + kopfR * 0.15} Z`}
        fill={look.haare}
        stroke={LINIE}
        strokeWidth={o}
        strokeLinejoin="round"
      />
    );
  };

  // ---------- Gesicht (3/4-Ansicht, schaut in Laufrichtung) ----------
  const gesicht = () => {
    const ex1 = kx + kopfR * 0.12;
    const ex2 = kx + kopfR * 0.58;
    const ey = ky - kopfR * 0.02;
    const augeR = 3.6 * s;
    const mund = { x: kx + kopfR * 0.42, y: ky + kopfR * 0.48 };
    const braue = (exx: number, w: number, hoch: number) => (
      <line
        x1={exx - 7 * s}
        y1={ey - 11 * s - hoch}
        x2={exx + 7 * s}
        y2={ey - 11 * s - hoch}
        stroke={LINIE}
        strokeWidth={3.2 * s}
        strokeLinecap="round"
        transform={`rotate(${w} ${exx} ${ey - 11 * s - hoch})`}
      />
    );
    const gross = ausdruck === "panik" || ausdruck === "angst";
    const augen =
      ausdruck === "schmerz" ? (
        <>
          {[ex1, ex2].map((e, i) => (
            <path key={i} d={`M ${e - 5 * s} ${ey - 4 * s} L ${e + 4 * s} ${ey} L ${e - 5 * s} ${ey + 4 * s}`} stroke={LINIE} strokeWidth={3 * s} fill="none" strokeLinecap="round" strokeLinejoin="round" transform={i === 1 ? `scale(-1 1) translate(${-2 * e} 0)` : undefined} />
          ))}
        </>
      ) : (
        <>
          {[ex1, ex2].map((e, i) => (
            <g key={i}>
              <ellipse cx={e} cy={ey} rx={augeR * (gross ? 1.35 : 1)} ry={augeR * (gross ? 1.7 : 1.25)} fill={LINIE} />
              <circle cx={e + augeR * 0.35} cy={ey - augeR * 0.45} r={augeR * 0.38} fill="white" />
            </g>
          ))}
        </>
      );
    const brauen =
      ausdruck === "entschlossen" ? (
        <>{braue(ex1, 14, 0)}{braue(ex2, -14, 0)}</>
      ) : ausdruck === "panik" || ausdruck === "angst" ? (
        <>{braue(ex1, -12, 5 * s)}{braue(ex2, 12, 5 * s)}</>
      ) : ausdruck === "schmerz" ? (
        <>{braue(ex1, -18, 2 * s)}{braue(ex2, 18, 2 * s)}</>
      ) : (
        <>{braue(ex1, 0, 0)}{braue(ex2, 0, 0)}</>
      );
    let mundForm: React.ReactNode;
    if (ausdruck === "panik")
      mundForm = <ellipse cx={mund.x} cy={mund.y} rx={6 * s} ry={8.5 * s} fill="#5a1a1a" stroke={LINIE} strokeWidth={2.6 * s} />;
    else if (ausdruck === "schmerz")
      mundForm = <path d={`M ${mund.x - 9 * s} ${mund.y + 2 * s} Q ${mund.x} ${mund.y - 7 * s} ${mund.x + 9 * s} ${mund.y + 2 * s} Z`} fill="#5a1a1a" stroke={LINIE} strokeWidth={2.6 * s} strokeLinejoin="round" />;
    else if (ausdruck === "angst")
      mundForm = <path d={`M ${mund.x - 7 * s} ${mund.y + 2 * s} Q ${mund.x - 3 * s} ${mund.y - 3 * s} ${mund.x} ${mund.y + 1 * s} Q ${mund.x + 3 * s} ${mund.y + 4 * s} ${mund.x + 7 * s} ${mund.y - 1 * s}`} stroke={LINIE} strokeWidth={2.8 * s} fill="none" strokeLinecap="round" />;
    else if (ausdruck === "entschlossen")
      mundForm = <path d={`M ${mund.x - 8 * s} ${mund.y + 1 * s} L ${mund.x + 7 * s} ${mund.y - 1 * s}`} stroke={LINIE} strokeWidth={3 * s} strokeLinecap="round" />;
    else if (ausdruck === "erleichtert")
      mundForm = <path d={`M ${mund.x - 8 * s} ${mund.y - 2 * s} Q ${mund.x} ${mund.y + 7 * s} ${mund.x + 8 * s} ${mund.y - 2 * s}`} stroke={LINIE} strokeWidth={3 * s} fill="none" strokeLinecap="round" />;
    else mundForm = <path d={`M ${mund.x - 6 * s} ${mund.y} Q ${mund.x} ${mund.y + 3 * s} ${mund.x + 6 * s} ${mund.y}`} stroke={LINIE} strokeWidth={3 * s} fill="none" strokeLinecap="round" />;
    return (
      <g>
        {augen}
        {brauen}
        {mundForm}
        {/* Nase andeuten */}
        <path d={`M ${kx + kopfR * 0.92} ${ky + kopfR * 0.05} Q ${kx + kopfR * 1.08} ${ky + kopfR * 0.22} ${kx + kopfR * 0.9} ${ky + kopfR * 0.3}`} stroke={dunkler(look.haut, 0.7)} strokeWidth={2.4 * s} fill="none" strokeLinecap="round" />
        {(ausdruck === "panik" || ausdruck === "schmerz") && (
          <path d={`M ${kx - kopfR * 0.15} ${ky - kopfR * 0.55} q ${-3 * s} ${6 * s} 0 ${9 * s} q ${3 * s} ${-3 * s} 0 ${-9 * s}`} fill="#9fd8ff" stroke={LINIE} strokeWidth={1.6 * s} />
        )}
      </g>
    );
  };

  const randlicht = licht ? (
    <g opacity={0.85} style={{ mixBlendMode: "screen" }} filter="url(#unschaerfe)">
      <path d={rumpf} fill="none" stroke={licht} strokeWidth={4 * s} transform={`translate(${-3 * s} 0)`} />
      <circle cx={kx - 3 * s} cy={ky} r={kopfR} fill="none" stroke={licht} strokeWidth={4 * s} />
    </g>
  ) : null;

  return (
    <g transform={`translate(${x} ${y}) scale(${richtung} 1) rotate(${kippen})`} opacity={deckkraft}>
      {/* hinten */}
      {haareHinten()}
      {glied(p3(k.schulter, k.armH.ellbogen, k.armH.hand), 15 * s, dunkler(look.oberteil))}
      {hand(k.armH.hand)}
      {glied(p3(k.huefte, k.knieH, k.fussH), 20 * s, dunkler(look.hose))}
      {fuss(k.knieH, k.fussH, look.schuhe)}
      {/* Mitte */}
      {glied(p3(k.huefte, k.knieV, k.fussV), 20 * s, look.hose)}
      {fuss(k.knieV, k.fussV, look.schuhe)}
      <path d={rumpf} fill={look.oberteil} stroke={LINIE} strokeWidth={o} strokeLinejoin="round" />
      {/* Gürtel */}
      <path d={`M ${k.huefte.x + nx * hb} ${k.huefte.y + ny * hb} L ${k.huefte.x - nx * hb} ${k.huefte.y - ny * hb}`} stroke={dunkler(look.hose, 0.6)} strokeWidth={7 * s} />
      {/* Hals + Kopf */}
      <path d={`M ${k.schulter.x} ${k.schulter.y} L ${kx} ${ky + kopfR * 0.6}`} stroke={LINIE} strokeWidth={12 * s + o * 2} strokeLinecap="round" />
      <path d={`M ${k.schulter.x} ${k.schulter.y} L ${kx} ${ky + kopfR * 0.6}`} stroke={look.haut} strokeWidth={12 * s} strokeLinecap="round" />
      <circle cx={kx} cy={ky} r={kopfR} fill={look.haut} stroke={LINIE} strokeWidth={o} />
      {haareOben()}
      {gesicht()}
      {/* vorne */}
      {glied(p3(k.schulter, k.armV.ellbogen, k.armV.hand), 15 * s, look.oberteil)}
      {hand(k.armV.hand)}
      {randlicht}
    </g>
  );
};
