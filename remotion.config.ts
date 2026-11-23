import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setJpegQuality(95);
Config.setCrf(17);
// Grafikkarte zum Zeichnen nutzen (wichtig für 3D und Leucht-Effekte).
// Windows/Mac: "angle" = GPU. Linux-Server ohne GPU: "swangle" (Software).
Config.setChromiumOpenGlRenderer(process.platform === "linux" ? "swangle" : "angle");
