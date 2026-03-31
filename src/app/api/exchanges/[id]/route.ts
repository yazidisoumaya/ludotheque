import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["pending", "accepted", "rejected", "completed"];

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status, ownerMessage } = await request.json();

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const exchange = await prisma.exchange.update({
      where: { id: parseInt(id) },
      data: {
        status,
        ...(ownerMessage !== undefined && { ownerMessage: ownerMessage?.trim() || null }),
      },
      include: {
        requester: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        game: true,
      },
    });

    // Notification Slack quand le proprio accepte ou refuse
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (webhookUrl && (status === "accepted" || status === "rejected")) {
      const verb = status === "accepted" ? "accepté" : "refusé";
      const emoji = status === "accepted" ? "✅" : "❌";
      let msg = `${emoji} *${exchange.owner.name}* a ${verb} la demande d'emprunt de *${exchange.game.title}* par ${exchange.requester.name}.`;
      if (exchange.ownerMessage) {
        msg += `\n> ${exchange.ownerMessage}`;
      }
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msg }),
      }).catch(() => {});
    }

    return NextResponse.json(exchange);
  } catch (error) {
    console.error("PUT /api/exchanges/[id]", error);
    return NextResponse.json({ error: "Erreur serveur", details: String(error) }, { status: 500 });
  }
}
