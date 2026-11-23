import React, { useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { random } from "remotion";
import { BREITE, HOEHE } from "./folge";

// =============================================================
//  Bausteine für 3D-Welten (Three.js) + Projektion für 2D-Figuren
// =============================================================

export type V3 = [number, number, number];
export type KameraEinstellung = { pos: V3; ziel: V3; fov: number };

export const mischeKamera = (a: KameraEinstellung, b: KameraEinstellung, t: number): KameraEinstellung => ({
  pos: [a.pos[0] + (b.pos[0] - a.pos[0]) * t, a.pos[1] + (b.pos[1] - a.pos[1]) * t, a.pos[2] + (b.pos[2] - a.pos[2]) * t],
  ziel: [a.ziel[0] + (b.ziel[0] - a.ziel[0]) * t, a.ziel[1] + (b.ziel[1] - a.ziel[1]) * t, a.ziel[2] + (b.ziel[2] - a.ziel[2]) * t],
  fov: a.fov + (b.fov - a.fov) * t,
});

const baueKamera = (k: KameraEinstellung) => {
  const cam = new THREE.PerspectiveCamera(k.fov, BREITE / HOEHE, 0.1, 2000);
  cam.position.set(...k.pos);
  cam.lookAt(new THREE.Vector3(...k.ziel));
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  return cam;
};

/** Rechnet 3D-Punkte in Bildschirm-Pixel um (für die 2D-Figuren über der 3D-Welt) */
export const projektor = (k: KameraEinstellung) => {
  const cam = baueKamera(k);
  const punkt = (p: V3) => {
    const v = new THREE.Vector3(...p).project(cam);
    return { x: ((v.x + 1) / 2) * BREITE, y: ((1 - v.y) / 2) * HOEHE, tiefe: v.z };
  };
  /** Pixel pro Meter an einer Stelle (für die Figurengröße) */
  const pxProMeter = (p: V3) => {
    const a = punkt(p);
    const b = punkt([p[0], p[1] + 1, p[2]]);
    return Math.abs(a.y - b.y);
  };
  const abstand = (p: V3) => cam.position.distanceTo(new THREE.Vector3(...p));
  return { punkt, pxProMeter, abstand };
};

/** Setzt die Three.js-Kamera jeden Frame */
export const KameraSteuerung: React.FC<{ k: KameraEinstellung }> = ({ k }) => {
  const { camera } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...k.pos);
  cam.fov = k.fov;
  cam.aspect = BREITE / HOEHE;
  cam.near = 0.1;
  cam.far = 2000;
  cam.lookAt(new THREE.Vector3(...k.ziel));
  cam.updateProjectionMatrix();
  return null;
};

// ---------- Himmel mit Farbverlauf ----------
export const Himmel: React.FC<{ oben: string; mitte: string; horizont: string }> = ({ oben, mitte, horizont }) => {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          oben: { value: new THREE.Color(oben) },
          mitte: { value: new THREE.Color(mitte) },
          horizont: { value: new THREE.Color(horizont) },
        },
        vertexShader: `varying vec3 vPos; void main(){ vPos = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 oben; uniform vec3 mitte; uniform vec3 horizont; varying vec3 vPos;
          void main(){ float h = clamp(vPos.y, -0.1, 1.0);
            vec3 c = h < 0.12 ? mix(horizont, mitte, smoothstep(-0.05, 0.12, h)) : mix(mitte, oben, smoothstep(0.12, 0.6, h));
            gl_FragColor = vec4(c, 1.0); }`,
      }),
    [oben, mitte, horizont],
  );
  return (
    <mesh material={material} renderOrder={-1}>
      <sphereGeometry args={[900, 32, 16]} />
    </mesh>
  );
};

// ---------- Weicher Leucht-Fleck (Sonne, Lichtschein) ----------
const glowTextur = (farbe: string) => {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const v = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  v.addColorStop(0, farbe);
  v.addColorStop(0.25, farbe + "aa");
  v.addColorStop(1, farbe + "00");
  g.fillStyle = v;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
};

export const Glow: React.FC<{ pos: V3; groesse: number; farbe: string; deckkraft?: number }> = ({ pos, groesse, farbe, deckkraft = 1 }) => {
  const tex = useMemo(() => glowTextur(farbe), [farbe]);
  return (
    <sprite position={pos} scale={[groesse, groesse, 1]}>
      <spriteMaterial map={tex} transparent opacity={deckkraft} depthWrite={false} fog={false} blending={THREE.AdditiveBlending} />
    </sprite>
  );
};

