import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Blitz, Buehne, H, Kamera, Partikel, Strahlen, W } from "../../../lib/effekte";
import { clamp, easeInOut, easeOut, lerp, prog, rauschen, wackler } from "../../../lib/mathe";
import type { SzenenProps } from "../../../lib/folge";

// Szene 3: Der Umschlag – Siegel bricht, Licht, Zettel "VERBUNDEN"
export const Umschlag: React.FC<SzenenProps> = ({ dauer }) => {
  const f = useCurrentFrame();
  const p = f / dauer;
  const bruch = Math.round(dauer * 0.46);

  const cx = W / 2;
  const breite = 700;
  const hoehe = 460;
  const oben = 1060;
  const links = cx - breite / 2;

  const klappe = easeInOut(prog(p, 0.48, 0.62)); // 0 zu, 1 offen
  const zettel = easeOut(prog(p, 0.58, 0.82));
  const strahlen = clamp(prog(p, 0.47, 0.55)) * (0.8 + 0.2 * Math.sin(f / 4));
  const schweben = Math.sin(f / 14) * 8;

  const zoom = p < 0.46 ? lerp(0.95, 1.18, easeInOut(prog(p, 0, 0.46))) : lerp(1.18, 1.32, easeOut(prog(p, 0.6, 1)));
  const fokusY = lerp(oben + hoehe / 2, oben - 200, easeOut(prog(p, 0.58, 0.9)));
  const vorBruchZittern = p < 0.46 ? prog(p, 0.25, 0.46) * 4 : 0;
  const w = wackler(f, bruch, 38, 10);
  const zitter = { x: rauschen("uz", f * 1.5) * vorBruchZittern + w.x, y: rauschen("uz2", f * 1.5) * vorBruchZittern + w.y, r: w.r };

  // Siegel-Hälften fallen nach dem Bruch
  const fall = Math.max(0, f - bruch);
  const siegelY = oben + 250;
  const siegelPuls = 0.5 + 0.5 * Math.sin(f / 3) * prog(p, 0.1, 0.46);

  const klappeScaleY = 1 - 2 * klappe;

  return (
    <AbsoluteFill>
      <Buehne hintergrund="radial-gradient(circle at 50% 58%, #2a1810 0%, #0a0605 45%, #000 85%)">
        <rect width={W} height={H} fill="transparent" />
        <Kamera zoom={zoom} y={fokusY} wackler={zitter}>
          {/* Lichtkegel von oben */}
          <path d={`M ${cx - 120} -200 L ${cx + 120} -200 L ${cx + 520} ${oben + hoehe + 200} L ${cx - 520} ${oben + hoehe + 200} Z`} fill="#ffdca0" opacity={0.07} filter="url(#weich)" />
          <Partikel anzahl={45} seed="staub" farbe="#ffe2b0" tempo={0.4} groesse={[1.5, 3]} drift={60} />

          <g transform={`translate(0 ${schweben})`}>
            {/* Schatten */}
            <ellipse cx={cx} cy={oben + hoehe + 70} rx={breite * 0.55} ry={40} fill="black" opacity={0.7} filter="url(#weich)" />

            {/* Lichtstrahlen aus dem Umschlag */}
            <Strahlen x={cx} y={oben + 20} laenge={1300} anzahl={18} deckkraft={strahlen} drehung={f * 0.4} />
            <circle cx={cx} cy={oben} r={220} fill="#FFE9B0" opacity={strahlen * 0.6} filter="url(#glowGross)" />

            {/* Rückseite */}
            <rect x={links} y={oben} width={breite} height={hoehe} rx={10} fill="#b9a787" />

            {/* Klappe offen (hinter dem Zettel) */}
            {klappe > 0.5 && (
            <g transform={`translate(0 ${oben}) scale(1 ${klappeScaleY}) translate(0 ${-oben})`}>
              <path d={`M ${links} ${oben} L ${cx} ${oben + 270} L ${links + breite} ${oben} Z`} fill={klappeScaleY > 0 ? "#D9C7A3" : "#c7b48f"} stroke="#a8936c" strokeWidth={3} />
            </g>
            )}
            {/* Zettel */}
            <g transform={`translate(0 ${-zettel * 580})`}>
              <rect x={links + 50} y={oben + 30} width={breite - 100} height={hoehe - 40} rx={6} fill="#F4EBD8" />
              <rect x={links + 70} y={oben + 50} width={breite - 140} height={hoehe - 80} rx={4} fill="none" stroke="#8a6d3b" strokeWidth={3} />
              <text x={cx} y={oben + 135} textAnchor="middle" fontFamily="Bebas Neue" fontSize={44} letterSpacing={6} fill="#5a4320">
                DIE 100. QUARTER QUELL
              </text>
              <text x={cx} y={oben + 185} textAnchor="middle" fontFamily="Bebas Neue" fontSize={34} letterSpacing={4} fill="#7a6238">
                DIE TRIBUTE JEDES DISTRIKTS SIND
              </text>
              <text x={cx} y={oben + 300} textAnchor="middle" fontFamily="Bebas Neue" fontSize={120} letterSpacing={8} fill="#8f1d12">
                VERBUNDEN
              </text>
            </g>

            {/* Vordertasche (V-Form) */}
            <path d={`M ${links} ${oben} L ${cx} ${oben + 262} L ${links + breite} ${oben} L ${links + breite} ${oben + hoehe} L ${links} ${oben + hoehe} Z`} fill="#E3D3B2" />
            <path d={`M ${links} ${oben + hoehe} L ${cx} ${oben + 235} L ${links + breite} ${oben + hoehe}`} fill="none" stroke="#b9a787" strokeWidth={3} />

            {/* Klappe zu (vor allem) */}
            {klappe <= 0.5 && (
            <g transform={`translate(0 ${oben}) scale(1 ${klappeScaleY}) translate(0 ${-oben})`}>
              <path d={`M ${links} ${oben} L ${cx} ${oben + 270} L ${links + breite} ${oben} Z`} fill={klappeScaleY > 0 ? "#D9C7A3" : "#c7b48f"} stroke="#a8936c" strokeWidth={3} />
            </g>
            )}
            {/* Siegel */}
            {f < bruch ? (
              <g>
                <circle cx={cx} cy={siegelY} r={95} fill="#ff3b1f" opacity={siegelPuls * 0.6} filter="url(#glowGross)" />
                <circle cx={cx} cy={siegelY} r={62} fill="#9e1b10" stroke="#6b0f08" strokeWidth={6} />
                <circle cx={cx} cy={siegelY} r={46} fill="none" stroke="#c8392a" strokeWidth={4} />
                <text x={cx} y={siegelY + 22} textAnchor="middle" fontFamily="Bebas Neue" fontSize={62} fill="#f3b7a8">
                  100
                </text>
              </g>
            ) : (
              [-1, 1].map((s) => (
                <g
                  key={s}
                  transform={`translate(${cx + s * (8 + fall * 9)} ${siegelY + fall * fall * 1.4}) rotate(${s * fall * 7})`}
                  opacity={clamp(1 - fall / 30)}
                >
                  <path d={`M 0 -62 A 62 62 0 0 ${s > 0 ? 1 : 0} 0 62 L ${s * 10} 20 L ${-s * 6} -10 L ${s * 8} -35 Z`} fill="#9e1b10" stroke="#6b0f08" strokeWidth={5} />
                </g>
              ))
            )}
          </g>
        </Kamera>
      </Buehne>
      <Blitz start={bruch} dauer={12} farbe="#FFF3D6" staerke={0.95} />
    </AbsoluteFill>
  );
};
