import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { Buehne, Kamera, Partikel, W } from "../../../lib/effekte";
import { POSEN, Schatten, Tribut, mischePose, weltPunkt, Pose } from "../../../lib/figur";
import { clamp, easeIn, easeInOut, easeOut, lerp, prog, wackler } from "../../../lib/mathe";
import { Verbindung } from "../../../lib/verbindung";
import type { SzenenProps } from "../../../lib/folge";

// Szene 6: Nacht im Wald – Augen, Fadenkreuz, Pfeil in Zeitlupe
const BODEN = 1600;
const BAUM_X = 250;

const Kiefer: React.FC<{ x: number; y: number; h: number; b: number; farbe: string }> = ({ x, y, h, b, farbe }) => {
  const stufen = 5;
  return (
    <g fill={farbe}>
      <rect x={x - b * 0.06} y={y - h * 0.25} width={b * 0.12} height={h * 0.25} />
      {Array.from({ length: stufen }).map((_, i) => {
        const t = i / stufen;
        const breite = b * (1 - t * 0.75);
        const unten = y - h * 0.15 - t * h * 0.75;
        return <path key={i} d={`M ${x - breite / 2} ${unten} L ${x} ${unten - h * 0.32} L ${x + breite / 2} ${unten} Z`} />;
      })}
    </g>
  );
};

const Wald: React.FC<{ seed: string; anzahl: number; y: number; h: [number, number]; farbe: string; von: number; bis: number }> = ({ seed, anzahl, y, h, farbe, von, bis }) => (
  <g>
    {Array.from({ length: anzahl }).map((_, i) => {
      const x = von + (i / anzahl) * (bis - von) + random(`${seed}x${i}`) * 80;
      const hh = h[0] + random(`${seed}h${i}`) * (h[1] - h[0]);
      return <Kiefer key={i} x={x} y={y} h={hh} b={hh * 0.42} farbe={farbe} />;
    })}
  </g>
);

