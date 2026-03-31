import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["going", "maybe", "absent"] as const;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const eventId = parseInt(id);
    if (isNaN(eventId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const body = await request.json();
    const { userId, status } = body;

    if (!userId || !status) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const response = await prisma.eventResponse.upsert({
      where: { eventId_userId: { eventId, userId: parseInt(userId) } },
      create: { eventId, userId: parseInt(userId), status },
      update: { status },
      include: { user: { select: { id: true, name: true } } },
    });

    // Notif Slack uniquement si "Je participe" sur la prochaine séance
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (webhookUrl && status === "going") {
      const now = new Date();
      now.setUTCHours(0, 0, 0, 0);
      const nextEvent = await prisma.event.findFirst({
        where: { date: { gte: now } },
        orderBy: { date: "asc" },
      });
      if (nextEvent && nextEvent.id === eventId) {
        const formattedDate = new Date(nextEvent.date).toLocaleDateString("fr-FR", {
          weekday: "long", day: "numeric", month: "long",
        });
        fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: `*${response.user.name}* participe à la séance de *${formattedDate}* 🎲` }),
        }).catch(() => {});
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("POST /api/events/[id]/response", error);
    return NextResponse.json({ error: "Erreur serveur", details: String(error) }, { status: 500 });
  }
}
