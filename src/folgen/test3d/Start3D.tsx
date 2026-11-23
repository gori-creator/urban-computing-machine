import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { BREITE, HOEHE, SzenenProps } from "../../lib/folge";
import { Blitz, Buehne, Partikel, W } from "../../lib/effekte";
import { POSEN, Pose, mischePose, weltPunkt } from "../../lib/figur";
import { CartoonTribut, LOOKS, zufallsLook, Ausdruck, Look } from "../../lib/cartoon";
import { clamp, easeInOut, easeOut, prog, wackler } from "../../lib/mathe";
import { Verbindung } from "../../lib/verbindung";
import {
  FigurSchatten,
  Felsen,
  Fuellhorn,
  Gelaende,
  Glow,
  Himmel,
  KameraEinstellung,
  KameraSteuerung,
  Plattform,
  Vorraete,
  V3,
  Waldring,
  mischeKamera,
  projektor,
} from "../../lib/welt3d";

// =============================================================
//  TESTSZENE: Start am Füllhorn in echtem 3D, Figuren in 2D
// =============================================================

const H: V3 = [9, 0, -16]; // Füllhorn-Öffnung
const RING = 12; // Radius der Plattformen
const SCHRITT = 15; // Grad zwischen Plattformen
const BASIS = 152.4; // Winkel von Tams Plattform
const SEIL = 5.5; // Länge der Verbindung in Metern
const SONNE: V3 = [40, 12, -90]; // Richtung der tiefen Sonne

const plattformPos = (k: number): V3 => {
  const a = ((BASIS + k * SCHRITT) * Math.PI) / 180;
  return [H[0] + Math.cos(a) * RING, 0, H[2] + Math.sin(a) * RING];
};
const zumHorn = (p: V3, d: number): V3 => {
  const dx = H[0] - p[0];
  const dz = H[2] - p[2];
  const l = Math.hypot(dx, dz);
  return [p[0] + (dx / l) * d, 0, p[2] + (dz / l) * d];
};
const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[2] - b[2]);

type Figur = { pos: V3; pose: Pose; look: Look; groesse: number; ausdruck: Ausdruck; ziel?: V3; richtung?: 1 | -1; frame: number; held?: boolean };

