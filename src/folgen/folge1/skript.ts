// =============================================================
//  QUARTER QUELL – Folge 1: "Verbunden"
//  Diese Datei steuert Text, Timing und Ton des Videos.
// =============================================================
//
//  stimme:      Deine Sprachaufnahme im Ordner "public/folge1/" (z. B. "folge1/stimme.mp3").
//               null = Video ohne Stimme.
//  soundeffekte: true/false – Kanone, Gong, Herzschlag usw.
//  musikLautstaerke: Lautstärke der düsteren Hintergrund-Atmosphäre (0 bis 1)
//
//  szenen: Reihenfolge und Szenen-Typen bitte nicht ändern.
//    text  – Untertitel. *Wort* = wird gold hervorgehoben.
//    dauer – Sekunden. Passe sie an deine Aufnahme an.
//            Die Animation in der Szene streckt/staucht sich automatisch mit.

import type { Skript } from "../../lib/folge";

export const skript: Skript = {
  stimme: null,
  soundeffekte: true,
  musikLautstaerke: 0.35,
  szenen: [
    {
      id: "hook",
      dauer: 3,
      text: "Wie würde die *100.* Quarter Quell aussehen?",
    },
    {
      id: "rueckblick",
      dauer: 6,
      text: "Bei der *25.* wählten die Distrikte. Bei der *50.* doppelt so viele Tribute. Bei der *75.* mussten die Sieger zurück.",
    },
    {
      id: "umschlag",
      dauer: 5,
      text: "Und jetzt … die *hundertste.*",
    },
    {
      id: "regel",
      dauer: 7,
      text: "Die zwei Tribute jedes Distrikts sind *verbunden.* Stirbt einer, stirbt auch der andere.",
    },
    {
      id: "start",
      dauer: 12,
      text: "Tag eins. *Lira* ist schnell genug für das Füllhorn. Aber *Tam* ist zwölf. Wenn sie losrennt und er zurückbleibt … rennt sie in ihren *eigenen Tod.*",
    },
    {
      id: "jagd",
      dauer: 11,
      text: "Die Stärksten haben's sofort kapiert. Sie jagen nicht die Starken. Sie jagen die *Kleinen.* Ein Treffer auf Tam … und *zwei Kanonen.*",
    },
    {
      id: "finale",
      dauer: 9,
      text: "Tag neun. Nur noch zwei leben: Lira und Tam. Und das Kapitol wartet auf einen Sieger … den es *nicht geben kann.*",
    },
    {
      id: "schluss",
      dauer: 8,
      text: "Was passiert jetzt? Schreib's in die Kommentare, und folg für die *125.*",
    },
  ],
};
