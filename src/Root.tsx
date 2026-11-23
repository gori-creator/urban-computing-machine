import React from "react";
import { Composition, Folder } from "remotion";
import { BREITE, FPS, HOEHE, gesamtDauer } from "./lib/folge";
import { Folge1, skriptFolge1 } from "./folgen/folge1/Folge1";

// Jede neue Folge bekommt hier eine eigene <Composition>.
export const RemotionRoot: React.FC = () => (
  <Folder name="Quarter-Quells">
    <Composition
      id="Folge1-Verbunden"
      component={Folge1}
      durationInFrames={gesamtDauer(skriptFolge1)}
      fps={FPS}
      width={BREITE}
      height={HOEHE}
    />
  </Folder>
);
