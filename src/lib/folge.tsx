import React from "react";
import {
  AbsoluteFill,
  Audio,
  cancelRender,
  continueRender,
  delayRender,
  Sequence,
  staticFile,
} from "remotion";
import { Blitz, FilmLook } from "./effekte";
import { Untertitel } from "./untertitel";

// =============================================================
//  Gemeinsamer Aufbau für jede Folge:
//  Szenen nacheinander, Untertitel, Schnitt-Blitze, Filmlook, Ton.
// =============================================================

export const FPS = 30;
export const BREITE = 1080;
export const HOEHE = 1920;

export type SzenenProps = { dauer: number };
export type Szene = { id: string; dauer: number; text: string };
export type Skript = {
  stimme: string | null;
  soundeffekte: boolean;
  musikLautstaerke: number;
  szenen: Szene[];
};
/** Soundeffekt: bei = Anteil der Szenendauer (0..1), schleife = wie oft wiederholen */
export type Sfx = { datei: string; bei: number; laut?: number; schleife?: number };

// Schriften lokal laden (funktioniert auch offline)
const ladeSchrift = (name: string, datei: string) => {
  const h = delayRender(`Schrift ${name}`);
  const f = new FontFace(name, `url(${staticFile(datei)})`);
  f.load()
    .then(() => {
      (document.fonts as unknown as { add: (f: FontFace) => void }).add(f);
      continueRender(h);
    })
    .catch((e) => cancelRender(e));
};
ladeSchrift("Bebas Neue", "fonts/BebasNeue.woff2");
ladeSchrift("Montserrat Black", "fonts/Montserrat-Black.woff2");

export const szenenPlan = (skript: Skript) => {
  let start = 0;
  return skript.szenen.map((s) => {
    const frames = Math.round(s.dauer * FPS);
    const e = { ...s, start, frames };
    start += frames;
    return e;
  });
};

export const gesamtDauer = (skript: Skript) =>
  szenenPlan(skript).reduce((a, s) => a + s.frames, 0);

export const FolgenVideo: React.FC<{
  skript: Skript;
  szenen: Record<string, React.FC<SzenenProps>>;
  sounds: Record<string, Sfx[]>;
}> = ({ skript, szenen, sounds }) => {
  const plan = szenenPlan(skript);
  return (
    <AbsoluteFill style={{ background: "black" }}>
      {plan.map((s, i) => {
        const Komponente = szenen[s.id];
        if (!Komponente) throw new Error(`Szene "${s.id}" gibt es nicht. Vorhanden: ${Object.keys(szenen).join(", ")}`);
        return (
          <Sequence key={s.id + i} from={s.start} durationInFrames={s.frames} name={s.id}>
            <Komponente dauer={s.frames} />
            {i > 0 && <Blitz start={0} dauer={6} staerke={0.55} />}
            <Untertitel text={s.text} dauerFrames={s.frames} />
          </Sequence>
        );
      })}

      <FilmLook />

      <Audio src={staticFile("sfx/drone.mp3")} volume={skript.musikLautstaerke} />
      {skript.soundeffekte &&
        plan.flatMap((s) =>
          (sounds[s.id] ?? []).flatMap((fx, j) =>
            Array.from({ length: fx.schleife ?? 1 }).map((_, k) => (
              <Sequence
                key={`${s.id}-${j}-${k}`}
                from={s.start + Math.round(fx.bei * s.frames) + k * 27}
                durationInFrames={90}
              >
                <Audio src={staticFile(`sfx/${fx.datei}.mp3`)} volume={fx.laut ?? 1} />
              </Sequence>
            )),
          ),
        )}
      {skript.stimme && <Audio src={staticFile(skript.stimme)} />}
    </AbsoluteFill>
  );
};
