import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Blitz, Buehne, H, Kamera, Partikel, W } from "../../../lib/effekte";
import { clamp, easeBack, easeOut, prog, wackler } from "../../../lib/mathe";
import type { SzenenProps } from "../../../lib/folge";

// Szene 1: Kanonenschuss, die "100" knallt ins Bild
export const Hook: React.FC<SzenenProps> = ({ dauer }) => {
  const f = useCurrentFrame();
  const knall = Math.round(dauer * 0.09);
  const rein = easeBack(prog(f, knall, knall + 9));
  const skala = 2.8 - 1.8 * rein;
  const w = wackler(f, knall, 45, 10);
  const risse = easeOut(prog(f, knall + 2, knall + 10));
  const untertitel = easeOut(prog(f, knall + 14, knall + 28));
  const zoom = 1 + f / dauer * 0.12;
  const pulsRot = clamp(1 - (f - knall) / 40);

  // Risse über der Zahl
  const riss = (pts: number[][]) => {
    const n = Math.max(2, Math.round(pts.length * risse));
    return "M " + pts.slice(0, n).map((p) => `${p[0]} ${p[1]}`).join(" L ");
  };

  return (
    <AbsoluteFill>
      <Buehne
        hintergrund={`radial-gradient(circle at 50% 52%, rgba(${120 + pulsRot * 100},20,10,1) 0%, #0b0303 55%, #000 100%)`}
      >
        <rect width={W} height={H} fill="transparent" />
        <Kamera zoom={zoom} wackler={w} y={1000}>
          <Partikel anzahl={60} seed="asche" farbe="#FF8A3D" tempo={2.2} groesse={[2, 5]} drift={40} />
          {f >= knall && (
            <g transform={`translate(${W / 2} 1060) scale(${skala})`} opacity={clamp(rein * 2)}>
              <text
                textAnchor="middle"
                y={180}
                fontFamily="Bebas Neue"
                fontSize={560}
                fill="#FF6A2B"
                filter="url(#glowGross)"
                opacity={0.8}
              >
                100
              </text>
              <text textAnchor="middle" y={180} fontFamily="Bebas Neue" fontSize={560} fill="#FFF3E0" stroke="#3a0b00" strokeWidth={6}>
                100
              </text>
              <g stroke="#1a0500" strokeWidth={9} fill="none" strokeLinejoin="round" strokeLinecap="round">
                <path d={riss([[-60, -240], [-30, -150], [-70, -60], [-20, 30], [-50, 160]])} />
                <path d={riss([[150, -220], [120, -120], [170, -40], [130, 60]])} />
                <path d={riss([[-230, 40], [-170, 80], [-200, 150]])} />
              </g>
            </g>
          )}
          <text
            x={W / 2}
            y={1400}
            textAnchor="middle"
            fontFamily="Bebas Neue"
            fontSize={120}
            letterSpacing={30 - untertitel * 12}
            fill="#FFC94A"
            opacity={untertitel}
          >
            QUARTER QUELL
          </text>
        </Kamera>
      </Buehne>
      <Blitz start={knall} dauer={10} staerke={1} />
    </AbsoluteFill>
  );
};
