import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const MAX_WOERTER = 5;

type Wort = { text: string; betont: boolean; start: number };

/** Text in Wörter + Zeitpunkte zerlegen. *Wort* = betont (gold). */
export const zerlege = (text: string, dauerFrames: number): Wort[][] => {
  const roh = text.split(/\s+/).filter(Boolean);
  const gewichte = roh.map((w) => 1 + w.replace(/\*/g, "").length * 0.14 + (/[^\d*][.,!?…:]\*?$/.test(w) ? 1.2 : 0));
  const summe = gewichte.reduce((a, b) => a + b, 0);
  const nutzbar = dauerFrames * 0.94;
  let t = 0;
  const woerter: Wort[] = roh.map((w, i) => {
    const wort = { text: w.replace(/\*/g, ""), betont: w.includes("*"), start: t };
    t += (gewichte[i] / summe) * nutzbar;
    return wort;
  });
  // In Häppchen aufteilen (max. 5 Wörter, bevorzugt nach Satzzeichen)
  const haeppchen: Wort[][] = [];
  let aktuell: Wort[] = [];
  woerter.forEach((w) => {
    aktuell.push(w);
    if (aktuell.length >= MAX_WOERTER || /[^\d][.,!?…:]$/.test(w.text) || w.text === "…") {
      haeppchen.push(aktuell);
      aktuell = [];
    }
  });
  if (aktuell.length) haeppchen.push(aktuell);
  return haeppchen;
};

export const Untertitel: React.FC<{ text: string; dauerFrames: number; oben?: number }> = ({
  text,
  dauerFrames,
  oben = 250,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const haeppchen = zerlege(text, dauerFrames);
  const idx = haeppchen.findIndex((h, i) => {
    const naechster = haeppchen[i + 1];
    return frame >= h[0].start && (!naechster || frame < naechster[0].start);
  });
  const sichtbar = haeppchen[Math.max(0, idx)];
  if (!sichtbar || frame < sichtbar[0].start) return null;

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
