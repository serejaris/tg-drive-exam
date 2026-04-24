import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getUserId(req: NextRequest): string | null {
  return req.cookies.get("session")?.value ?? null;
}

export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { mode, limit } = body as { mode: "practice" | "exam" | "mistakes"; limit?: number };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let questionIds: string[] = [];
  let total = 0;

  if (mode === "mistakes") {
    const weakStats = await prisma.userQuestionStat.findMany({
      where: {
        userId,
        status: { in: ["weak", "learning"] },
      },
      orderBy: { wrongCount: "desc" },
      take: limit ?? 20,
    });
    questionIds = weakStats.map((s) => s.questionId);
    if (questionIds.length === 0) {
      const wrongs = await prisma.attempt.findMany({
        where: { userId, isCorrect: false },
        select: { questionId: true },
        distinct: ["questionId"],
        take: limit ?? 20,
      });
      questionIds = wrongs.map((w) => w.questionId);
    }
    total = questionIds.length;
  } else if (mode === "exam") {
    total = user.examQuestionCount ?? 40;
    const all = await prisma.question.findMany({ select: { id: true } });
    questionIds = shuffleArray(all.map((q) => q.id)).slice(0, total);
  } else {
    total = limit ?? 20;
    const all = await prisma.question.findMany({ select: { id: true } });
    questionIds = shuffleArray(all.map((q) => q.id)).slice(0, total);
  }

  const session = await prisma.quizSession.create({
    data: {
      userId,
      mode,
      status: "active",
      questionIds,
      currentIndex: 0,
      score: 0,
      total,
    },
  });

  return NextResponse.json({ sessionId: session.id, total });
}

function shuffleArray<T>(arr: T[]): T[] {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
