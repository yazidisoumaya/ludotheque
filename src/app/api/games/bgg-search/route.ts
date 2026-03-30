import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import gamesJson from "@/data/games.json";

// ─── Local games index (CSV BGG, top 10 000 jeux) ────────────────────────────

type LocalGame = [number, string, number | null, number | null, number | null];
const GAMES = gamesJson as unknown as LocalGame[];

function searchLocalData(q: string): LocalGame[] {
  const lower = q.toLowerCase();
  const results: LocalGame[] = [];
  for (const game of GAMES) {
    if ((game[1] as string).toLowerCase().includes(lower)) {
      results.push(game);
      if (results.length >= 8) break;
    }
  }
  return results;
}

// ─── BGG (via token officiel) ─────────────────────────────────────────────────

const BGG_API = "https://boardgamegeek.com/xmlapi2";
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function getBggHeaders(): Record<string, string> | null {
  if (process.env.BGG_API_KEY) {
    return {
      "User-Agent": "LudothequeApp/1.0",
      "Authorization": `Bearer ${process.env.BGG_API_KEY}`,
    };
  }
  if (process.env.BGG_SESSION_COOKIE) {
    return {
      "User-Agent": "LudothequeApp/1.0",
      "Cookie": process.env.BGG_SESSION_COOKIE,
    };
  }
  return null;
}

const BGG_CATEGORY_MAP: Record<string, string> = {
  "Abstract Strategy": "Réflexion",
  "Card Game": "Cartes",
  "Dice": "Dés",
  "Party Game": "Ambiance",
  "Family Game": "Famille",
  "Cooperative Game": "Coopératif",
  "Deduction": "Réflexion",
  "Economic": "Stratégie",
  "Negotiation": "Stratégie",
  "Word Game": "Ambiance",
  "Negotiation Game": "Stratégie",
  "Strategy Game": "Stratégie",
};

async function searchBGG(q: string) {
  const headers = getBggHeaders();
  if (!headers) return null;

  const searchRes = await fetch(`${BGG_API}/search?query=${encodeURIComponent(q)}&type=boardgame`, {
    headers, next: { revalidate: 3600 },
  });
  if (!searchRes.ok) return null;

  const searchXml = await searchRes.text();
  const searchData = parser.parse(searchXml);
  const rawItems = searchData?.items?.item;
  if (!rawItems) return [];

  const items = Array.isArray(rawItems) ? rawItems : [rawItems];
  const topIds = items.slice(0, 8).map((item: Record<string, unknown>) => item["@_id"]).filter(Boolean);
  if (topIds.length === 0) return [];

  const detailRes = await fetch(`${BGG_API}/thing?id=${topIds.join(",")}&stats=1`, { headers });
  if (!detailRes.ok) return [];

  const detailXml = await detailRes.text();
  const detailData = parser.parse(detailXml);
  const rawEntities = detailData?.items?.item;
  if (!rawEntities) return [];

  const entities = Array.isArray(rawEntities) ? rawEntities : [rawEntities];
  return entities.map((entity: Record<string, unknown>) => {
    const id = String(entity["@_id"]);
    const names = entity.name;
    const nameArr = Array.isArray(names) ? names : [names];
    const primary = nameArr.find((n: Record<string, unknown>) => n["@_type"] === "primary");
    const title = String(primary?.["@_value"] || nameArr[0]?.["@_value"] || "");
    if (!title) return null;

    const thumbnail = entity.thumbnail ? String(entity.thumbnail) : null;
    const yearPublished = entity.yearpublished
      ? String((entity.yearpublished as Record<string, unknown>)["@_value"] ?? "") : null;
    const minPlayers = entity.minplayers
      ? parseInt(String((entity.minplayers as Record<string, unknown>)["@_value"]), 10) || null : null;
    const maxPlayers = entity.maxplayers
      ? parseInt(String((entity.maxplayers as Record<string, unknown>)["@_value"]), 10) || null : null;
    const minAge = entity.minage
      ? parseInt(String((entity.minage as Record<string, unknown>)["@_value"]), 10) || null : null;

    const linkArr = Array.isArray(entity.link) ? entity.link : entity.link ? [entity.link] : [];
    const cats = (linkArr as Record<string, unknown>[])
      .filter((l) => l["@_type"] === "boardgamecategory")
      .map((l) => String(l["@_value"]));
    const category = cats.map((c) => BGG_CATEGORY_MAP[c]).find(Boolean) ?? (cats.length ? "Autre" : "Autre");

    return { bggId: id, title, thumbnail: thumbnail?.startsWith("http") ? thumbnail : null,
      description: null, minPlayers, maxPlayers, minAge, yearPublished, category };
  }).filter(Boolean);
}

