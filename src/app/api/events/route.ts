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
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("GET /api/events", error);
    return NextResponse.json({ error: "Erreur serveur", details: String(error) }, { status: 500 });
  }
}