// ---------- Gelände mit sanften Hügeln ----------
export const hoehe = (x: number, z: number, flach: V3, radius: number) => {
  const d = Math.hypot(x - flach[0], z - flach[2]);
  const f = Math.min(1, Math.max(0, (d - radius) / 25));
  const h =
    Math.sin(x * 0.08) * 1.6 + Math.cos(z * 0.07) * 1.8 + Math.sin((x + z) * 0.15) * 0.6 + Math.sin(x * 0.31 + z * 0.17) * 0.25;
  return h * f + f * f * 4;
};

export const Gelaende: React.FC<{ farbe: string; flach: V3; radius: number }> = ({ farbe, flach, radius }) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(600, 600, 160, 160);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, hoehe(pos.getX(i), pos.getZ(i), flach, radius));
    }
    g.computeVertexNormals();
    return g;
  }, [flach, radius]);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color={farbe} roughness={1} flatShading />
    </mesh>
  );
};

// ---------- Füllhorn (gebogenes, sich verjüngendes Horn) ----------
export const Fuellhorn: React.FC<{ pos: V3; drehung?: number; skala?: number }> = ({ pos, drehung = 0, skala = 1 }) => {
  const geo = useMemo(() => {
    const kurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.7, 0),
      new THREE.Vector3(2.4, 1.6, -0.5),
      new THREE.Vector3(4.6, 2.1, -0.9),
      new THREE.Vector3(6.0, 3.4, -0.9),
      new THREE.Vector3(6.3, 4.8, -0.5),
      new THREE.Vector3(5.6, 5.5, -0.1),
      new THREE.Vector3(4.9, 5.2, 0.1),
    ]);
    const seg = 90;
    const rad = 28;
    const rahmen = kurve.computeFrenetFrames(seg, false);
    const verts: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= seg; i++) {
      const t = i / seg;
      const p = kurve.getPointAt(t);
      const r = 1.7 * Math.pow(1 - t, 1.25) + 0.06;
      const N = rahmen.normals[i];
      const B = rahmen.binormals[i];
      for (let j = 0; j <= rad; j++) {
        const a = (j / rad) * Math.PI * 2;
        // leichte Rillen wie geflochten
        const rr = r * (1 + 0.04 * Math.sin(a * 8 + t * 40));
        verts.push(p.x + rr * (Math.cos(a) * N.x + Math.sin(a) * B.x), p.y + rr * (Math.cos(a) * N.y + Math.sin(a) * B.y), p.z + rr * (Math.cos(a) * N.z + Math.sin(a) * B.z));
      }
    }
    for (let i = 0; i < seg; i++)
      for (let j = 0; j < rad; j++) {
        const a = i * (rad + 1) + j;
        const b = a + rad + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group position={pos} rotation={[0, drehung, 0]} scale={skala}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color="#d8a945" metalness={0.45} roughness={0.38} side={THREE.DoubleSide} emissive="#3a2408" />
      </mesh>
      {/* dunkles Inneres der Öffnung */}
      <mesh position={[0.15, 1.7, 0]} rotation={[0, Math.PI / 2 + 0.1, 0]}>
        <circleGeometry args={[1.62, 28]} />
        <meshStandardMaterial color="#1c120a" roughness={1} />
      </mesh>
    </group>
  );
};

// ---------- Vorräte: Kisten, Fässer, Rucksäcke ----------
export const Vorraete: React.FC<{ mitte: V3; anzahl: number; seed: string; radius: number }> = ({ mitte, anzahl, seed, radius }) => (
  <group>
    {Array.from({ length: anzahl }).map((_, i) => {
      const w = random(`${seed}w${i}`) * Math.PI * 0.9 + Math.PI * 0.55;
      const d = 1.2 + random(`${seed}d${i}`) * radius;
      const x = mitte[0] + Math.cos(w) * d;
      const z = mitte[2] + Math.sin(w) * d * 0.8;
      const typ = Math.floor(random(`${seed}t${i}`) * 3);
      const rot = random(`${seed}r${i}`) * Math.PI;
      if (typ === 0)
        return (
          <mesh key={i} position={[x, 0.3, z]} rotation={[0, rot, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.6, 0.6, 0.6]} />
            <meshStandardMaterial color="#a98352" roughness={0.9} />
          </mesh>
        );
      if (typ === 1)
        return (
          <mesh key={i} position={[x, 0.4, z]} castShadow receiveShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.8, 14]} />
            <meshStandardMaterial color="#8a603a" roughness={0.8} />
          </mesh>
        );
      return (
        <mesh key={i} position={[x, 0.22, z]} rotation={[0, rot, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.45, 0.45, 0.28]} />
          <meshStandardMaterial color={random(`${seed}c${i}`) > 0.5 ? "#d9622b" : "#3f6f8c"} roughness={0.85} />
        </mesh>
      );
    })}
  </group>
);

