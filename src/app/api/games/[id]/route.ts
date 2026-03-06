import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const game = await prisma.game.findUnique({
      where: { id: parseInt(id) },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!game) return NextResponse.json({ error: "Jeu introuvable" }, { status: 404 });
    return NextResponse.json(game);
  } catch (error) {
    console.error("GET /api/games/[id]", error);
    return NextResponse.json({ error: "Erreur serveur", details: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, category, minPlayers, maxPlayers, minAge } = body;

    const game = await prisma.game.update({
      where: { id: parseInt(id) },
      data: {
        title: title?.trim(),
        description: description?.trim() || null,
        category: category?.trim() || null,
        minPlayers: minPlayers ? parseInt(minPlayers) : null,
        maxPlayers: maxPlayers ? parseInt(maxPlayers) : null,
        minAge: minAge ? parseInt(minAge) : null,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error("PUT /api/games/[id]", error);
    return NextResponse.json({ error: "Erreur serveur", details: String(error) }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.game.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/games/[id]", error);
    return NextResponse.json({ error: "Erreur serveur", details: String(error) }, { status: 500 });
  }
}
