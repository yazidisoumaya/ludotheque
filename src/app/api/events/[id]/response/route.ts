import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["going", "maybe", "absent"] as const;

function formatDate(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

async function sendSlackNotification(text: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  }).catch(() => {});
}

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

    const [response, event] = await Promise.all([
      prisma.eventResponse.upsert({
        where: { eventId_userId: { eventId, userId: parseInt(userId) } },
        create: { eventId, userId: parseInt(userId), status },
        update: { status },
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.event.findUnique({ where: { id: eventId } }),
    ]);

    if (status === "going" && event) {
      await sendSlackNotification(
        `*${response.user.name}* participe à la séance du *${formatDate(new Date(event.date))}* 🎲`
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("POST /api/events/[id]/response", error);
    return NextResponse.json({ error: "Erreur serveur", details: String(error) }, { status: 500 });
  }
}