export const Jagd: React.FC<SzenenProps> = ({ dauer }) => {
  const f = useCurrentFrame();
  const p = f / dauer;
  const schuss = Math.round(dauer * 0.62);
  const treffer = Math.round(dauer * 0.82);
  const schritt = f * 0.22;
  const sL = 1.45;
  const sT = 1.1;

  // ---------- Bewegung ----------
  const lauf = easeInOut(prog(p, 0, 0.45));
  let tamX = lerp(330, 500, lauf);
  let liraX = lerp(540, 710, lauf);
  let tamPose: Pose = p < 0.45 ? POSEN.schleichen(schritt) : POSEN.kampfbereit(f);
  let liraPose: Pose = p < 0.45 ? POSEN.schleichen(schritt + 1.5) : POSEN.kampfbereit(f + 10);
  let liraRichtung: 1 | -1 = 1;

  const zieh = easeOut(prog(p, 0.68, 0.74));
  if (p >= 0.66) {
    liraRichtung = -1;
    liraX = lerp(710, 740, zieh);
    liraPose = mischePose(POSEN.kampfbereit(f), POSEN.ziehen(), easeOut(prog(p, 0.66, 0.7)));
    tamX = lerp(500, 590, zieh);
    tamPose = mischePose(POSEN.kampfbereit(f), POSEN.knien(), zieh);
  }
  if (p >= 0.86) {
    liraPose = mischePose(POSEN.ziehen(), POSEN.kampfbereit(f), easeOut(prog(p, 0.86, 0.95)));
  }

  const a = weltPunkt(tamX, BODEN, tamPose, sT, 1, "taille");
  const b = weltPunkt(liraX, BODEN, liraPose, sL, liraRichtung, "taille");

  // ---------- Pfeil (mit Zeitlupe) – kommt schräg von oben links ----------
  const S = { x: -260, y: 960 };
  const E = { x: 470, y: BODEN - 12 };
  let u = 0;
  if (p >= 0.62) {
    if (p < 0.66) u = lerp(0, 0.45, prog(p, 0.62, 0.66));
    else if (p < 0.79) u = lerp(0.45, 0.85, prog(p, 0.66, 0.79));
    else u = lerp(0.85, 1, easeIn(prog(p, 0.79, 0.82)));
  }
  const pfeilX = lerp(S.x, E.x, u);
  const pfeilY = lerp(S.y, E.y, u);
  const pfeilWinkel = (Math.atan2(E.y - S.y, E.x - S.x) * 180) / Math.PI + 180;
  const steckt = f >= treffer;
  const zeitlupe = clamp(prog(p, 0.64, 0.67)) * (1 - clamp(prog(p, 0.78, 0.8)));
  const pfeilZittern = steckt ? Math.sin((f - treffer) * 1.6) * 6 * Math.exp(-(f - treffer) / 10) : 0;

  // ---------- Fadenkreuz ----------
  const kopfL = weltPunkt(liraX, BODEN, liraPose, sL, liraRichtung, "schulter");
  const kopfT = weltPunkt(tamX, BODEN, tamPose, sT, 1, "schulter");
  const wechsel = easeInOut(prog(p, 0.45, 0.55));
  const kreuzX = lerp(kopfL.x, kopfT.x, wechsel);
  const kreuzY = lerp(kopfL.y, kopfT.y, wechsel);
  const kreuzAn = clamp(prog(p, 0.33, 0.37)) * (1 - clamp(prog(p, 0.63, 0.66)));
  const lock = easeOut(prog(p, 0.55, 0.6));
  const kreuzR = lerp(90, 55, lock) + Math.sin(f / 3) * 4 * (1 - lock);

  // ---------- Kamera ----------
  const mitte = (tamX + liraX) / 2;
  const zoom = 1.28 + zeitlupe * 0.12 + easeInOut(prog(p, 0.4, 0.6)) * 0.08;
  const kamX = lerp(mitte + 30, Math.max(300, (pfeilX + tamX + 60) / 2), zeitlupe);
  const kamY = lerp(1360, (pfeilY + 1520) / 2, zeitlupe);
  const w = wackler(f, treffer, 36, 9);
  const versatz = (faktor: number) => (kamX - W / 2) * (1 - faktor);

  // Augen im Wald
  const augen = Array.from({ length: 7 }).map((_, i) => ({
    x: 300 + i * 210 + random(`aug${i}`) * 80,
    y: 1360 + random(`augy${i}`) * 130,
    an: clamp(prog(p, 0.1 + i * 0.04, 0.14 + i * 0.04)),
    blink: (f + i * 17) % 70 < 4 ? 0.1 : 1,
  }));

  return (
    <AbsoluteFill>
      <Buehne hintergrund="#03050b">
        <defs>
          <linearGradient id="nacht" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#02040a" />
            <stop offset="0.6" stopColor="#0b1830" />
            <stop offset="1" stopColor="#163052" />
          </linearGradient>
        </defs>
        <Kamera x={kamX} y={kamY} zoom={zoom} wackler={w}>
          <g transform={`translate(${versatz(0.05)} 0)`}>
            <rect x={-1500} y={-400} width={4000} height={2600} fill="url(#nacht)" />
            <circle cx={720} cy={1020} r={240} fill="#9fc3ff" opacity={0.25} filter="url(#weich)" />
            <circle cx={720} cy={1020} r={95} fill="#e9f1ff" />
            <circle cx={690} cy={1000} r={16} fill="#c9d6ee" />
            <circle cx={748} cy={1050} r={10} fill="#c9d6ee" />
          </g>
          <g transform={`translate(${versatz(0.25)} 0)`}>
            <Wald seed="fern" anzahl={16} y={1480} h={[260, 420]} farbe="#0f2340" von={-500} bis={1900} />
          </g>
          {/* Nebel */}
          <g transform={`translate(${versatz(0.4) + Math.sin(f / 60) * 40} 0)`} opacity={0.35}>
            <ellipse cx={500} cy={1480} rx={900} ry={70} fill="#8fb4e0" filter="url(#weich)" />
          </g>
          <g transform={`translate(${versatz(0.55)} 0)`}>
            <Wald seed="mitte" anzahl={12} y={1530} h={[380, 560]} farbe="#081325" von={-400} bis={1800} />
            {augen.map((e, i) => (
              <g key={i} opacity={e.an * (p < 0.66 ? 1 : 1 - clamp(prog(p, 0.66, 0.7)) * 0.6)} filter="url(#glow)">
                <ellipse cx={e.x - 14} cy={e.y} rx={8} ry={5 * e.blink} fill="#ffcf4a" />
                <ellipse cx={e.x + 14} cy={e.y} rx={8} ry={5 * e.blink} fill="#ffcf4a" />
              </g>
            ))}
          </g>

          {/* Boden */}
          <rect x={-1500} y={BODEN - 20} width={4000} height={900} fill="#03060d" />
          <Partikel anzahl={26} seed="gluehw" farbe="#d9ff8a" tempo={0.25} groesse={[2, 4]} drift={50} bereich={{ x: -200, y: 1100, w: 1600, h: 500 }} flackern />

          {/* Baum, in den der Pfeil einschlägt */}
          <rect x={BAUM_X - 28} y={BODEN - 700} width={56} height={700} fill="#02040a" />
          <Kiefer x={BAUM_X} y={BODEN - 380} h={600} b={330} farbe="#02040a" />

          {/* Tribute */}
          <Schatten x={tamX} y={BODEN} s={sT} />
          <Schatten x={liraX} y={BODEN} s={sL} />
          <Tribut x={tamX} y={BODEN} s={sT} pose={tamPose} frisur="stachel" frame={f} rand="#5f8fd6" randBreite={4} />
          <Verbindung a={a} b={b} maxLaenge={330} frame={f} helligkeit={0.75 + zeitlupe * 0.5} seed="jagd" />
          <Tribut x={liraX} y={BODEN} s={sL} pose={liraPose} richtung={liraRichtung} frisur="zopf" frame={f} rand="#5f8fd6" randBreite={4} />

          {/* Pfeil */}
          {p >= 0.62 && (
            <g transform={`translate(${pfeilX} ${pfeilY}) rotate(${pfeilWinkel + pfeilZittern}) scale(1.6) translate(${steckt ? 14 : 0} 0)`}>
              {!steckt && (
                <path d={`M 0 0 L ${260 + zeitlupe * 200} -6 L ${260 + zeitlupe * 200} 6 Z`} fill="#cfe3ff" opacity={0.35 + zeitlupe * 0.3} filter="url(#unschaerfe)" />
              )}
              <line x1={0} y1={0} x2={150} y2={0} stroke="#1a120c" strokeWidth={7} />
              <line x1={0} y1={0} x2={150} y2={0} stroke="#c9a46a" strokeWidth={2} opacity={0.6} />
              <path d="M -6 0 L 22 -12 L 22 12 Z" fill="#d7dde6" />
              <path d="M 120 0 L 158 -18 L 150 0 L 158 18 Z" fill="#b8322a" />
            </g>
          )}
          {/* Erde spritzt beim Einschlag */}
          {steckt &&
            f < treffer + 25 &&
            Array.from({ length: 14 }).map((_, i) => {
              const t = (f - treffer) / 25;
              const wnk = -Math.PI / 2 + (random(`spl${i}`) - 0.5) * 2.4;
              const v = 60 + random(`splv${i}`) * 170;
              return <circle key={i} cx={E.x + Math.cos(wnk) * v * t} cy={E.y + Math.sin(wnk) * v * t + 260 * t * t} r={4 + random(`splr${i}`) * 5} fill="#2a2a38" opacity={1 - t} />;
            })}
          {steckt && f < treffer + 20 && (
            <circle cx={E.x} cy={E.y} r={(f - treffer) * 9} fill="none" stroke="#cfe3ff" strokeWidth={6 * (1 - (f - treffer) / 20)} opacity={1 - (f - treffer) / 20} />
          )}
          {/* Fadenkreuz */}
          {kreuzAn > 0 && (
            <g transform={`translate(${kreuzX} ${kreuzY}) rotate(${f * 1.2 * (1 - lock)})`} opacity={kreuzAn} filter="url(#glow)">
              <circle r={kreuzR} fill="none" stroke="#ff2a1f" strokeWidth={5} />
              <circle r={kreuzR * 0.25} fill="none" stroke="#ff2a1f" strokeWidth={3} opacity={lock} />
              {[0, 90, 180, 270].map((r) => (
                <line key={r} x1={kreuzR * 0.55} x2={kreuzR * 1.35} y1={0} y2={0} stroke="#ff2a1f" strokeWidth={5} transform={`rotate(${r})`} />
              ))}
            </g>
          )}

          {/* Vordergrund-Bäume (bewegen sich schneller = Tiefe) */}
          <g transform={`translate(${versatz(1.35)} 0)`}>
            <rect x={-80} y={600} width={110} height={1400} fill="#000" />
            <rect x={1130} y={500} width={140} height={1500} fill="#000" />
            <path d="M -200 1700 Q 100 1600 300 1720 L 300 2000 L -200 2000 Z" fill="#000" />
          </g>
        </Kamera>
      </Buehne>
      {/* Zeitlupen-Look: kühler + Rand dunkler */}
      <AbsoluteFill style={{ background: "#1c4a8a", opacity: zeitlupe * 0.18, mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ boxShadow: `inset 0 0 ${220 * zeitlupe}px rgba(0,0,0,${0.9 * zeitlupe})` }} />
      <AbsoluteFill style={{ background: "#ff1a0a", opacity: lock * kreuzAn * (0.08 + 0.06 * Math.sin(f / 2)), mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};
