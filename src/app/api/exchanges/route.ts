import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const where = userId
      ? {
          OR: [
            { requesterId: parseInt(userId) },
            { ownerId: parseInt(userId) },
          ],
        }
      : undefined;

    const exchanges = await prisma.exchange.findMany({
      where,
      include: {
        requester: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        game: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(exchanges);
  } catch (error) {
    console.error("GET /api/exchanges", error);
    return NextResponse.json({ error: "Erreur serveur", details: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requesterId, ownerId, gameId, message } = body;

    if (!requesterId || !ownerId || !gameId) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    if (requesterId === ownerId) {
      return NextResponse.json({ error: "Vous ne pouvez pas échanger avec vous-même" }, { status: 400 });
    }

    const exchange = await prisma.exchange.create({
      data: {
        requesterId: parseInt(requesterId),
        ownerId: parseInt(ownerId),
        gameId: parseInt(gameId),
        message: message?.trim() || null,
        status: "pending",
      },
      include: {
        requester: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        game: true,
      },
    });

    // Notification Slack au propriétaire du jeu
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (webhookUrl) {
      const msg = exchange.message
        ? `*${exchange.requester.name}* aimerait emprunter *${exchange.game.title}* à ${exchange.owner.name} :\n> ${exchange.message}`
        : `*${exchange.requester.name}* aimerait emprunter *${exchange.game.title}* à ${exchange.owner.name}.`;
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msg }),
      }).catch(() => {});
    }

    return NextResponse.json(exchange, { status: 201 });
  } catch (error) {
    console.error("POST /api/exchanges", error);
    return NextResponse.json({ error: "Erreur serveur", details: String(error) }, { status: 500 });
  }
}
