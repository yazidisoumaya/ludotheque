import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  const games = await prisma.game.findMany({
    where: userId ? { userId: parseInt(userId) } : undefined,
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(games);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, description, category, minPlayers, maxPlayers, minAge, userId } = body;

  if (!title?.trim() || !userId) {
    return NextResponse.json({ error: "Titre et utilisateur requis" }, { status: 400 });
  }

  const game = await prisma.game.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      category: category?.trim() || null,
      minPlayers: minPlayers ? parseInt(minPlayers) : null,
      maxPlayers: maxPlayers ? parseInt(maxPlayers) : null,
      minAge: minAge ? parseInt(minAge) : null,
      userId: parseInt(userId),
    },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(game, { status: 201 });
}
