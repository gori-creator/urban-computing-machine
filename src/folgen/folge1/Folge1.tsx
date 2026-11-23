import React from "react";
import { FolgenVideo, Sfx, SzenenProps } from "../../lib/folge";
import { skript } from "./skript";
import { Hook } from "./szenen/Hook";
import { Rueckblick } from "./szenen/Rueckblick";
import { Umschlag } from "./szenen/Umschlag";
import { Regel } from "./szenen/Regel";
import { Start } from "./szenen/Start";
import { Jagd } from "./szenen/Jagd";
import { Finale } from "./szenen/Finale";
import { Schluss } from "./szenen/Schluss";

// Folge 1 – Die 100. Quarter Quell: "Verbunden"

const SZENEN: Record<string, React.FC<SzenenProps>> = {
  hook: Hook,
  rueckblick: Rueckblick,
  umschlag: Umschlag,
  regel: Regel,
  start: Start,
  jagd: Jagd,
  finale: Finale,
  schluss: Schluss,
};

const SOUNDS: Record<string, Sfx[]> = {
  hook: [{ datei: "kanone", bei: 0.09, laut: 1 }],
  rueckblick: [
    { datei: "whoosh", bei: 0.0, laut: 0.8 },
    { datei: "kanone", bei: 0.04, laut: 0.35 },
    { datei: "whoosh", bei: 0.33, laut: 0.8 },
    { datei: "kanone", bei: 0.37, laut: 0.35 },
    { datei: "whoosh", bei: 0.66, laut: 0.8 },
    { datei: "kanone", bei: 0.7, laut: 0.35 },
  ],
  umschlag: [
    { datei: "riser", bei: 0.0, laut: 0.8 },
    { datei: "einschlag", bei: 0.46, laut: 0.9 },
    { datei: "gong", bei: 0.47, laut: 0.45 },
  ],
  regel: [
    { datei: "kanone", bei: 0.6, laut: 0.9 },
    { datei: "kanone", bei: 0.7, laut: 0.9 },
  ],
  start: [
    { datei: "gong", bei: 0.22, laut: 0.9 },
    { datei: "herzschlag", bei: 0.42, laut: 0.9, schleife: 4 },
    { datei: "einschlag", bei: 0.5, laut: 0.7 },
  ],
  jagd: [
    { datei: "herzschlag", bei: 0.35, laut: 1, schleife: 6 },
    { datei: "pfeil", bei: 0.62, laut: 1 },
    { datei: "einschlag", bei: 0.82, laut: 1 },
  ],
  finale: [
    { datei: "herzschlag", bei: 0.1, laut: 0.9, schleife: 9 },
    { datei: "glitch", bei: 0.62, laut: 0.7 },
    { datei: "glitch", bei: 0.8, laut: 0.8 },
  ],
  schluss: [
    { datei: "kanone", bei: 0.02, laut: 0.8 },
    { datei: "glitch", bei: 0.55, laut: 0.9 },
  ],
};

export const Folge1: React.FC = () => <FolgenVideo skript={skript} szenen={SZENEN} sounds={SOUNDS} />;
export { skript as skriptFolge1 };
