import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getUserId(req: NextRequest): string | null {
  return req.cookies.get("session")?.value ?? null;
}

export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") as "practice" | "exam" | "mistakes" | null;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 20;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let questionIds: string[] = [];

  if (mode === "mistakes") {
    const weakStats = await prisma.userQuestionStat.findMany({
      where: {
        userId,
        status: { in: ["weak", "learning"] },
      },
      orderBy: { wrongCount: "desc" },
      take: limit,
    });
    questionIds = weakStats.map((s) => s.questionId);
    if (questionIds.length === 0) {
      // Fallback: any questions answered incorrectly at least once
      const wrongs = await prisma.attempt.findMany({
        where: { userId, isCorrect: false },
        select: { questionId: true },
        distinct: ["questionId"],
        take: limit,
      });
      questionIds = wrongs.map((w) => w.questionId);
    }
  } else if (mode === "exam") {
    const count = user.examQuestionCount ?? 40;
    const allQuestions = await prisma.question.findMany({ select: { id: true } });
    questionIds = shuffleArray(allQuestions.map((q) => q.id)).slice(0, count);
  } else {
    // practice: random sample
    const allQuestions = await prisma.question.findMany({ select: { id: true } });
    questionIds = shuffleArray(allQuestions.map((q) => q.id)).slice(0, limit);
  }

  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    include: { options: true },
  });

  // Preserve shuffled order and also shuffle options per PRD
  const ordered = questionIds
    .map((id) => questions.find((q) => q.id === id))
    .filter(Boolean) as any[];

  const payload = ordered.map((q) => ({
    id: q.id,
    category: q.category,
    questionEs: q.questionEs,
    questionRu: q.questionRu,
    type: q.type,
    media: q.media,
    options: shuffleArray(q.options).map((opt: any) => ({
      id: opt.optionId,
      textEs: opt.textEs,
      textRu: opt.textRu,
    })),
    explanationRu: q.explanationRu,
  }));

  return NextResponse.json({ questions: payload });
}

function shuffleArray<T>(arr: T[]): T[] {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
