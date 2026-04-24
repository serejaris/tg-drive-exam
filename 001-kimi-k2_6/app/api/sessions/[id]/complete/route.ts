import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getUserId(req: NextRequest): string | null {
  return req.cookies.get("session")?.value ?? null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const session = await prisma.quizSession.findFirst({
    where: { id, userId },
    include: { attempts: { include: { question: true } } },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const percentage =
    session.total > 0 ? Math.round((session.score / session.total) * 100) : 0;
  const threshold = 75; // PRD default; could be loaded from config
  const passed = percentage >= threshold;

  const wrongAttempts = session.attempts.filter((a) => !a.isCorrect);
  const wrongQuestions = wrongAttempts.map((a) => ({
    id: a.question.id,
    questionEs: a.question.questionEs,
    questionRu: a.question.questionRu,
    correctOptionIds: a.question.correctOptionIds,
  }));

  if (session.status !== "completed") {
    await prisma.quizSession.update({
      where: { id },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    });
  }

  return NextResponse.json({
    sessionId: session.id,
    mode: session.mode,
    score: session.score,
    total: session.total,
    percentage,
    passed,
    wrongQuestions,
  });
}
