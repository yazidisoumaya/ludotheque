import { NextResponse } from "next/server";

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const COMMONS_FILE_PATH = "https://commons.wikimedia.org/wiki/Special:FilePath/";

// Wikidata property IDs
const PROPS = {
  INSTANCE_OF: "P31",
  GENRE: "P136",
  IMAGE: "P18",
  MIN_PLAYERS: "P1853",
  MAX_PLAYERS: "P1854",
  MIN_AGE: "P2576",
  PUB_DATE: "P577",
};

// Wikidata entity IDs for game types → local categories
const CATEGORY_MAP: Record<string, string> = {
  Q131436: "Plateau",     // board game
  Q1316979: "Cartes",     // card game
  Q17517811: "Plateau",   // tabletop game
  Q142714: "Réflexion",   // abstract strategy game
  Q1150710: "Coopératif", // cooperative game
  Q788553: "Famille",     // family game
  Q1906091: "Ambiance",   // party game
  Q185029: "Dés",         // dice game
  Q11410: "Autre",        // game (generic)
};

type WikiClaim = {
  mainsnak: {
    datavalue?: {
      value: unknown;
    };
  };
};

type WikiClaimsMap = Record<string, WikiClaim[]>;

function getCategory(claims: WikiClaimsMap): string {
  const allClaims = [
    ...(claims[PROPS.INSTANCE_OF] || []),
    ...(claims[PROPS.GENRE] || []),
  ];
  for (const claim of allClaims) {
    const val = claim?.mainsnak?.datavalue?.value as { id?: string } | undefined;
    const id = val?.id;
    if (id && CATEGORY_MAP[id]) return CATEGORY_MAP[id];
  }
  return "Autre";
}

function getIntValue(claims: WikiClaimsMap, property: string): number | null {
  const claim = claims[property]?.[0];
  const amount = (claim?.mainsnak?.datavalue?.value as { amount?: string } | undefined)?.amount;
  if (!amount) return null;
  const num = parseInt(amount, 10);
  return isNaN(num) ? null : Math.abs(num);
}

function getImageUrl(claims: WikiClaimsMap): string | null {
  const claim = claims[PROPS.IMAGE]?.[0];
  const filename = claim?.mainsnak?.datavalue?.value;
  if (!filename || typeof filename !== "string") return null;
  const normalized = filename.replace(/ /g, "_");
  return `${COMMONS_FILE_PATH}${encodeURIComponent(normalized)}?width=300`;
}

function getYearPublished(claims: WikiClaimsMap): string | null {
  const claim = claims[PROPS.PUB_DATE]?.[0];
  const time = (claim?.mainsnak?.datavalue?.value as { time?: string } | undefined)?.time;
  if (!time) return null;
  // Format: "+2008-01-01T00:00:00Z"
  return time.slice(1, 5);
}

// Multi-word phrases that strongly indicate a board/card/tabletop game
const GAME_INCLUDE_PHRASES = [
  "board game", "card game", "tabletop game", "party game", "dice game",
  "tile game", "jeu de société", "jeu de plateau", "jeu de cartes",
  "jeu d'ambiance", "jeu de dés", "jeu coopératif",
  "brettspiel", "gesellschaftsspiel",
];

// Descriptions containing these → exclude (video games, etc.)
const GAME_EXCLUDE_PHRASES = ["video game", "jeu vidéo", "computer game", "mobile game"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    // Step 1: Search Wikidata entities
    const searchUrl = new URL(WIKIDATA_API);
    const searchParams2: Record<string, string> = {
      action: "wbsearchentities",
      search: q,
      language: "fr",
      type: "item",
      format: "json",
      limit: "20",
    };
    Object.entries(searchParams2).forEach(([k, v]) => searchUrl.searchParams.set(k, v));

    const searchRes = await fetch(searchUrl.toString(), {
      headers: { "User-Agent": "LudothequeApp/1.0 (educational project)" },
      next: { revalidate: 3600 },
    });

    if (!searchRes.ok) {
      return NextResponse.json({ error: "Wikidata search failed" }, { status: 502 });
    }

    const searchData = await searchRes.json();

    // Filter to only board/card/tabletop game entities
    type WikiSearchResult = { id: string; label?: string; description?: string };
    const candidates = (searchData.search as WikiSearchResult[] || []).filter((item) => {
      const text = `${item.description || ""} ${item.label || ""}`.toLowerCase();
      // Exclude video games and other digital games
      if (GAME_EXCLUDE_PHRASES.some((phrase) => text.includes(phrase))) return false;
      // Require a board/tabletop game keyword phrase
      return GAME_INCLUDE_PHRASES.some((phrase) => text.includes(phrase));
    });

    if (candidates.length === 0) return NextResponse.json([]);

    const topIds = candidates.slice(0, 6).map((item) => item.id);

    // Step 2: Fetch entity details (claims, labels, descriptions)
    const detailUrl = new URL(WIKIDATA_API);
    const detailParams: Record<string, string> = {
      action: "wbgetentities",
      ids: topIds.join("|"),
      format: "json",
      props: "claims|labels|descriptions",
      languages: "fr|en",
    };
    Object.entries(detailParams).forEach(([k, v]) => detailUrl.searchParams.set(k, v));

    const detailRes = await fetch(detailUrl.toString(), {
      headers: { "User-Agent": "LudothequeApp/1.0 (educational project)" },
      next: { revalidate: 3600 },
    });

    if (!detailRes.ok) {
      return NextResponse.json({ error: "Wikidata details failed" }, { status: 502 });
    }

    const detailData = await detailRes.json();
    type WikiEntityLabels = Record<string, { value: string }>;
    const entities: Record<string, {
      missing?: boolean;
      claims?: WikiClaimsMap;
      labels?: WikiEntityLabels;
      descriptions?: WikiEntityLabels;
    }> = detailData.entities || {};

    const results = topIds
      .map((id) => {
        const entity = entities[id];
        if (!entity || entity.missing) return null;

        const claims: WikiClaimsMap = entity.claims || {};
        const labels: WikiEntityLabels = entity.labels || {};
        const descriptions: WikiEntityLabels = entity.descriptions || {};

        const title =
          labels.fr?.value ||
          labels.en?.value ||
          candidates.find((c) => c.id === id)?.label ||
          "";

        if (!title) return null;

        // Use Wikidata short description (usually "YYYY board game" or similar)
        const description =
          descriptions.fr?.value ||
          descriptions.en?.value ||
          null;

        return {
          bggId: id, // reused field — now stores Wikidata QID
          title,
          thumbnail: getImageUrl(claims),
          description,
          minPlayers: getIntValue(claims, PROPS.MIN_PLAYERS),
          maxPlayers: getIntValue(claims, PROPS.MAX_PLAYERS),
          minAge: getIntValue(claims, PROPS.MIN_AGE),
          yearPublished: getYearPublished(claims),
          category: getCategory(claims),
        };
      })
      .filter(Boolean);

    return NextResponse.json(results);
  } catch (error) {
    console.error("[GET /api/games/bgg-search]", error);
    return NextResponse.json({ error: "Erreur serveur", details: String(error) }, { status: 500 });
  }
}
