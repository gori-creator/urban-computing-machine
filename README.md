# Panem – Quarter Quells 🎬

Animierte TikTok-Serie (1080×1920, 30 fps): Wie würden die nächsten Quarter Quells aussehen?
Gebaut mit [Remotion](https://remotion.dev). Alles ist Code: Figuren, Kamera, Effekte, Untertitel.

| Folge | Quell | Thema | Befehl |
|---|---|---|---|
| 1 | 100. | Verbunden | `npm run render:folge1` · `npm run untertitel:folge1` |

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

## Video machen (Ablauf mit Stimme)

**1. Erst ohne Stimme rendern**, mit Untertiteln, als Vorlage zum Mitsprechen:
```
npm run render:folge1
```
Das Video liegt in `out/folge1.mp4`.

**2. Drübersprechen.** Spiel das Video ab und sprich dazu, am besten direkt im Videoschnitt-Programm (z. B. CapCut: Video importieren, Aufnahme-/Voiceover-Funktion nutzen). Dann startet deine Stimme exakt mit dem Video. Stimmfilter drauf, nur die Tonspur exportieren und als `public/folge1/stimme.mp3` speichern.

**3. Stimme eintragen.** In `src/folgen/folge1/skript.ts`:
```ts
stimme: "folge1/stimme.mp3",
```

**4. Untertitel an deine Stimme anpassen:**
```
npm run untertitel:folge1
```
Whisper (läuft lokal und kostenlos) erkennt, wann du welches Wort sagst. Die Untertitel erscheinen danach genau dann, wenn du das Wort sprichst. Der Text bleibt exakt der aus dem Skript, auch wenn Whisper sich verhört. Beim ersten Mal werden ca. 1,5 GB Sprachmodell geladen (in den Ordner `.whisper`, wird nicht hochgeladen).

**5. Prüfen und final rendern:**
```
npm run dev
npm run render:folge1
```

Falls deine Stimme insgesamt zu früh oder zu spät startet: In `skript.ts` `stimmeVersatz` anpassen (in Sekunden, z. B. `0.5` oder `-0.3`) und Schritt 4 nicht wiederholen, nur neu rendern.

> Die Sprachaufnahmen (`public/*/stimme.mp3`) werden nicht hochgeladen. Sie bleiben nur auf deinem PC.

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
scripts/
└── untertitel.ts          ← Spracherkennung → Wortzeiten
└── folgen/
    └── folge1/
        ├── skript.ts      ← Text, Timing, Ton  ← DAS änderst du
        ├── wortzeiten.json ← von "npm run untertitel:folge1" erzeugt
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
