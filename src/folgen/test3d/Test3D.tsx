import React from "react";
import { FolgenVideo, Sfx } from "../../lib/folge";
import { skript } from "./skript";
import { Start3D } from "./Start3D";

const SOUNDS: Record<string, Sfx[]> = {
  start: [
    { datei: "gong", bei: 0.22, laut: 0.9 },
    { datei: "herzschlag", bei: 0.42, laut: 0.9, schleife: 4 },
    { datei: "einschlag", bei: 0.5, laut: 0.7 },
  ],
};

export const Test3D: React.FC = () => <FolgenVideo skript={skript} szenen={{ start: Start3D }} sounds={SOUNDS} />;
export { skript as skriptTest3D };
