import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
  }
  const user = await prisma.user.create({ data: { name: name.trim() } });
  return NextResponse.json(user, { status: 201 });
}
