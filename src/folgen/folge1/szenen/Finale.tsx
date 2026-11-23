import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { Buehne, Kamera, Partikel, W } from "../../../lib/effekte";
import { POSEN, Schatten, Tribut, weltPunkt } from "../../../lib/figur";
import { clamp, easeInOut, lerp, prog, rauschen } from "../../../lib/mathe";
import { Verbindung } from "../../../lib/verbindung";
import type { SzenenProps } from "../../../lib/folge";

// Szene 7: Tag neun – zwei Überlebende, ein Bildschirm, der keinen Sieger zeigen kann
const BODEN = 1620;

export const GlitchText: React.FC<{
  x: number;
  y: number;
  text: string;
  groesse: number;
  farbe: string;
  staerke: number; // 0..1
  f: number;
  seed: string;
}> = ({ x, y, text, groesse, farbe, staerke, f, seed }) => {
  const dx = rauschen(seed, f * 2.3) * 22 * staerke;
  const dy = rauschen(seed + "y", f * 2.1) * 6 * staerke;
  const schnitt = staerke > 0.3 && random(`${seed}-${f}`) > 0.6;
  const props = { textAnchor: "middle" as const, fontFamily: "Bebas Neue", fontSize: groesse, letterSpacing: 8 };
  return (
    <g>
      {staerke > 0.05 && (
        <>
          <text {...props} x={x - dx} y={y + dy} fill="#ff1744" opacity={0.8} style={{ mixBlendMode: "screen" }}>
            {text}
          </text>
          <text {...props} x={x + dx} y={y - dy} fill="#00e5ff" opacity={0.8} style={{ mixBlendMode: "screen" }}>
            {text}
          </text>
        </>
      )}
      <text {...props} x={x + (schnitt ? dx * 1.5 : 0)} y={y} fill={farbe}>
        {text}
      </text>
    </g>
  );
};

