import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

// ─── BGG (via authenticated session) ────────────────────────────────────────

const BGG_API = "https://boardgamegeek.com/xmlapi2";
const BGG_LOGIN_URL = "https://boardgamegeek.com/login/api/v1";
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

let bggSessionCookie: string | null = null;

async function getBggSession(): Promise<string | null> {
  // Option 1: pre-configured session cookie from browser (most reliable)
  if (process.env.BGG_SESSION_COOKIE) return process.env.BGG_SESSION_COOKIE;

  // Option 2: login via API (blocked by Cloudflare in most environments)
  const username = process.env.BGG_USERNAME;
  const password = process.env.BGG_PASSWORD;
  if (!username || !password) return null;

  const res = await fetch(BGG_LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://boardgamegeek.com" },
    body: JSON.stringify({ credentials: { username, password } }),
  });

  if (!res.ok) return null;

  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) return null;

  const cookies = setCookie
    .split(/,(?=[^ ])/)
    .map((c) => c.split(";")[0].trim())
    .filter((c) => c.startsWith("bggusername=") || c.startsWith("SessionID="))
    .join("; ");

  return cookies || null;
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
};

async function searchBGG(q: string) {
  if (!bggSessionCookie) bggSessionCookie = await getBggSession();
  if (!bggSessionCookie) return null; // No credentials configured

  const headers: Record<string, string> = {
    "User-Agent": "LudothequeApp/1.0",
    Cookie: bggSessionCookie,
  };

  const searchRes = await fetch(`${BGG_API}/search?query=${encodeURIComponent(q)}&type=boardgame`, {
    headers,
    next: { revalidate: 3600 },
  });

  // Refresh session on 401 and retry once
  if (searchRes.status === 401) {
    bggSessionCookie = await getBggSession();
    if (!bggSessionCookie) return null;
    headers.Cookie = bggSessionCookie;
    const retry = await fetch(`${BGG_API}/search?query=${encodeURIComponent(q)}&type=boardgame`, { headers });
    if (!retry.ok) return null;
  } else if (!searchRes.ok) {
    return null;
  }

  const finalSearchRes = searchRes.status === 401
    ? await fetch(`${BGG_API}/search?query=${encodeURIComponent(q)}&type=boardgame`, { headers })
    : searchRes;

  const searchXml = await finalSearchRes.text();
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
    const category = cats.map((c) => BGG_CATEGORY_MAP[c]).find(Boolean) ?? (cats.length ? "Plateau" : "Autre");

    return { bggId: id, title, thumbnail: thumbnail?.startsWith("http") ? thumbnail : null,
      description: null, minPlayers, maxPlayers, minAge, yearPublished, category };
  }).filter(Boolean);
}

// ─── Wikidata (fallback) ─────────────────────────────────────────────────────

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

async function searchWikidata(q: string) {
  const searchUrl = new URL(WIKIDATA_API);
  Object.entries({ action: "wbsearchentities", search: q, language: "fr",
    type: "item", format: "json", limit: "50", uselang: "fr" })
    .forEach(([k, v]) => searchUrl.searchParams.set(k, v));

  const searchRes = await fetch(searchUrl.toString(), {
    headers: { "User-Agent": "LudothequeApp/1.0" },
    next: { revalidate: 3600 },
  });
  if (!searchRes.ok) return [];

  const searchData = await searchRes.json();
  type WResult = { id: string; label?: string; description?: string };
  const candidates = (searchData.search as WResult[] || []).filter((item) =>
    !EXCLUDE_PHRASES.some((p) => (item.description || "").toLowerCase().includes(p))
  );
  if (!candidates.length) return [];

  const topIds = candidates.slice(0, 10).map((i) => i.id);

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

    // Use BGG if credentials are configured, otherwise fall back to Wikidata
    const hasBggCredentials = !!(process.env.BGG_USERNAME && process.env.BGG_PASSWORD);
    const results = hasBggCredentials ? await searchBGG(q) : null;

    if (results !== null) {
      return NextResponse.json(results);
    }

    // Fallback: Wikidata
    const wikidataResults = await searchWikidata(q);
    return NextResponse.json(wikidataResults);
  } catch (error) {
    console.error("[GET /api/games/bgg-search]", error);
    return NextResponse.json({ error: "Erreur serveur", details: String(error) }, { status: 500 });
  }
}
