import { prisma as prismaInstance } from "@/lib/prisma";

export async function generateUpcomingEvents(prisma: typeof prismaInstance) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const horizon = new Date(today);
  horizon.setUTCDate(horizon.getUTCDate() + 30);

  const targets: Date[] = [];
  const cursor = new Date(today);
  while (cursor <= horizon) {
    const dow = cursor.getUTCDay(); // 0=dim, 1=lun, 2=mar, 4=jeu
    if (dow === 1 || dow === 2 || dow === 4) {
      targets.push(new Date(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  await Promise.all(
    targets.map((date) =>
      prisma.event.upsert({
        where: { date },
        create: { date },
        update: {},
      })
    )
  );
}