export const Finale: React.FC<SzenenProps> = ({ dauer }) => {
  const fEcht = useCurrentFrame();
  const freeze = Math.round(dauer * 0.92);
  const f = Math.min(fEcht, freeze); // am Ende friert das Bild ein
  const p = f / dauer;

  const tamX = 400;
  const liraX = 700;
  const sT = 1.2;
  const sL = 1.5;
  const tamPose = POSEN.kampfbereit(f);
  const liraPose = POSEN.kampfbereit(f + 20);
  const a = weltPunkt(tamX, BODEN, tamPose, sT, 1, "taille");
  const b = weltPunkt(liraX, BODEN, liraPose, sL, -1, "taille");
  const puls = 1.1 + 0.3 * Math.sin(f / 4) + prog(p, 0.5, 0.9) * 0.4;

  const zoom = lerp(1.12, 1.4, easeInOut(prog(p, 0, 1)));
  const kamY = lerp(1250, 1195, easeInOut(prog(p, 0, 1)));
  const rot = Math.sin(f / 70) * 0.8;

  // Bildschirm: "1 SIEGER" → "?" → "0 SIEGER"
  const g1 = Math.round(dauer * 0.62);
  const g2 = Math.round(dauer * 0.8);
  const anzeige = f < g1 ? "1 SIEGER" : f < g2 ? "? SIEGER" : "0 SIEGER";
  const stoerung = clamp(1 - Math.abs(f - g1) / 8) + clamp(1 - Math.abs(f - g2) / 10) + prog(p, 0.3, 0.6) * 0.15;
  const bildschirmFlackern = 0.85 + 0.15 * rauschen("bf", f * 1.3) - (random(`bfl${f}`) > 0.93 ? 0.4 : 0);
  const rot2 = f >= g2;

  const freezeT = clamp((fEcht - freeze) / 6);

  return (
    <AbsoluteFill>
      <Buehne hintergrund="#120203">
        <defs>
          <linearGradient id="finaleHimmel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d0102" />
            <stop offset="0.55" stopColor="#4a0a08" />
            <stop offset="0.85" stopColor="#a3260f" />
            <stop offset="1" stopColor="#e05a1c" />
          </linearGradient>
        </defs>
        <Kamera x={(tamX + liraX) / 2} y={kamY} zoom={zoom} rot={rot}>
          <rect x={-800} y={-200} width={2700} height={BODEN + 200} fill="url(#finaleHimmel)" />
          {/* Rauchschwaden */}
          {Array.from({ length: 6 }).map((_, i) => (
            <ellipse
              key={i}
              cx={((i * 260 + f * (0.6 + i * 0.15)) % 1800) - 400}
              cy={1250 + (i % 3) * 90}
              rx={300}
              ry={80}
              fill="#1a0505"
              opacity={0.5}
              filter="url(#weich)"
            />
          ))}

          {/* Ruinen-Säulen */}
          <g fill="#0a0203">
            <path d="M -40 1640 L -40 980 L 20 960 L 60 1000 L 70 1640 Z" />
            <path d="M 110 1640 L 110 1180 L 150 1150 L 190 1200 L 180 1640 Z" />
            <path d="M 930 1640 L 935 1050 L 980 1010 L 1000 1060 L 1040 1030 L 1045 1640 Z" />
            <path d="M 1090 1640 L 1090 1240 L 1140 1260 L 1150 1640 Z" />
            <rect x={-60} y={940} width={150} height={30} transform="rotate(-8 15 955)" />
            <rect x={900} y={990} width={170} height={30} transform="rotate(6 985 1005)" />
          </g>

          {/* Riesiger Bildschirm des Kapitols */}
          <g opacity={bildschirmFlackern} transform={`translate(${rauschen("bx", f) * 10 * stoerung} 0)`}>
            <rect x={150} y={880} width={800} height={300} rx={8} fill="#140204" stroke={rot2 ? "#ff2a1f" : "#ff8a6a"} strokeWidth={5} opacity={0.92} />
            {Array.from({ length: 30 }).map((_, i) => (
              <line key={i} x1={155} x2={945} y1={885 + i * 10} y2={885 + i * 10} stroke="#ff6a4a" strokeWidth={1} opacity={0.08} />
            ))}
            <rect x={150} y={880} width={800} height={300} rx={8} fill="#ff4a2a" opacity={0.06 + stoerung * 0.1} filter="url(#glowGross)" />
            <text x={550} y={940} textAnchor="middle" fontFamily="Bebas Neue" fontSize={40} letterSpacing={10} fill="#ff9a7a" opacity={0.8}>
              DIE 100. QUARTER QUELL · TAG 9
            </text>
            <GlitchText x={550} y={1120} text={anzeige} groesse={170} farbe={rot2 ? "#ff3b2f" : "#fff1e6"} staerke={clamp(stoerung)} f={f} seed="sieger" />
          </g>

          {/* Glühende Risse im Boden */}
          <rect x={-800} y={BODEN - 4} width={2700} height={800} fill="#070102" />
          <g stroke="#ff5a1f" strokeWidth={3} fill="none" filter="url(#glow)" opacity={0.7}>
            <path d="M -100 1700 L 120 1680 L 200 1720 L 380 1700" />
            <path d="M 700 1690 L 860 1730 L 1000 1700 L 1200 1740" />
          </g>
          {/* Lichtschein der Verbindung auf dem Boden */}
          <ellipse cx={(tamX + liraX) / 2} cy={BODEN + 10} rx={260} ry={30} fill="#59F3FF" opacity={0.25 * puls} filter="url(#glowGross)" />

          <Schatten x={tamX} y={BODEN} s={sT} />
          <Schatten x={liraX} y={BODEN} s={sL} />
          <Tribut x={tamX} y={BODEN} s={sT} pose={tamPose} frisur="stachel" frame={f} rand="#ff6a3a" randBreite={4} />
          <Tribut x={liraX} y={BODEN} s={sL} pose={liraPose} richtung={-1} frisur="zopf" frame={f} rand="#ff6a3a" randBreite={4} />
          <Verbindung a={a} b={b} maxLaenge={420} frame={f} helligkeit={puls} dicke={1.3} seed="finale" />
          {/* Knistern entlang der Linie */}
          <g filter="url(#glow)">
            {Array.from({ length: 8 }).map((_, i) => {
              const t = random(`kn${i}-${Math.floor(f / 3)}`);
              return (
                <circle key={i} cx={lerp(a.x, b.x, t)} cy={lerp(a.y, b.y, t) + 40 * Math.sin(t * Math.PI) + (random(`kny${i}-${f}`) - 0.5) * 30} r={2 + random(`knr${i}`) * 3} fill="white" opacity={0.8} />
              );
            })}
          </g>
          <Partikel anzahl={45} seed="finaleglut" farbe="#ff8a3d" tempo={2} groesse={[1.5, 4]} bereich={{ x: -300, y: 700, w: 1700, h: 1100 }} />
        </Kamera>
      </Buehne>
      {/* Einfrieren: Rot-Färbung + kurzer Blitz */}
      <AbsoluteFill style={{ background: "#ff0a0a", mixBlendMode: "color", opacity: freezeT * 0.75 }} />
      <AbsoluteFill style={{ background: "white", opacity: fEcht >= freeze && fEcht < freeze + 5 ? 0.6 * (1 - (fEcht - freeze) / 5) : 0 }} />
    </AbsoluteFill>
  );
};
