import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Blitz, Buehne, H, Kamera, Partikel, W } from "../../../lib/effekte";
import { POSEN, Schatten, Tribut, mischePose, weltPunkt } from "../../../lib/figur";
import { clamp, easeInOut, easeOut, lerp, prog, summeWackler, wackler } from "../../../lib/mathe";
import { Verbindung } from "../../../lib/verbindung";
import type { SzenenProps } from "../../../lib/folge";

// Szene 4: 12 Distrikte, je zwei Tribute verbunden. Einer fällt – der Partner auch.
const OPFER = 5; // Index des Paares, das fällt (Distrikt 6)

export const Regel: React.FC<SzenenProps> = ({ dauer }) => {
  const f = useCurrentFrame();
  const p = f / dauer;
  const kanone1 = Math.round(dauer * 0.6);
  const kanone2 = Math.round(dauer * 0.7);

  const s = 0.95;
  const paare = Array.from({ length: 12 }).map((_, i) => {
    const spalte = i % 3;
    const reihe = Math.floor(i / 3);
    return { x: 200 + spalte * 340, y: 1000 + reihe * 270, i };
  });
  const opfer = paare[OPFER];

  const zoom = 1 + easeInOut(prog(p, 0.5, 0.75)) * 0.55 - easeInOut(prog(p, 0.85, 1)) * 0.15;
  const fokusX = lerp(W / 2, opfer.x, easeInOut(prog(p, 0.5, 0.75)));
  const fokusY = lerp(1200, opfer.y - 90, easeInOut(prog(p, 0.5, 0.75)));
  const w = summeWackler(wackler(f, kanone1, 34, 10), wackler(f, kanone2, 34, 10));

  const rotPuls = clamp(1 - (f - kanone1) / 25) * (f >= kanone1 ? 1 : 0) + clamp(1 - (f - kanone2) / 25) * (f >= kanone2 ? 1 : 0);

  return (
    <AbsoluteFill>
      <Buehne hintergrund="linear-gradient(180deg, #05070d 0%, #0d1424 55%, #1a1420 100%)">
        <rect width={W} height={H} fill="transparent" />
        <Kamera zoom={zoom} x={fokusX} y={fokusY} wackler={w}>
          {/* Boden-Raster wie eine Trainingshalle */}
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={i} x1={0} x2={W} y1={620 + i * 150} y2={620 + i * 150} stroke="#59F3FF" strokeWidth={1.5} opacity={0.06} />
          ))}
          <Partikel anzahl={30} seed="regelstaub" farbe="#9fdfff" tempo={0.5} groesse={[1, 2.5]} />

          {paare.map(({ x, y, i }) => {
            const an = easeOut(prog(p, 0.04 + i * 0.028, 0.1 + i * 0.028));
            const istOpfer = i === OPFER;
            const fallA = istOpfer ? easeOut(prog(f, kanone1, kanone1 + 12)) : 0;
            const fallB = istOpfer ? easeOut(prog(f, kanone2, kanone2 + 12)) : 0;
            const riss = istOpfer ? clamp(prog(f, kanone1 + 2, kanone1 + 16)) : 0;
            const poseA = mischePose(POSEN.stehen(f + i * 11), POSEN.zurueckgerissen(), fallA);
            const poseB = mischePose(POSEN.stehen(f + i * 7 + 30), POSEN.zurueckgerissen(), fallB);
            const ax = x - 72;
            const bx = x + 72;
            const a = weltPunkt(ax, y, poseA, s, 1, "taille", -82 * fallA);
            const b = weltPunkt(bx, y, poseB, s * 0.92, -1, "taille", -82 * fallB);
            const randFarbe = istOpfer && f >= kanone1 ? "#ff3b2f" : "#3b6f8a";
            return (
              <g key={i} opacity={clamp(an * 1.5)}>
                <Schatten x={ax} y={y} s={s} />
                <Schatten x={bx} y={y} s={s} />
                <Verbindung a={a} b={b} maxLaenge={215} frame={f} helligkeit={an * (1 - riss)} riss={riss} seed={`r${i}`} dicke={0.8} />
                <Tribut x={ax} y={y} s={s} pose={poseA} richtung={1} frisur={i % 2 ? "kurz" : "zopf"} frame={f + i * 5} rand={randFarbe} randBreite={4} deckkraft={1 - fallA * 0.45} kippen={-82 * fallA} />
                <Tribut x={bx} y={y} s={s * 0.92} pose={poseB} richtung={-1} frisur={i % 3 === 0 ? "stachel" : "kurz"} frame={f} rand={randFarbe} randBreite={4} deckkraft={1 - fallB * 0.45} kippen={-82 * fallB} />
                <text x={x} y={y + 52} textAnchor="middle" fontFamily="Bebas Neue" fontSize={34} letterSpacing={4} fill={istOpfer && f >= kanone1 ? "#ff5a4a" : "#7fa9c0"}>
                  DISTRIKT {i + 1}
                </text>
              </g>
            );
          })}
        </Kamera>
      </Buehne>
      <AbsoluteFill style={{ background: "#ff1a0a", opacity: rotPuls * 0.28, mixBlendMode: "screen" }} />
      <Blitz start={kanone1} dauer={7} staerke={0.8} />
      <Blitz start={kanone2} dauer={7} staerke={0.8} />
    </AbsoluteFill>
  );
};
