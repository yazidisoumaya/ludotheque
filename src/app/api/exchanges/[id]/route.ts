import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["pending", "accepted", "rejected", "completed"];

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await request.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const exchange = await prisma.exchange.update({
    where: { id: parseInt(id) },
    data: { status },
    include: {
      requester: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
      game: true,
    },
  });

  return NextResponse.json(exchange);
}