// ---------- Startplattformen (Metallscheiben) ----------
export const Plattform: React.FC<{ pos: V3 }> = ({ pos }) => (
  <group position={pos}>
    <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.65, 0.72, 0.16, 32]} />
      <meshStandardMaterial color="#9aa3ad" metalness={0.85} roughness={0.3} />
    </mesh>
    <mesh position={[0, 0.165, 0]}>
      <cylinderGeometry args={[0.45, 0.45, 0.01, 32]} />
      <meshStandardMaterial color="#59646e" metalness={0.6} roughness={0.5} />
    </mesh>
  </group>
);

// ---------- Low-Poly-Bäume und Felsen ----------
export const Baum: React.FC<{ pos: V3; h: number; farbe: string }> = ({ pos, h, farbe }) => (
  <group position={pos}>
    <mesh position={[0, h * 0.15, 0]} castShadow>
      <cylinderGeometry args={[h * 0.04, h * 0.05, h * 0.3, 6]} />
      <meshStandardMaterial color="#4a3423" roughness={1} flatShading />
    </mesh>
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[0, h * (0.38 + i * 0.2), 0]} castShadow>
        <coneGeometry args={[h * (0.3 - i * 0.07), h * 0.38, 7]} />
        <meshStandardMaterial color={farbe} roughness={1} flatShading />
      </mesh>
    ))}
  </group>
);

export const Waldring: React.FC<{ mitte: V3; von: number; bis: number; anzahl: number; seed: string; flach: V3; radius: number }> = ({ mitte, von, bis, anzahl, seed, flach, radius }) => (
  <group>
    {Array.from({ length: anzahl }).map((_, i) => {
      const w = random(`${seed}w${i}`) * Math.PI * 2;
      const d = von + random(`${seed}d${i}`) * (bis - von);
      const x = mitte[0] + Math.cos(w) * d;
      const z = mitte[2] + Math.sin(w) * d;
      const h = 6 + random(`${seed}h${i}`) * 7;
      const farbe = ["#2f4a2a", "#3a5a30", "#26402a", "#44613a"][i % 4];
      return <Baum key={i} pos={[x, hoehe(x, z, flach, radius) - 0.2, z]} h={h} farbe={farbe} />;
    })}
  </group>
);

export const Felsen: React.FC<{ mitte: V3; von: number; bis: number; anzahl: number; seed: string; flach: V3; radius: number }> = ({ mitte, von, bis, anzahl, seed, flach, radius }) => (
  <group>
    {Array.from({ length: anzahl }).map((_, i) => {
      const w = random(`${seed}w${i}`) * Math.PI * 2;
      const d = von + random(`${seed}d${i}`) * (bis - von);
      const x = mitte[0] + Math.cos(w) * d;
      const z = mitte[2] + Math.sin(w) * d;
      const s = 0.4 + random(`${seed}s${i}`) * 1.4;
      return (
        <mesh key={i} position={[x, hoehe(x, z, flach, radius) + s * 0.3, z]} rotation={[random(`${seed}a${i}`) * 3, random(`${seed}b${i}`) * 3, 0]} scale={[s, s * 0.7, s]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#8a8070" roughness={1} flatShading />
        </mesh>
      );
    })}
  </group>
);

// ---------- Langer Schatten einer 2D-Figur auf dem Boden ----------
const schattenTextur = () => {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const v = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  v.addColorStop(0, "rgba(20,10,30,0.75)");
  v.addColorStop(0.6, "rgba(20,10,30,0.45)");
  v.addColorStop(1, "rgba(20,10,30,0)");
  g.fillStyle = v;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
};

/** Schatten, der von der Sonne weg zeigt (lange Abendschatten) */
export const FigurSchatten: React.FC<{ pos: V3; laenge: number; breite: number; richtung: number }> = ({ pos, laenge, breite, richtung }) => {
  const tex = useMemo(() => schattenTextur(), []);
  return (
    <group position={[pos[0], pos[1] + 0.02, pos[2]]} rotation={[0, richtung, 0]}>
      <mesh position={[0, 0, laenge / 2 - 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[breite, laenge]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} />
      </mesh>
    </group>
  );
};
