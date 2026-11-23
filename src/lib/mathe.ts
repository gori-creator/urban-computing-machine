import { random } from "remotion";

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Fortschritt 0..1 zwischen start und ende */
export const prog = (x: number, start: number, ende: number) =>
  clamp((x - start) / (ende - start));

export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t: number) => t * t * t;
export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
/** Überschwingen – für "Plopp"-Effekte */
export const easeBack = (t: number) => {
  const c1 = 2.2;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/** Weiches Rauschen (deterministisch, gleich bei jedem Render) */
export const rauschen = (seed: string, x: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const s = f * f * (3 - 2 * f);
  const a = random(`${seed}-${i}`) * 2 - 1;
  const b = random(`${seed}-${i + 1}`) * 2 - 1;
  return lerp(a, b, s);
};

/** Kamerawackler: starker Ausschlag bei `treffer`, klingt dann ab */
export const wackler = (frame: number, treffer: number, staerke = 30, abklingen = 14) => {
  const d = frame - treffer;
  if (d < 0 || d > abklingen * 3) return { x: 0, y: 0, r: 0 };
  const k = Math.exp(-d / abklingen) * staerke;
  return {
    x: rauschen(`wx${treffer}`, d * 0.9) * k,
    y: rauschen(`wy${treffer}`, d * 0.9) * k,
    r: rauschen(`wr${treffer}`, d * 0.7) * k * 0.04,
  };
};

export const summeWackler = (...w: { x: number; y: number; r: number }[]) =>
  w.reduce((a, b) => ({ x: a.x + b.x, y: a.y + b.y, r: a.r + b.r }), { x: 0, y: 0, r: 0 });
