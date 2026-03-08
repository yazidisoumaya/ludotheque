/**
 * Pousse le schéma Prisma sur Turso.
 * Usage : npx tsx scripts/push-turso.ts
 * Requiert TURSO_DATABASE_URL et TURSO_AUTH_TOKEN dans .env
 */
import "dotenv/config";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("❌  TURSO_DATABASE_URL ou TURSO_AUTH_TOKEN manquant dans .env");
  process.exit(1);
}

const client = createClient({ url, authToken });

// Toutes les migrations dans l'ordre
const migrations = [
  // Migration 1 — init
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "minPlayers" INTEGER,
    "maxPlayers" INTEGER,
    "minAge" INTEGER,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Game_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Exchange" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requesterId" INTEGER NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Exchange_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Exchange_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Exchange_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  // Migration 2 — add imageUrl
  `ALTER TABLE "Game" ADD COLUMN "imageUrl" TEXT`,
];

async function main() {
  console.log(`🔗  Connexion à ${url}`);

  for (const sql of migrations) {
    const preview = sql.trim().split("\n")[0].substring(0, 60);
    try {
      await client.execute(sql);
      console.log(`  ✅  ${preview}...`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Ignorer "duplicate column" (ALTER TABLE déjà appliqué)
      if (msg.includes("duplicate column") || msg.includes("already exists")) {
        console.log(`  ⏭️   Déjà appliqué : ${preview}...`);
      } else {
        console.error(`  ❌  Erreur : ${msg}`);
        console.error(`      SQL : ${preview}...`);
      }
    }
  }

  console.log("\n✅  Schéma Turso à jour !");
  client.close();
}

main();
