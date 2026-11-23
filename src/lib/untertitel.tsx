import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// =============================================================
//  Untertitel im TikTok-Stil
//  - ohne Aufnahme: Wörter werden gleichmäßig über die Szene verteilt
//  - mit Wortzeiten (npm run untertitel:folgeX): jedes Wort erscheint
//    genau dann, wenn du es sagst
// =============================================================

const MAX_WOERTER = 5;

export type Wort = { text: string; betont: boolean; start: number }; // start in Frames
export type Wortzeit = { szene: number; index: number; wort: string; start: number }; // start in Sekunden

const satzende = (w: string) => /[^\d][.,!?…:]$/.test(w) || w === "…";

const zuWoertern = (text: string) =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => ({ text: w.replace(/\*/g, ""), betont: w.includes("*") }));

/** Wörter in Häppchen (max. 5 Wörter, bevorzugt nach Satzzeichen) aufteilen */
const haeppchenBilden = (woerter: Wort[]): Wort[][] => {
  const haeppchen: Wort[][] = [];
  let aktuell: Wort[] = [];
  woerter.forEach((w) => {
    aktuell.push(w);
    if (aktuell.length >= MAX_WOERTER || satzende(w.text)) {
      haeppchen.push(aktuell);
      aktuell = [];
    }
  });
  if (aktuell.length) haeppchen.push(aktuell);
  return haeppchen;
};

/** Gleichmäßig verteilte Zeiten (Frames ab Szenenbeginn) */
export const zerlege = (text: string, dauerFrames: number, offset = 0): Wort[][] => {
  const roh = zuWoertern(text);
  const gewichte = roh.map((w) => 1 + w.text.length * 0.14 + (satzende(w.text) ? 1.2 : 0));
  const summe = gewichte.reduce((a, b) => a + b, 0);
  const nutzbar = dauerFrames * 0.94;
  let t = 0;
  const woerter = roh.map((w, i) => {
    const wort = { ...w, start: offset + t };
    t += (gewichte[i] / summe) * nutzbar;
    return wort;
  });
  return haeppchenBilden(woerter);
};

/** Häppchen aus echten Wortzeiten (Frames ab Videobeginn) */
export const ausWortzeiten = (
  text: string,
  szene: number,
  wortzeiten: Wortzeit[],
  fps: number,
  versatz: number,
): Wort[][] | null => {
  const roh = zuWoertern(text);
  const zeiten = wortzeiten.filter((w) => w.szene === szene);
  if (zeiten.length < roh.length) return null;
  const woerter = roh.map((w, i) => {
    const z = zeiten.find((x) => x.index === i);
    return { ...w, start: Math.round(((z?.start ?? 0) + versatz) * fps) };
  });
  return haeppchenBilden(woerter);
};

/** Zeigt das passende Häppchen zum aktuellen Frame an */
export const UntertitelAnzeige: React.FC<{ haeppchen: Wort[][]; oben?: number; ausblendenNach?: number }> = ({
  haeppchen,
  oben = 250,
  ausblendenNach,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let idx = -1;
  haeppchen.forEach((h, i) => {
    if (frame >= h[0].start) idx = i;
  });
  if (idx < 0) return null;
  const sichtbar = haeppchen[idx];
  // nach langer Pause (z. B. am Ende) wieder ausblenden
  const letztes = sichtbar[sichtbar.length - 1].start;
  if (ausblendenNach !== undefined && idx === haeppchen.length - 1 && frame > letztes + ausblendenNach) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: oben,
        left: 0,
        right: 0,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0 30px",
        padding: "0 80px",
        fontFamily: "Montserrat Black",
        fontSize: 84,
        lineHeight: 1.18,
        textTransform: "uppercase",
        textAlign: "center",
      }}
    >
      {sichtbar.map((w, i) => {
        const lokal = frame - w.start;
        if (lokal < 0) return null;
        const pop = spring({ frame: lokal, fps, config: { damping: 11, mass: 0.35 } });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              color: w.betont ? "#FFC94A" : "white",
              transform: `scale(${interpolate(pop, [0, 1], [1.25, 1])})`,
              opacity: interpolate(pop, [0, 0.4], [0, 1], { extrapolateRight: "clamp" }),
              WebkitTextStroke: "12px #000",
              paintOrder: "stroke fill",
              textShadow: w.betont
                ? "0 0 30px rgba(255,180,40,0.8), 0 6px 0 rgba(0,0,0,0.6)"
                : "0 6px 0 rgba(0,0,0,0.6)",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

/** Untertitel innerhalb einer Szene (gleichmäßig verteilt) */
export const Untertitel: React.FC<{ text: string; dauerFrames: number; oben?: number }> = ({ text, dauerFrames, oben }) => (
  <UntertitelAnzeige haeppchen={zerlege(text, dauerFrames)} oben={oben} />
);