export const Start3D: React.FC<SzenenProps> = ({ dauer }) => {
  const f = useCurrentFrame();
  const p = f / dauer;
  const gong = Math.round(dauer * 0.22);
  const ruck = Math.round(dauer * 0.5);
  const lauf = f * 0.5;

  // ---------- Tam ----------
  const tamStart = plattformPos(0);
  let tamPos = tamStart;
  let tamPose: Pose = POSEN.stehen(0);
  let tamAusdruck: Ausdruck = "angst";
  if (p >= 0.22 && p < 0.3) {
    tamPos = zumHorn(tamStart, 1.2 * prog(p, 0.22, 0.3));
    tamPose = POSEN.rennen(lauf);
    tamAusdruck = "entschlossen";
  } else if (p >= 0.3 && p < 0.36) {
    tamPos = zumHorn(tamStart, 1.2 + 0.35 * easeOut(prog(p, 0.3, 0.36)));
    tamPose = mischePose(POSEN.rennen(lauf), POSEN.stolpern(), easeOut(prog(p, 0.3, 0.36)));
    tamAusdruck = "panik";
  } else if (p >= 0.36) {
    tamPos = zumHorn(tamStart, 1.55);
    tamPose = mischePose(POSEN.stolpern(), POSEN.knien(), easeOut(prog(p, 0.36, 0.42)));
    tamAusdruck = p < 0.6 ? "schmerz" : "angst";
    if (p >= 0.86) {
      tamPose = mischePose(POSEN.knien(), POSEN.stehen(0), easeInOut(prog(p, 0.86, 0.95)));
      tamAusdruck = "erleichtert";
    }
  }

  // ---------- Lira ----------
  const liraStart = plattformPos(-1);
  // Wie weit kann Lira rennen, bis das Seil spannt?
  const tamLiegt = zumHorn(tamStart, 1.55);
  let maxD = 0;
  while (maxD < 20 && dist(zumHorn(liraStart, maxD), tamLiegt) < SEIL * 0.97) maxD += 0.02;
  let liraPos = liraStart;
  let liraPose: Pose = POSEN.kampfbereit(0);
  let liraAusdruck: Ausdruck = "entschlossen";
  let liraRueck = false;
  const liraZurueck: V3 = [tamLiegt[0] + 0.9, 0, tamLiegt[2] + 0.5];
  if (p >= 0.22 && p < 0.5) {
    liraPos = zumHorn(liraStart, maxD * prog(p, 0.22, 0.5));
    liraPose = POSEN.rennen(lauf + 1);
  } else if (p >= 0.5 && p < 0.59) {
    liraPos = zumHorn(liraStart, maxD - 0.3 * easeOut(prog(p, 0.5, 0.55)));
    liraPose = mischePose(POSEN.zurueckgerissen(), POSEN.stehen(0), easeInOut(prog(p, 0.54, 0.59)));
    liraAusdruck = "panik";
  } else if (p >= 0.59 && p < 0.8) {
    const von = zumHorn(liraStart, maxD - 0.3);
    const t = easeInOut(prog(p, 0.62, 0.8));
    liraPos = [von[0] + (liraZurueck[0] - von[0]) * t, 0, von[2] + (liraZurueck[2] - von[2]) * t];
    liraPose = p < 0.62 ? POSEN.stehen(0) : POSEN.rennen(lauf);
    liraAusdruck = "angst";
    liraRueck = true;
  } else if (p >= 0.8) {
    liraPos = liraZurueck;
    liraPose = mischePose(POSEN.stehen(0), POSEN.ziehen(), easeOut(prog(p, 0.8, 0.86)));
    liraAusdruck = "entschlossen";
    liraRueck = true;
  }

  // ---------- Kamera ----------
  const mitte: V3 = [(tamPos[0] + liraPos[0]) / 2, 0, (tamPos[2] + liraPos[2]) / 2];
  const K0: KameraEinstellung = { pos: [-7 + p * 4, 6.5 - p * 2, 3], ziel: [4, 0.6, -14], fov: 52 };
  const K1: KameraEinstellung = { pos: [mitte[0] - 1.5, 1.9, mitte[2] + 13], ziel: [mitte[0] + 0.3, 1.5, mitte[2] - 1], fov: 50 };
  const K2: KameraEinstellung = { pos: [mitte[0] - 0.6, 1.5, mitte[2] + 11.5], ziel: [mitte[0], 1.4, mitte[2]], fov: 50 };
  const K3: KameraEinstellung = { pos: [mitte[0] - 0.6, 1.2, mitte[2] + 5.2], ziel: [mitte[0] + 0.2, 1.15, mitte[2]], fov: 38 };
  let kam = K0;
  kam = mischeKamera(kam, K1, easeInOut(prog(p, 0.16, 0.34)));
  kam = mischeKamera(kam, K2, easeOut(prog(p, 0.47, 0.51)) * (1 - easeInOut(prog(p, 0.58, 0.7))));
  kam = mischeKamera(kam, K3, easeInOut(prog(p, 0.74, 0.92)));
  const w = wackler(f, ruck, 28, 9);
  const wG = wackler(f, gong, 10, 12);
  kam = { ...kam, pos: [kam.pos[0] + (w.x + wG.x) / 400, kam.pos[1] + (w.y + wG.y) / 400, kam.pos[2]] };
  const proj = projektor(kam);

  // ---------- Alle Figuren ----------
  const figuren: Figur[] = [
    { pos: tamPos, pose: tamPose, look: LOOKS.tam, groesse: 1.38, ausdruck: tamAusdruck, ziel: H, frame: f, held: true },
    { pos: liraPos, pose: liraPose, look: LOOKS.lira, groesse: 1.68, ausdruck: liraAusdruck, ziel: liraRueck ? tamPos : H, frame: f, held: true },
  ];
  [-7, -6, -5, -4, 3, 4, 5, 6, 7, 8].forEach((k, i) => {
    const start = plattformPos(k);
    const los = 0.22 + (i % 4) * 0.012;
    const d = p > los ? Math.min(RING - 3 - (i % 3), ((p - los) * dauer * 4.5) / 30) : 0;
    figuren.push({
      pos: zumHorn(start, d),
      pose: p > los && d < RING - 3.2 - (i % 3) ? POSEN.rennen(lauf + i * 1.3) : p > los ? POSEN.kampfbereit(0) : POSEN.kampfbereit(0),
      look: zufallsLook(i),
      groesse: 1.55 + (i % 3) * 0.1,
      ausdruck: "entschlossen",
      ziel: H,
      frame: f + i * 7,
    });
  });

  // Zeichnen: hinten zuerst
  const gezeichnet = figuren
    .map((fg) => {
      const fuss = proj.punkt(fg.pos);
      const ppm = proj.pxProMeter(fg.pos);
      const s = (ppm * fg.groesse) / 250;
      const zielX = fg.ziel ? proj.punkt(fg.ziel).x : fuss.x + 1;
      const richtung: 1 | -1 = fg.richtung ?? (zielX >= fuss.x ? 1 : -1);
      return { ...fg, fuss, s, richtung, abstand: proj.abstand(fg.pos) };
    })
    .filter((g) => g.fuss.tiefe < 1 && g.fuss.x > -300 && g.fuss.x < BREITE + 300)
    .sort((a, b) => b.abstand - a.abstand);

  const tamG = gezeichnet.find((g) => g.look === LOOKS.tam);
  const liraG = gezeichnet.find((g) => g.look === LOOKS.lira);
  const seilPx = proj.pxProMeter(mitte) * SEIL;
  const a = tamG ? weltPunkt(tamG.fuss.x, tamG.fuss.y, tamG.pose, tamG.s, tamG.richtung, "taille") : null;
  const b = liraG ? weltPunkt(liraG.fuss.x, liraG.fuss.y, liraG.pose, liraG.s, liraG.richtung, "taille") : null;
  const spannung = a && b ? clamp((Math.hypot(b.x - a.x, b.y - a.y) / seilPx - 0.88) / 0.12) : 0;

  // Sonnenrichtung für lange Schatten
  const weg = Math.atan2(-SONNE[0], -SONNE[2]);

  // Countdown
  const zahl = p < 0.22 ? 3 - Math.floor(prog(p, 0.04, 0.22) * 3) : 0;
  const zahlLokal = (prog(p, 0.04, 0.22) * 3) % 1;
  const horn = proj.punkt([H[0] + 2, 2.5, H[2]]);

  return (
    <AbsoluteFill>
      <ThreeCanvas width={BREITE} height={HOEHE} shadows style={{ position: "absolute", inset: 0 }}>
        <KameraSteuerung k={kam} />
        <fog attach="fog" args={["#e9a37a", 35, 190]} />
        <Himmel oben="#2b3570" mitte="#c66b6b" horizont="#ffb46a" />
        <Glow pos={[SONNE[0] * 3, SONNE[1] * 3, SONNE[2] * 3]} groesse={190} farbe="#ffb46a" deckkraft={0.9} />
        <Glow pos={[SONNE[0] * 3, SONNE[1] * 3, SONNE[2] * 3]} groesse={45} farbe="#fff1cf" />

        <hemisphereLight args={["#a9bcff", "#7a5236", 1.6]} />
        <ambientLight intensity={0.45} color="#ffd9c0" />
        <pointLight position={[H[0] - 3, 4, H[2] + 4]} intensity={40} distance={18} color="#ffc68a" />
        <directionalLight
          position={SONNE}
          intensity={4.2}
          color="#ffb07a"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-35}
          shadow-camera-right={35}
          shadow-camera-top={35}
          shadow-camera-bottom={-35}
          shadow-camera-near={1}
          shadow-camera-far={250}
          shadow-bias={-0.0005}
        />

        <Gelaende farbe="#a39c58" flach={H} radius={24} />
        {/* Sandiger Arena-Boden */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[H[0], 0.015, H[2]]} receiveShadow>
          <circleGeometry args={[21, 64]} />
          <meshStandardMaterial color="#c4a274" roughness={1} />
        </mesh>

        <Fuellhorn pos={H} drehung={0.35} skala={1.25} />
        <Vorraete mitte={H} anzahl={34} seed="vorrat" radius={6} />
        {Array.from({ length: 24 }).map((_, k) => (
          <Plattform key={k} pos={plattformPos(k - 12)} />
        ))}
        <Felsen mitte={H} von={24} bis={45} anzahl={40} seed="fels" flach={H} radius={24} />
        <Waldring mitte={H} von={30} bis={75} anzahl={150} seed="wald" flach={H} radius={24} />
        {/* ferne Berge */}
        {Array.from({ length: 14 }).map((_, i) => {
          const wnk = (i / 14) * Math.PI * 2;
          return (
            <mesh key={i} position={[H[0] + Math.cos(wnk) * 210, -2, H[2] + Math.sin(wnk) * 210]}>
              <coneGeometry args={[45 + (i % 3) * 15, 50 + (i % 4) * 18, 6]} />
              <meshStandardMaterial color="#5d5070" roughness={1} flatShading />
            </mesh>
          );
        })}

        {/* lange Abendschatten der 2D-Figuren */}
        {figuren.map((fg, i) => (
          <FigurSchatten key={i} pos={fg.pos} laenge={fg.groesse * 2.6} breite={0.75} richtung={weg} />
        ))}
      </ThreeCanvas>

      {/* 2D-Figuren über der 3D-Welt */}
      <Buehne hintergrund="transparent">
        {gezeichnet.map((g, i) => (
          <React.Fragment key={i}>
            {g.held && g.look === LOOKS.lira && a && b && (
              <Verbindung a={a} b={b} maxLaenge={seilPx} frame={f} helligkeit={clamp(prog(p, 0, 0.08)) * (0.9 + spannung * 0.5)} dicke={Math.max(0.5, g.s * 1.1) * (1 + spannung * 0.4)} seed="start3d" />
            )}
            <CartoonTribut x={g.fuss.x} y={g.fuss.y} pose={g.pose} s={g.s} look={g.look} richtung={g.richtung} ausdruck={g.ausdruck} frame={g.frame} />
          </React.Fragment>
        ))}

        {/* Namen */}
        {tamG && liraG && (
          <g opacity={clamp(prog(p, 0.24, 0.29)) * (1 - clamp(prog(p, 0.4, 0.45)))} fontFamily="Bebas Neue" textAnchor="middle" letterSpacing={5}>
            <text x={tamG.fuss.x} y={tamG.fuss.y - 260 * tamG.s - 20} fontSize={48} fill="#FFC94A" stroke="#000" strokeWidth={6} paintOrder="stroke">TAM · 12</text>
            <text x={liraG.fuss.x} y={liraG.fuss.y - 300 * liraG.s - 20} fontSize={48} fill="#FFC94A" stroke="#000" strokeWidth={6} paintOrder="stroke">LIRA · 17</text>
          </g>
        )}

        <Partikel anzahl={35} seed="staub3d" farbe="#ffe0b0" tempo={0.35} groesse={[1.5, 3.5]} drift={60} />

        {/* Gong-Druckwelle um das Füllhorn */}
        {f >= gong && f < gong + 30 && (
          <circle cx={horn.x} cy={horn.y} r={(f - gong) * 45} fill="none" stroke="#fff1cf" strokeWidth={12 * (1 - (f - gong) / 30)} opacity={1 - (f - gong) / 30} />
        )}

        {zahl > 0 && (
          <text
            x={W / 2}
            y={760}
            textAnchor="middle"
            fontFamily="Bebas Neue"
            fontSize={300}
            fill="white"
            stroke="#000"
            strokeWidth={10}
            paintOrder="stroke"
            opacity={1 - zahlLokal * 0.8}
            transform={`translate(${W / 2} 660) scale(${1.4 - easeOut(Math.min(1, zahlLokal * 3)) * 0.4}) translate(${-W / 2} -660)`}
          >
            {zahl}
          </text>
        )}
      </Buehne>
      <Blitz start={gong} dauer={10} farbe="#FFE2A8" staerke={0.5} />
      <AbsoluteFill style={{ boxShadow: `inset 0 0 ${160 * spannung}px rgba(255,40,20,${0.6 * spannung})` }} />
    </AbsoluteFill>
  );
};
