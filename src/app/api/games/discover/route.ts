import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const games = await prisma.game.findMany({
      where: userId ? { userId: { not: parseInt(userId) } } : undefined,
      include: {
        user: { select: { id: true, name: true } },
        exchanges: {
          where: { status: { in: ["pending", "accepted"] } },
          select: { id: true, status: true, requester: { select: { id: true, name: true } } },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Flatten: expose activeExchange directly on each game
    // Sort: available games first, games with active exchange last
    const result = games
      .map(({ exchanges, ...game }) => ({
        ...game,
        activeExchange: exchanges[0] ?? null,
      }))
      .sort((a, b) => {
        if (a.activeExchange && !b.activeExchange) return 1;
        if (!a.activeExchange && b.activeExchange) return -1;
        return 0;
      });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/games/discover", error);
    return NextResponse.json({ error: "Erreur serveur", details: String(error) }, { status: 500 });
  }
}
