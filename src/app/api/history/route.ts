import { NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail("Нужно войти", 401);
  const [recent, totals] = await Promise.all([
    prisma.attempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, kind: true, levelId: true, dayKey: true, score: true, stars: true, won: true, throwsUsed: true, knocked: true, createdAt: true },
    }),
    prisma.attempt.aggregate({
      where: { userId: user.id },
      _count: { _all: true },
      _sum: { knocked: true, throwsUsed: true },
    }),
  ]);
  const wins = await prisma.attempt.count({ where: { userId: user.id, won: true } });
  return NextResponse.json({
    recent,
    totals: {
      rounds: totals._count._all,
      wins,
      knocked: totals._sum.knocked ?? 0,
      throws: totals._sum.throwsUsed ?? 0,
    },
  });
}
