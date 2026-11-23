// Testszene: Start am Füllhorn in 3D (nur zum Ausprobieren des Looks)
import type { Skript } from "../../lib/folge";

export const skript: Skript = {
  stimme: null,
  stimmeVersatz: 0,
  soundeffekte: true,
  musikLautstaerke: 0.35,
  szenen: [
    {
      id: "start",
      dauer: 12,
      text: "Tag eins. *Lira* ist schnell genug für das Füllhorn. Aber *Tam* ist zwölf. Wenn sie losrennt und er zurückbleibt … rennt sie in ihren *eigenen Tod.*",
    },
  ],
};
