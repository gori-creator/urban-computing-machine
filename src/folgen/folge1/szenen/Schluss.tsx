import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Buehne, Kamera, Partikel, W, H } from "../../../lib/effekte";
import { POSEN, Tribut, weltPunkt } from "../../../lib/figur";
import { clamp, easeBack, easeOut, prog, wackler } from "../../../lib/mathe";
import { Verbindung } from "../../../lib/verbindung";
import { GlitchText } from "./Finale";
import type { SzenenProps } from "../../../lib/folge";

// Szene 8: Standbild in Rot + "?" → Glitch → Teaser "Folge 2: Die 125."
export const Schluss: React.FC<SzenenProps> = ({ dauer }) => {
  const f = useCurrentFrame();
  const p = f / dauer;
  const umschalt = Math.round(dauer * 0.55);
  const glitch = clamp(1 - Math.abs(f - umschalt) / 9);
  const teil2 = f >= umschalt;

  const frage = easeBack(prog(f, 2, 12));
  const w = wackler(f, 2, 30, 8);
  const w2 = wackler(f, umschalt, 40, 8);
  const blase = easeOut(prog(p, 0.2, 0.3));

  const tamPose = POSEN.kampfbereit(0);
  const liraPose = POSEN.kampfbereit(20);
  const a = weltPunkt(400, 1620, tamPose, 1.2, 1, "taille");
  const b = weltPunkt(700, 1620, liraPose, 1.5, -1, "taille");

  const titel = easeBack(prog(f, umschalt + 2, umschalt + 14));
  const untertitel = easeOut(prog(f, umschalt + 12, umschalt + 24));

  return (
    <AbsoluteFill>
      {!teil2 ? (
        <Buehne hintergrund="radial-gradient(circle at 50% 70%, #5a0606 0%, #1a0101 60%, #000 100%)">
          <Kamera x={550} y={1420} zoom={1.4 + p * 0.3} wackler={w}>
            <rect x={-500} y={1620} width={2000} height={600} fill="#0a0101" />
            <Tribut x={400} y={1620} s={1.2} pose={tamPose} frisur="stachel" farbe="#0a0000" rand="#ff2a1f" randBreite={5} />
            <Tribut x={700} y={1620} s={1.5} pose={liraPose} richtung={-1} frisur="zopf" farbe="#0a0000" rand="#ff2a1f" randBreite={5} frame={0} />
            <Verbindung a={a} b={b} maxLaenge={420} frame={f} helligkeit={0.8} farbe="#ff6a5a" seed="schluss" />
          </Kamera>
          {/* großes Fragezeichen */}
          <g transform={`translate(${W / 2} 1000) scale(${frage * (1 + Math.sin(f / 6) * 0.03)})`}>
            <text textAnchor="middle" y={150} fontFamily="Bebas Neue" fontSize={520} fill="#ff2a1f" filter="url(#glowGross)" opacity={0.8}>
              ?
            </text>
            <text textAnchor="middle" y={150} fontFamily="Bebas Neue" fontSize={520} fill="#fff0ea">
              ?
            </text>
          </g>
          {/* Kommentar-Blase */}
          <g transform={`translate(${W / 2} 1420) scale(${blase})`} opacity={blase}>
            <rect x={-330} y={-70} width={660} height={140} rx={70} fill="white" />
            <path d="M -40 66 L -70 120 L 10 66 Z" fill="white" />
            <g transform="translate(-255 0)">
              <rect x={-38} y={-30} width={76} height={54} rx={14} fill="#ff2a1f" />
              <path d="M -14 22 L -24 42 L 4 22 Z" fill="#ff2a1f" />
            </g>
            <text x={30} y={22} textAnchor="middle" fontFamily="Montserrat Black" fontSize={56} fill="#111">
              KOMMENTARE
            </text>
          </g>
        </Buehne>
      ) : (
        <Buehne hintergrund="radial-gradient(circle at 50% 50%, #2a1a05 0%, #0a0602 55%, #000 100%)">
          <Kamera zoom={1 + (p - 0.55) * 0.2} wackler={w2}>
            <Partikel anzahl={50} seed="teaser" farbe="#FFC94A" tempo={1.4} groesse={[1.5, 4]} />
            <text x={W / 2} y={760} textAnchor="middle" fontFamily="Bebas Neue" fontSize={90} letterSpacing={24} fill="white" opacity={untertitel}>
              FOLGE 2
            </text>
            <g transform={`translate(${W / 2} 1040) scale(${titel}) translate(${-W / 2} -1040)`}>
              <text x={W / 2} y={1120} textAnchor="middle" fontFamily="Bebas Neue" fontSize={300} fill="#FFC94A" filter="url(#glowGross)" opacity={0.7}>
                DIE 125.
              </text>
              <GlitchText x={W / 2} y={1120} text="DIE 125." groesse={300} farbe="#FFE6A8" staerke={glitch + 0.08} f={f} seed="teaser" />
            </g>
            <text x={W / 2} y={1240} textAnchor="middle" fontFamily="Bebas Neue" fontSize={80} letterSpacing={18} fill="#FFC94A" opacity={untertitel}>
              QUARTER QUELL
            </text>
            <rect x={W / 2 - 170} y={1320} width={340} height={6} fill="#FFC94A" opacity={untertitel} transform={`scale(${untertitel} 1)`} style={{ transformOrigin: "540px 1323px" }} />
          </Kamera>
        </Buehne>
      )}
      {/* Glitch-Störstreifen beim Umschalten */}
      {glitch > 0 && (
        <AbsoluteFill>
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: ((i * 293 + f * 37) % H),
                height: 18 + (i % 3) * 22,
                background: i % 2 ? "rgba(0,229,255,0.5)" : "rgba(255,23,68,0.5)",
                transform: `translateX(${(i % 2 ? 1 : -1) * 60 * glitch}px)`,
                opacity: glitch,
              }}
            />
          ))}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
