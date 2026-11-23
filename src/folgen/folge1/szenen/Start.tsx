import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Blitz, Buehne, H, Kamera, Partikel, W } from "../../../lib/effekte";
import { POSEN, Schatten, Tribut, mischePose, weltPunkt, Pose } from "../../../lib/figur";
import { clamp, easeIn, easeInOut, easeOut, lerp, prog, wackler } from "../../../lib/mathe";
import { Verbindung } from "../../../lib/verbindung";
import type { SzenenProps } from "../../../lib/folge";

// Szene 5: Tag eins – Lira rennt los, Tam stolpert, die Verbindung reißt sie zurück
const BODEN = 1560;
const MAX = 560;

export const Start: React.FC<SzenenProps> = ({ dauer }) => {
  const f = useCurrentFrame();
  const p = f / dauer;
  const gong = Math.round(dauer * 0.22);
  const ruck = Math.round(dauer * 0.5);
  const lauf = f * 0.5;

  // ---------- Tam ----------
  let tamX = 330;
  let tamPose: Pose = POSEN.stehen(f);
  if (p >= 0.22 && p < 0.3) {
    tamX = lerp(330, 420, prog(p, 0.22, 0.3));
    tamPose = POSEN.rennen(lauf);
  } else if (p >= 0.3 && p < 0.36) {
    tamX = 420 + easeOut(prog(p, 0.3, 0.36)) * 25;
    tamPose = mischePose(POSEN.rennen(lauf), POSEN.stolpern(), easeOut(prog(p, 0.3, 0.36)));
  } else if (p >= 0.36 && p < 0.85) {
    tamX = 445;
    tamPose = mischePose(POSEN.stolpern(), POSEN.knien(), easeOut(prog(p, 0.36, 0.42)));
  } else if (p >= 0.85) {
    tamX = 445;
    tamPose = mischePose(POSEN.knien(), POSEN.stehen(f), easeInOut(prog(p, 0.86, 0.95)));
  }

  // ---------- Lira ----------
  let liraX = 520;
  let liraPose: Pose = POSEN.kampfbereit(f);
  let liraRichtung: 1 | -1 = 1;
  const ziel = 445 + MAX * 0.97;
  if (p >= 0.22 && p < 0.5) {
    liraX = lerp(520, ziel, easeIn(prog(p, 0.22, 0.27)) * 0.1 + prog(p, 0.22, 0.5) * 0.9);
    liraPose = POSEN.rennen(lauf + 1);
  } else if (p >= 0.5 && p < 0.59) {
    liraX = ziel - easeOut(prog(p, 0.5, 0.55)) * 30;
    liraPose = mischePose(POSEN.zurueckgerissen(), POSEN.stehen(f), easeInOut(prog(p, 0.54, 0.59)));
  } else if (p >= 0.59 && p < 0.62) {
    liraX = ziel - 30;
    liraRichtung = -1;
    liraPose = POSEN.stehen(f);
  } else if (p >= 0.62 && p < 0.8) {
    liraX = lerp(ziel - 30, 610, easeInOut(prog(p, 0.62, 0.8)));
    liraRichtung = -1;
    liraPose = POSEN.rennen(lauf);
  } else if (p >= 0.8) {
    liraX = 610;
    liraRichtung = -1;
    liraPose = mischePose(POSEN.stehen(f), POSEN.ziehen(), easeOut(prog(p, 0.8, 0.86)));
  }

  const sL = 1.55;
  const sT = 1.15;
  const a = weltPunkt(tamX, BODEN, tamPose, sT, 1, "taille");
  const b = weltPunkt(liraX, BODEN, liraPose, sL, liraRichtung, "taille");
  const spannung = clamp((Math.hypot(b.x - a.x, b.y - a.y) / MAX - 0.9) / 0.1);

  // ---------- Kamera ----------
  const mitte = (tamX + liraX) / 2;
  const punch = easeOut(prog(p, 0.47, 0.5)) * (1 - easeInOut(prog(p, 0.56, 0.66)));
  const zoom = 1.32 + punch * 0.2 + easeInOut(prog(p, 0.8, 1)) * 0.15;
  const kamX = lerp(470, Math.max(470, mitte + 50), easeInOut(prog(p, 0.2, 0.4)));
  const kamY = 1330 + punch * 40;
  const w = wackler(f, ruck, 30, 9);
  const wG = wackler(f, gong, 14, 12);
  const versatz = (faktor: number) => (kamX - W / 2) * (1 - faktor);

  // ---------- Countdown ----------
  const zahl = p < 0.22 ? 3 - Math.floor(prog(p, 0.04, 0.22) * 3) : 0;
  const zahlLokal = (prog(p, 0.04, 0.22) * 3) % 1;

  // Andere Tribute im Hintergrund
  const andere = Array.from({ length: 9 }).map((_, i) => {
    const sx = -200 + i * 190;
    const los = 0.22 + (i % 3) * 0.015;
    const lp = prog(p, los, 1);
    return { x: sx + lp * (1500 - sx) * 0.9, rennt: p > los, i };
  });

  return (
    <AbsoluteFill>
      <Buehne hintergrund="#100811">
        <defs>
          <linearGradient id="himmelStart" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#140b26" />
            <stop offset="0.45" stopColor="#5a1f3e" />
            <stop offset="0.78" stopColor="#d9562f" />
            <stop offset="1" stopColor="#ffb057" />
          </linearGradient>
          <linearGradient id="bodenStart" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1b0d10" />
            <stop offset="1" stopColor="#050304" />
          </linearGradient>
        </defs>
        <Kamera x={kamX} y={kamY} zoom={zoom} wackler={{ x: w.x + wG.x, y: w.y + wG.y, r: w.r + wG.r }}>
          {/* Himmel + Sonne (weit weg, bewegt sich kaum) */}
          <g transform={`translate(${versatz(0.05)} 0)`}>
            <rect x={-1200} y={-400} width={3600} height={BODEN - 80 + 400} fill="url(#himmelStart)" />
            <circle cx={820} cy={1330} r={330} fill="#ffb057" opacity={0.5} filter="url(#weich)" />
            <circle cx={820} cy={1345} r={150} fill="#ffe2a8" />
          </g>
          {/* Berge */}
          <g transform={`translate(${versatz(0.25)} 0)`}>
            <path d="M -1000 1480 L -700 1250 L -480 1380 L -200 1180 L 120 1400 L 380 1230 L 700 1420 L 950 1260 L 1300 1440 L 1600 1220 L 2000 1400 L 2400 1300 L 2400 1600 L -1000 1600 Z" fill="#3a1830" opacity={0.85} />
          </g>
          <g transform={`translate(${versatz(0.5)} 0)`}>
            <path d="M -1000 1520 Q -600 1400 -200 1500 T 600 1480 T 1400 1500 T 2400 1470 L 2400 1620 L -1000 1620 Z" fill="#240f1d" />
          </g>

          {/* Boden */}
          <rect x={-1200} y={BODEN - 90} width={3600} height={900} fill="url(#bodenStart)" />

          {/* Füllhorn */}
          <g transform="translate(1150 0) scale(1.15) translate(0 -203)">
            <ellipse cx={60} cy={BODEN - 70} rx={260} ry={30} fill="black" opacity={0.6} filter="url(#unschaerfe)" />
            <path d="M -60 1330 C 80 1310 220 1280 330 1190 C 300 1330 200 1480 -60 1500 Z" fill="#0b0608" stroke="#ff9a4a" strokeWidth={4} opacity={0.98} />
            <ellipse cx={-60} cy={1415} rx={48} ry={86} fill="#1c0e09" stroke="#ff9a4a" strokeWidth={4} />
            {[-160, -110, -200, -70].map((x, i) => (
              <rect key={i} x={x} y={BODEN - 120 - (i % 2) * 30} width={50} height={40 + (i % 2) * 30} fill="#0b0608" stroke="#ff9a4a" strokeWidth={2} opacity={0.9} />
            ))}
          </g>

          {/* Andere Tribute (Hintergrund) */}
          {andere.map(({ x, rennt, i }) => (
            <g key={i} opacity={0.75}>
              <ellipse cx={-200 + i * 190} cy={BODEN - 88} rx={36} ry={7} fill="#7a7f8c" opacity={0.6} />
              <Tribut x={x} y={BODEN - 90} s={0.55} pose={rennt ? POSEN.rennen(lauf + i) : POSEN.kampfbereit(f + i * 9)} farbe="#160a10" frisur={i % 2 ? "kurz" : "zopf"} frame={f + i * 5} />
            </g>
          ))}

          {/* Plattformen */}
          <ellipse cx={330} cy={BODEN + 6} rx={78} ry={14} fill="#8a8f9c" opacity={0.8} />
          <ellipse cx={520} cy={BODEN + 6} rx={78} ry={14} fill="#8a8f9c" opacity={0.8} />

          {/* Staub beim Stolpern */}
          {p > 0.3 && p < 0.5 &&
            Array.from({ length: 8 }).map((_, i) => {
              const t = prog(p, 0.31, 0.5);
              return <circle key={i} cx={430 + (i - 4) * 18 * (1 + t * 3)} cy={BODEN - 10 - t * 40 * (i % 3)} r={10 + t * 30} fill="#5a3a3a" opacity={(1 - t) * 0.35} />;
            })}

          <Schatten x={tamX} y={BODEN} s={sT} />
          <Schatten x={liraX} y={BODEN} s={sL} />
          <Tribut x={tamX} y={BODEN} s={sT} pose={tamPose} frisur="stachel" frame={f} rand="#ff9a4a" randBreite={4} />
          <Verbindung a={a} b={b} maxLaenge={MAX} frame={f} helligkeit={clamp(prog(p, 0.0, 0.08)) * (0.9 + spannung * 0.5)} dicke={1 + spannung * 0.5} seed="start" />
          <Tribut x={liraX} y={BODEN} s={sL} pose={liraPose} richtung={liraRichtung} frisur="zopf" frame={f} rand="#ff9a4a" randBreite={4} />

          {/* Namen */}
          <g opacity={clamp(prog(p, 0.05, 0.1)) * (1 - clamp(prog(p, 0.3, 0.35)))} fontFamily="Bebas Neue" fontSize={44} letterSpacing={6} textAnchor="middle">
            <text x={tamX} y={BODEN - 250} fill="#FFC94A">TAM · 12</text>
            <text x={liraX} y={BODEN - 370} fill="#FFC94A">LIRA · 17</text>
          </g>

          {/* Gong-Druckwelle */}
          {f >= gong && f < gong + 30 && (
            <circle cx={kamX} cy={1350} r={(f - gong) * 50} fill="none" stroke="#ffe2a8" strokeWidth={14 * (1 - (f - gong) / 30)} opacity={1 - (f - gong) / 30} />
          )}
          <Partikel anzahl={30} seed="startglut" farbe="#ffb057" tempo={0.8} groesse={[1.5, 3]} bereich={{ x: -400, y: 900, w: 2400, h: 800 }} />
        </Kamera>

        {/* Countdown */}
        {zahl > 0 && (
          <text
            x={W / 2}
            y={760}
            textAnchor="middle"
            fontFamily="Bebas Neue"
            fontSize={300}
            fill="white"
            opacity={1 - zahlLokal * 0.8}
            transform={`translate(${W / 2} 660) scale(${1.4 - easeOut(Math.min(1, zahlLokal * 3)) * 0.4}) translate(${-W / 2} -660)`}
            filter="url(#glow)"
          >
            {zahl}
          </text>
        )}
      </Buehne>
      <Blitz start={gong} dauer={10} farbe="#FFE2A8" staerke={0.7} />
      {/* rote Warnung, wenn die Linie gespannt ist */}
      <AbsoluteFill style={{ boxShadow: `inset 0 0 ${160 * spannung}px rgba(255,40,20,${0.7 * spannung})` }} />
    </AbsoluteFill>
  );
};
