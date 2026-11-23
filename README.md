# Panem – Quarter Quells 🎬

Animierte TikTok-Serie (1080×1920, 30 fps): Wie würden die nächsten Quarter Quells aussehen?
Gebaut mit [Remotion](https://remotion.dev). Alles ist Code: Figuren, Kamera, Effekte, Untertitel.

| Folge | Quell | Thema | Befehl |
|---|---|---|---|
| 1 | 100. | Verbunden | `npm run render:folge1` |

## Einmalig einrichten (Windows)

1. Node.js LTS installieren: https://nodejs.org
2. Repository klonen:
   ```
   git clone https://github.com/gori-creator/urban-computing-machine.git
   cd urban-computing-machine
   npm install
   ```
   Falls „running scripts is disabled“ kommt: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` eingeben und nochmal versuchen.

## Updates holen

Wenn Claude etwas geändert hat:
```
git pull
```
Danach einfach neu rendern.

## Video machen

1. **Stimme aufnehmen.** Den Text findest du in `src/folgen/folge1/skript.ts`. In Audacity tiefer machen (Effect → Pitch and Tempo → Change Pitch, ca. −3) und als `public/folge1/stimme.mp3` speichern.
2. **`src/folgen/folge1/skript.ts` öffnen**, `stimme: "folge1/stimme.mp3"` eintragen und die `dauer` jeder Szene an die Aufnahme anpassen (in Sekunden, mit Punkt: `3.5`).
3. **Vorschau ansehen:** `npm run dev` öffnet das Remotion Studio im Browser. Links wählst du die Folge aus.
4. **Rendern:** `npm run render:folge1`. Das Video liegt dann in `out/folge1.mp4`.

> Hinweis: Die Sprachaufnahmen (`public/*/stimme.mp3`) werden nicht hochgeladen (siehe `.gitignore`). Sie bleiben nur auf deinem PC.

## Aufbau

```
src/
├── Root.tsx               ← alle Folgen werden hier angemeldet
├── lib/                   ← gemeinsame Bausteine für alle Folgen
│   ├── folge.tsx          ← Szenen-Ablauf, Ton, Schriften
│   ├── figur.tsx          ← Tribut-Figuren mit Skelett & Posen
│   ├── verbindung.tsx     ← leuchtende Verbindungslinie
│   ├── effekte.tsx        ← Kamera, Partikel, Licht, Filmkorn
│   ├── untertitel.tsx     ← Untertitel im TikTok-Stil
│   └── mathe.ts           ← Hilfsfunktionen (Easing, Wackler, Rauschen)
└── folgen/
    └── folge1/
        ├── skript.ts      ← Text, Timing, Ton  ← DAS änderst du
        ├── Folge1.tsx     ← Szenen + Soundeffekte der Folge
        └── szenen/        ← Hook, Rückblick, Umschlag, Regel, Start, Jagd, Finale, Schluss
public/
├── fonts/                 ← Bebas Neue, Montserrat (SIL Open Font License)
├── sfx/                   ← Soundeffekte (Platzhalter, austauschbar)
└── folge1/                ← hier kommt deine stimme.mp3 rein
```

## In `skript.ts` einstellbar

- `text`: Untertitel. `*Wort*` wird gold hervorgehoben.
- `dauer`: Länge der Szene. Die Animation passt sich automatisch an.
- `soundeffekte`: an/aus
- `musikLautstaerke`: düstere Hintergrund-Atmosphäre (0 bis 1)

## Soundeffekte austauschen

Die Sounds in `public/sfx/` sind einfache, selbst erzeugte Platzhalter. Bessere, kostenlose Sounds gibt es z. B. auf pixabay.com/sound-effects. Einfach mit **gleichem Dateinamen** ersetzen.
