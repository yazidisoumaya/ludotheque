import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateUpcomingEvents } from "@/lib/generateEvents";

export async function GET() {
  try {
    await generateUpcomingEvents(prisma);

    const events = await prisma.event.findMany({
      orderBy: { date: "asc" },
      include: {
        responses: {
          include: { user: { select: { id: true, name: true } } },
        },
        eventGames: {
          include: {
            user: { select: { id: true, name: true } },
            game: { select: { id: true, title: true } },
          },
        },
      },
    });

    const shaped = events.map((event) => {
      const grouped = new Map<number, { userId: number; userName: string; games: { id: number; title: string }[] }>();
      for (const eg of event.eventGames) {
        if (!grouped.has(eg.userId)) {
          grouped.set(eg.userId, { userId: eg.userId, userName: eg.user.name, games: [] });
        }
        grouped.get(eg.userId)!.games.push({ id: eg.game.id, title: eg.game.title });
      }
      return { ...event, eventGames: Array.from(grouped.values()) };
    });

    return NextResponse.json(shaped);
  } catch (error) {
    console.error("GET /api/events", error);
    return NextResponse.json({ error: "Erreur serveur", details: String(error) }, { status: 500 });
  }
}
