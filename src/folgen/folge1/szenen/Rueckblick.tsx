import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Buehne, H, Kamera, Partikel, W } from "../../../lib/effekte";
import { Tribut, POSEN, mischePose, Schatten } from "../../../lib/figur";
import { clamp, easeBack, easeOut, prog, wackler } from "../../../lib/mathe";
import type { SzenenProps } from "../../../lib/folge";

// Szene 2: Drei Karten im Schnellschnitt – 25., 50., 75.
const Karte: React.FC<{ f: number; dauer: number; nummer: string; titel: string; farbe: string; children: React.ReactNode }> = ({
  f,
  dauer,
  nummer,
  titel,
  farbe,
  children,
}) => {
  const rein = easeOut(prog(f, 0, 7));
  const x = (1 - rein) * 900;
  const w = wackler(f, 5, 28, 8);
  const zoom = 1.04 + (f / dauer) * 0.08;
  const zahl = easeBack(prog(f, 3, 12));
  return (
    <Kamera zoom={zoom} wackler={w} x={W / 2 - x * 0.2} y={1050}>
      <g transform={`translate(${x} 0) skewX(${(1 - rein) * -12})`}>
        <rect x={60} y={660} width={W - 120} height={1020} rx={28} fill="#0d0a10" stroke={farbe} strokeWidth={5} opacity={0.94} />
        <rect x={60} y={660} width={W - 120} height={1020} rx={28} fill={farbe} opacity={0.08} />
        <text
          x={W / 2}
          y={960}
          textAnchor="middle"
          fontFamily="Bebas Neue"
          fontSize={330}
          fill={farbe}
          transform={`translate(${W / 2} 870) scale(${zahl}) translate(${-W / 2} -800)`}
          filter="url(#glow)"
        >
          {nummer}
        </text>
        <text x={W / 2} y={1060} textAnchor="middle" fontFamily="Bebas Neue" fontSize={70} letterSpacing={10} fill="white" opacity={clamp(prog(f, 8, 16))}>
          {titel}
        </text>
        <line x1={160} x2={W - 160} y1={1520} y2={1520} stroke={farbe} strokeWidth={3} opacity={0.5} />
        {children}
      </g>
    </Kamera>
  );
};

export const Rueckblick: React.FC<SzenenProps> = ({ dauer }) => {
  const f = useCurrentFrame();
  const teil = dauer / 3;
  const karte = Math.min(2, Math.floor(f / teil));
  const lf = f - karte * teil;

  let inhalt: React.ReactNode = null;
  if (karte === 0) {
    // 25.: Die Distrikte stimmen ab – Hände gehen hoch
    inhalt = (
      <Karte f={lf} dauer={teil} nummer="25." titel="DIE DISTRIKTE WÄHLTEN" farbe="#7FD1FF">
        {Array.from({ length: 7 }).map((_, i) => {
          const x = 200 + i * 113;
          const hoch = easeOut(prog(lf, 10 + i * 3, 18 + i * 3));
          return (
            <g key={i}>
              <Schatten x={x} y={1520} s={0.9} />
              <Tribut x={x} y={1520} s={1.25} pose={mischePose(POSEN.stehen(lf + i * 9), POSEN.armHoch(lf), hoch)} frisur={i % 3 === 0 ? "zopf" : i % 3 === 1 ? "kurz" : "stachel"} frame={lf + i * 7} farbe="#05070a" rand="#7FD1FF" />
            </g>
          );
        })}
      </Karte>
    );
  } else if (karte === 1) {
    // 50.: Tribute verdoppeln sich
    const verdopplung = easeOut(prog(lf, 12, 30));
    inhalt = (
      <Karte f={lf} dauer={teil} nummer="50." titel="DOPPELT SO VIELE TRIBUTE" farbe="#FF8A3D">
        {Array.from({ length: 24 }).map((_, i) => {
          const reihe = Math.floor(i / 12);
          const spalte = i % 12;
          const zweite = i % 2 === 1;
          const sichtbar = zweite ? verdopplung : 1;
          const x = 150 + spalte * 71 + (zweite ? (1 - verdopplung) * -71 : 0);
          const y = 1290 + reihe * 230;
          return (
            <Tribut
              key={i}
              x={x}
              y={y}
              s={0.7}
              pose={POSEN.stehen(lf + i * 5)}
              frisur={i % 4 === 0 ? "zopf" : "kurz"}
              frame={lf}
              farbe="#0a0604"
              rand={zweite ? "#FF8A3D" : "#ffd2b0"}
              randBreite={6}
              deckkraft={sichtbar}
            />
          );
        })}
      </Karte>
    );
  } else {
    // 75.: Die Sieger – mit goldenem Schimmer
    inhalt = (
      <Karte f={lf} dauer={teil} nummer="75." titel="DIE SIEGER MUSSTEN ZURÜCK" farbe="#FFC94A">
        {Array.from({ length: 5 }).map((_, i) => {
          const x = 230 + i * 155;
          const auf = easeOut(prog(lf, 6 + i * 3, 16 + i * 3));
          return (
            <g key={i} opacity={auf} transform={`translate(0 ${(1 - auf) * 60})`}>
              <Schatten x={x} y={1520} s={1} />
              <Tribut x={x} y={1520} s={1.35} pose={POSEN.kampfbereit(lf + i * 13)} frisur={i % 2 ? "kurz" : "zopf"} frame={lf} farbe="#0b0906" rand="#FFC94A" randBreite={7} />
            </g>
          );
        })}
        <Partikel anzahl={25} seed="gold" farbe="#FFD97A" tempo={1.2} groesse={[2, 4]} bereich={{ x: 120, y: 1100, w: 840, h: 450 }} />
      </Karte>
    );
  }

  return (
    <AbsoluteFill>
      <Buehne hintergrund="radial-gradient(circle at 50% 55%, #1d1420 0%, #050307 70%)">
        <rect width={W} height={H} fill="transparent" />
        <Partikel anzahl={40} seed="rbasche" farbe="#ff7a3a" tempo={1.6} groesse={[1.5, 3.5]} />
        {inhalt}
      </Buehne>
    </AbsoluteFill>
  );
};
