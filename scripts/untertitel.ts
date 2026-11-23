// =============================================================
//  Untertitel an deine Stimme anpassen
//  Aufruf:  npm run untertitel:folge1
//
//  1. Wandelt public/<folge>/stimme.mp3 in WAV (16 kHz) um
//  2. Erkennt mit Whisper (läuft lokal, kostenlos) wann du welches Wort sagst
//  3. Ordnet die erkannten Wörter dem Text aus skript.ts zu
//     (der Text im Video bleibt also exakt so, wie er im Skript steht)
//  4. Schreibt src/folgen/<folge>/wortzeiten.json
//
//  Beim ersten Mal werden Whisper (~10 MB) und das Sprachmodell
//  (~1,5 GB) in den Ordner ".whisper" geladen. Das dauert einmalig etwas.
// =============================================================

import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
  type WhisperModel,
} from "@remotion/install-whisper-cpp";

const WHISPER_VERSION = "1.5.5";

type ErkanntesWort = { wort: string; start: number };
type SkriptWort = { szene: number; index: number; wort: string };

// ---------- Hilfsfunktionen ----------
export const normalisiere = (w: string) =>
  w
    .toLowerCase()
    .replace(/\*/g, "")
    .replace(/[^a-z0-9äöüß]/g, "");

const aehnlichkeit = (a: string, b: string) => {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return 1 - d[a.length][b.length] / Math.max(a.length, b.length);
};

/** Ordnet Skript-Wörter den erkannten Wörtern zu (Edit-Distanz-Alignment). Gibt Startzeit je Skript-Wort zurück. */
export const zuordnen = (skript: SkriptWort[], erkannt: ErkanntesWort[]): (number | null)[] => {
  const n = skript.length;
  const m = erkannt.length;
  const kosten = (i: number, j: number) => {
    const s = aehnlichkeit(normalisiere(skript[i].wort), normalisiere(erkannt[j].wort));
    return s >= 0.75 ? 0 : s >= 0.4 ? 0.6 : 1;
  };
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) dp[i][0] = i;
  for (let j = 1; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + kosten(i - 1, j - 1));

  const zeiten: (number | null)[] = Array(n).fill(null);
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (dp[i][j] === dp[i - 1][j - 1] + kosten(i - 1, j - 1)) {
      if (kosten(i - 1, j - 1) < 1) zeiten[i - 1] = erkannt[j - 1].start;
      i--;
      j--;
    } else if (dp[i][j] === dp[i - 1][j] + 1) i--;
    else j--;
  }
  return zeiten;
};

/** Fehlende Zeiten zwischen bekannten Nachbarn auffüllen */
export const luecken = (zeiten: (number | null)[]): number[] => {
  const bekannt = zeiten.map((z, i) => (z === null ? null : i)).filter((x): x is number => x !== null);
  if (!bekannt.length) throw new Error("Kein einziges Wort erkannt – ist die Aufnahme leer oder zu leise?");
  return zeiten.map((z, i) => {
    if (z !== null) return z;
    const vor = [...bekannt].reverse().find((k) => k < i);
    const nach = bekannt.find((k) => k > i);
    if (vor === undefined) return Math.max(0, zeiten[nach!]! - 0.3 * (nach! - i));
    if (nach === undefined) return zeiten[vor]! + 0.3 * (i - vor);
    return zeiten[vor]! + ((zeiten[nach]! - zeiten[vor]!) * (i - vor)) / (nach - vor);
  });
};

