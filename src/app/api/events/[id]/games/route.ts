import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const eventId = parseInt(id);
    if (isNaN(eventId)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

    const records = await prisma.eventGame.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true } },
        game: { select: { id: true, title: true } },
      },
    });

    const grouped = new Map<number, { userId: number; userName: string; games: { id: number; title: string }[] }>();
    for (const r of records) {
      if (!grouped.has(r.userId)) {
        grouped.set(r.userId, { userId: r.userId, userName: r.user.name, games: [] });
      }
      grouped.get(r.userId)!.games.push({ id: r.game.id, title: r.game.title });
    }

    return NextResponse.json(Array.from(grouped.values()));
  } catch (error) {
    console.error("GET /api/events/[id]/games", error);
    return NextResponse.json({ error: "Erreur serveur", details: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const eventId = parseInt(id);
    if (isNaN(eventId)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

    const body = await request.json();
    const { userId, gameIds } = body as { userId: number; gameIds: number[] };

    if (!userId) return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    const ids: number[] = Array.isArray(gameIds) ? gameIds : [];

    // Vérifier que les jeux appartiennent bien à cet utilisateur
    if (ids.length > 0) {
      const ownedGames = await prisma.game.findMany({
        where: { id: { in: ids }, userId },
        select: { id: true },
      });
      if (ownedGames.length !== ids.length) {
        return NextResponse.json({ error: "Jeux invalides" }, { status: 400 });
      }
    }

    await prisma.$transaction([
      prisma.eventGame.deleteMany({ where: { eventId, userId } }),
      ...(ids.length > 0
        ? [prisma.eventGame.createMany({ data: ids.map((gameId) => ({ eventId, userId, gameId })) })]
        : []),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/events/[id]/games", error);
    return NextResponse.json({ error: "Erreur serveur", details: String(error) }, { status: 500 });
  }
}
