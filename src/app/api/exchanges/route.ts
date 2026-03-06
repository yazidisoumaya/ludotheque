import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
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
}

export async function POST(request: Request) {
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

  return NextResponse.json(exchange, { status: 201 });
}