// ---------- Hauptprogramm ----------
const main = async () => {
  const folge = process.argv[2] ?? "folge1";
  const modell = (process.argv[3] ?? "medium") as WhisperModel;
  const root = process.cwd();
  const ordner = path.join(root, "public", folge);

  const audio = ["stimme.mp3", "stimme.wav", "stimme.m4a"].map((d) => path.join(ordner, d)).find((d) => fs.existsSync(d));
  if (!audio) throw new Error(`Keine Aufnahme gefunden. Leg sie als public/${folge}/stimme.mp3 ab.`);

  const { skript } = await import(pathToFileURL(path.join(root, "src", "folgen", folge, "skript.ts")).href);
  const skriptWoerter: SkriptWort[] = skript.szenen.flatMap((s: { text: string }, szene: number) =>
    s.text
      .split(/\s+/)
      .filter(Boolean)
      .map((wort: string, index: number) => ({ szene, index, wort })),
  );

  console.log(`🎙️  Aufnahme: ${path.relative(root, audio)}`);
  const wav = path.join(root, ".whisper", `${folge}-16k.wav`);
  fs.mkdirSync(path.dirname(wav), { recursive: true });
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  execFileSync(npx, ["remotion", "ffmpeg", "-y", "-loglevel", "error", "-i", audio, "-ar", "16000", "-ac", "1", wav], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  const whisperOrdner = path.join(root, ".whisper", "whisper.cpp");
  console.log("⬇️  Whisper vorbereiten (nur beim ersten Mal langsam) …");
  await installWhisperCpp({ to: whisperOrdner, version: WHISPER_VERSION, printOutput: false });
  await downloadWhisperModel({
    model: modell,
    folder: whisperOrdner,
    printOutput: false,
    onProgress: (geladen, gesamt) => process.stdout.write(`\r   Modell: ${Math.round((geladen / gesamt) * 100)} %   `),
  });

  console.log("\n🧠 Erkenne Wörter …");
  const ergebnis = await transcribe({
    inputPath: wav,
    whisperPath: whisperOrdner,
    whisperCppVersion: WHISPER_VERSION,
    model: modell,
    tokenLevelTimestamps: true,
    language: "de",
    splitOnWord: true,
    printOutput: false,
    onProgress: (p) => process.stdout.write(`\r   ${Math.round(p * 100)} %   `),
  });
  const { captions } = toCaptions({ whisperCppOutput: ergebnis });

  // Token zu Wörtern zusammenfassen (neues Wort beginnt mit Leerzeichen)
  const erkannt: ErkanntesWort[] = [];
  captions.forEach((c, i) => {
    const start = (c.timestampMs ?? c.startMs) / 1000;
    if (i === 0 || c.text.startsWith(" ") || !erkannt.length) erkannt.push({ wort: c.text.trim(), start });
    else erkannt[erkannt.length - 1].wort += c.text;
  });
  const sauber = erkannt.filter((w) => normalisiere(w.wort).length > 0);
  console.log(`\n📝 Erkannt: "${sauber.map((w) => w.wort).join(" ")}"`);

  const zeiten = luecken(zuordnen(skriptWoerter, sauber));
  const getroffen = zuordnen(skriptWoerter, sauber).filter((z) => z !== null).length;

  const woerter = skriptWoerter.map((w, i) => ({ szene: w.szene, index: w.index, wort: w.wort, start: Math.round(zeiten[i] * 100) / 100 }));
  const ziel = path.join(root, "src", "folgen", folge, "wortzeiten.json");
  fs.writeFileSync(
    ziel,
    JSON.stringify({ hinweis: `Automatisch erzeugt aus ${path.basename(audio)} am ${new Date().toLocaleString("de-DE")}`, woerter }, null, 2),
  );

  console.log(`✅ ${getroffen} von ${skriptWoerter.length} Wörtern direkt zugeordnet, Rest geschätzt.`);
  console.log(`   Gespeichert: ${path.relative(root, ziel)}`);

  // Szenen-Check: Wann beginnt jede Szene im Video, wann sprichst du sie?
  console.log("\n   Szene          Video   Stimme");
  let t = 0;
  skript.szenen.forEach((s: { id: string; dauer: number }, i: number) => {
    const erstes = woerter.find((w) => w.szene === i);
    const diff = erstes ? erstes.start - t : 0;
    const warn = Math.abs(diff) > 1.5 ? "  ⚠️ weicht stark ab" : "";
    console.log(`   ${s.id.padEnd(14)} ${t.toFixed(1).padStart(5)}s ${erstes ? erstes.start.toFixed(1).padStart(6) + "s" : "     –"}${warn}`);
    t += s.dauer;
  });
  console.log("\nJetzt in der Vorschau prüfen (npm run dev) und dann rendern.");
};

if (process.argv[1] && process.argv[1].includes("untertitel")) {
  main().catch((e) => {
    console.error("\n❌ " + (e instanceof Error ? e.message : String(e)));
    process.exit(1);
  });
}