// ─── Geekdo enrichment ───────────────────────────────────────────────────────

const GEEKDO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  "Accept": "application/json",
};

async function fetchGeekdoDetails(bggId: number) {
  try {
    const res = await fetch(
      `https://api.geekdo.com/api/geekitems?objecttype=thing&objectid=${bggId}`,
      { headers: GEEKDO_HEADERS, signal: AbortSignal.timeout(3000), next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const item = data?.item;
    if (!item) return null;

    const cats = (item.links?.boardgamecategory || []) as { name: string }[];
    const category = cats.map((c) => BGG_CATEGORY_MAP[c.name]).find(Boolean) ?? "Autre";

    return {
      thumbnail: (item.imageurl as string) || null,
      description: (item.short_description as string) || null,
      minPlayers: item.minplayers ? parseInt(String(item.minplayers), 10) || null : null,
      maxPlayers: item.maxplayers ? parseInt(String(item.maxplayers), 10) || null : null,
      minAge: item.minage ? parseInt(String(item.minage), 10) || null : null,
      yearPublished: item.yearpublished ? String(item.yearpublished) : null,
      category,
    };
  } catch {
    return null;
  }
}

// ─── Wikidata (fallback pour les jeux non trouvés en local) ──────────────────

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const COMMONS_FILE_PATH = "https://commons.wikimedia.org/wiki/Special:FilePath/";

const WIKIDATA_CATEGORY_MAP: Record<string, string> = {
  Q131436: "Plateau", Q1316979: "Cartes", Q17517811: "Plateau",
  Q142714: "Réflexion", Q1150710: "Coopératif", Q788553: "Famille",
  Q1906091: "Ambiance", Q185029: "Dés", Q11410: "Autre",
};
const GAME_TYPE_IDS = new Set(Object.keys(WIKIDATA_CATEGORY_MAP));
const EXCLUDE_PHRASES = ["video game", "jeu vidéo", "computer game", "mobile game"];

type WikiClaim = { mainsnak: { datavalue?: { value: unknown } } };
type WikiClaimsMap = Record<string, WikiClaim[]>;

function wikidataCategory(claims: WikiClaimsMap): string {
  const all = [...(claims.P31 || []), ...(claims.P136 || [])];
  for (const c of all) {
    const id = (c?.mainsnak?.datavalue?.value as { id?: string } | undefined)?.id;
    if (id && WIKIDATA_CATEGORY_MAP[id]) return WIKIDATA_CATEGORY_MAP[id];
  }
  return "Autre";
}

function isGameEntity(claims: WikiClaimsMap): boolean {
  return [...(claims.P31 || []), ...(claims.P136 || [])].some((c) => {
    const id = (c?.mainsnak?.datavalue?.value as { id?: string } | undefined)?.id;
    return id ? GAME_TYPE_IDS.has(id) : false;
  });
}

function getInt(claims: WikiClaimsMap, prop: string): number | null {
  const amount = (claims[prop]?.[0]?.mainsnak?.datavalue?.value as { amount?: string } | undefined)?.amount;
  const n = parseInt(amount ?? "", 10);
  return isNaN(n) ? null : Math.abs(n);
}

function getImage(claims: WikiClaimsMap): string | null {
  const f = claims.P18?.[0]?.mainsnak?.datavalue?.value;
  if (!f || typeof f !== "string") return null;
  return `${COMMONS_FILE_PATH}${encodeURIComponent(f.replace(/ /g, "_"))}?width=300`;
}

function getYear(claims: WikiClaimsMap): string | null {
  const t = (claims.P577?.[0]?.mainsnak?.datavalue?.value as { time?: string } | undefined)?.time;
  return t ? t.slice(1, 5) : null;
}

async function wikidataSearch(q: string, language: string): Promise<{ id: string; label?: string; description?: string }[]> {
  const searchUrl = new URL(WIKIDATA_API);
  Object.entries({ action: "wbsearchentities", search: q, language,
    type: "item", format: "json", limit: "50", uselang: language })
    .forEach(([k, v]) => searchUrl.searchParams.set(k, v));

  const res = await fetch(searchUrl.toString(), {
    headers: { "User-Agent": "LudothequeApp/1.0" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.search || [];
}

async function searchWikidata(q: string) {
  type WResult = { id: string; label?: string; description?: string };

  const [frResults, enResults] = await Promise.all([
    wikidataSearch(q, "fr"),
    wikidataSearch(q, "en"),
  ]);

  const seen = new Set<string>();
  const candidates: WResult[] = [];
  for (const item of [...frResults, ...enResults]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      candidates.push(item);
    }
  }

  const filtered = candidates.filter((item) =>
    !EXCLUDE_PHRASES.some((p) => (item.description || "").toLowerCase().includes(p))
  );
  if (!filtered.length) return [];

  const topIds = filtered.slice(0, 15).map((i) => i.id);

  const detailUrl = new URL(WIKIDATA_API);
  Object.entries({ action: "wbgetentities", ids: topIds.join("|"),
    format: "json", props: "claims|labels|descriptions", languages: "fr|en" })
    .forEach(([k, v]) => detailUrl.searchParams.set(k, v));

  const detailRes = await fetch(detailUrl.toString(), {
    headers: { "User-Agent": "LudothequeApp/1.0" },
    next: { revalidate: 3600 },
  });
  if (!detailRes.ok) return [];

  const detailData = await detailRes.json();
  type WLabels = Record<string, { value: string }>;
  const entities: Record<string, { missing?: boolean; claims?: WikiClaimsMap; labels?: WLabels; descriptions?: WLabels }>
    = detailData.entities || {};

  return topIds.map((id) => {
    const entity = entities[id];
    if (!entity || entity.missing) return null;
    const claims = entity.claims || {};
    if (!isGameEntity(claims)) return null;
    const labels = entity.labels || {};
    const title = labels.fr?.value || labels.en?.value || candidates.find((c) => c.id === id)?.label || "";
    if (!title) return null;
    const descriptions = entity.descriptions || {};
    return {
      bggId: id, title, thumbnail: getImage(claims),
      description: descriptions.fr?.value || descriptions.en?.value || null,
      minPlayers: getInt(claims, "P1853"), maxPlayers: getInt(claims, "P1854"),
      minAge: getInt(claims, "P2576"), yearPublished: getYear(claims),
      category: wikidataCategory(claims),
    };
  }).filter(Boolean);
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 2) return NextResponse.json([]);

    // 1. BGG officiel (si API key ou session cookie configuré)
    const hasBggAuth = !!(process.env.BGG_API_KEY || process.env.BGG_SESSION_COOKIE);
    if (hasBggAuth) {
      const results = await searchBGG(q);
      if (results !== null) return NextResponse.json(results);
    }

    // 2. Index local (CSV BGG, 10 000 jeux) + enrichissement geekdo
    const localMatches = searchLocalData(q);
    if (localMatches.length > 0) {
      const enriched = await Promise.all(
        localMatches.map(async ([id, name, minP, maxP, minA]) => {
          const details = await fetchGeekdoDetails(id);
          return {
            bggId: String(id),
            title: name as string,
            thumbnail: details?.thumbnail ?? null,
            description: details?.description ?? null,
            minPlayers: details?.minPlayers ?? minP,
            maxPlayers: details?.maxPlayers ?? maxP,
            minAge: details?.minAge ?? minA,
            yearPublished: details?.yearPublished ?? null,
            category: details?.category ?? "Autre",
          };
        })
      );
      return NextResponse.json(enriched);
    }

    // 3. Fallback Wikidata (jeux non anglophones ou absents de l'index local)
    const wikidataResults = await searchWikidata(q);
    return NextResponse.json(wikidataResults);
  } catch (error) {
    console.error("[GET /api/games/bgg-search]", error);
    return NextResponse.json({ error: "Erreur serveur", details: String(error) }, { status: 500 });
  }
}
