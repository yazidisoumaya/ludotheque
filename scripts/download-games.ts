/**
 * Télécharge le CSV BGG depuis GitHub et génère src/data/games.json
 * Contient les 10 000 jeux de société les plus populaires (par nombre de votes)
 *
 * Usage : npm run download:games
 */

import fs from "fs";
import path from "path";

const CSV_URL =
  "https://raw.githubusercontent.com/ThaWeatherman/scrapers/master/boardgamegeek/games.csv";
const OUTPUT_PATH = path.join(process.cwd(), "src", "data", "games.json");
const MAX_GAMES = 10_000;

type GameEntry = [number, string, number | null, number | null, number | null];

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function intOrNull(val: string): number | null {
  const n = parseInt(val, 10);
  return isNaN(n) || n === 0 ? null : n;
}

async function main() {
  console.log("📥 Téléchargement du CSV BGG...");
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`Échec du téléchargement : HTTP ${res.status}`);

  const text = await res.text();
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  console.log(`   ${lines.length - 1} lignes trouvées`);

  const header = parseCSVLine(lines[0]);
  const idx = {
    id: header.indexOf("id"),
    type: header.indexOf("type"),
    name: header.indexOf("name"),
    minPlayers: header.indexOf("minplayers"),
    maxPlayers: header.indexOf("maxplayers"),
    minAge: header.indexOf("minage"),
    usersRated: header.indexOf("users_rated"),
  };

  console.log("⚙️  Traitement des données...");

  type RawGame = GameEntry & { usersRated: number };
  const games: RawGame[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols[idx.type] !== "boardgame") continue;

    const id = parseInt(cols[idx.id], 10);
    const name = cols[idx.name];
    if (!id || !name) continue;

    const entry = [
      id,
      name,
      intOrNull(cols[idx.minPlayers]),
      intOrNull(cols[idx.maxPlayers]),
      intOrNull(cols[idx.minAge]),
    ] as unknown as RawGame;
    entry.usersRated = parseInt(cols[idx.usersRated], 10) || 0;
    games.push(entry);
  }

  // Dédupliquer par BGG ID (garder celui avec le plus de votes)
  const deduped = new Map<number, RawGame>();
  for (const g of games) {
    const existing = deduped.get(g[0] as number);
    if (!existing || g.usersRated > existing.usersRated) {
      deduped.set(g[0] as number, g);
    }
  }

  // Trier par popularité (plus de votes = plus connu), prendre les N premiers
  const sorted = [...deduped.values()].sort((a, b) => b.usersRated - a.usersRated);
  const top: GameEntry[] = sorted
    .slice(0, MAX_GAMES)
    .map(([id, name, minP, maxP, minA]) => [id, name, minP, maxP, minA]);

  const dir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(top));

  const sizeKB = Math.round(fs.statSync(OUTPUT_PATH).size / 1024);
  console.log(`✅ ${top.length} jeux sauvegardés → ${OUTPUT_PATH} (${sizeKB} KB)`);
  console.log(`   Exemple : ${JSON.stringify(top[0])}`);
  console.log(`   Exemple : ${JSON.stringify(top[1])}`);
  console.log(`   Exemple : ${JSON.stringify(top[2])}`);
}

main().catch((err) => {
  console.error("❌ Erreur :", err);
  process.exit(1);
});
