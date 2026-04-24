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
  const body = await request.json();
  const { question_id, selected_option_ids } = body as {
    question_id: string;
    selected_option_ids: string[];
  };

  const session = await prisma.quizSession.findFirst({
    where: { id, userId, status: "active" },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const question = await prisma.question.findUnique({
    where: { id: question_id },
  });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const correctIds = (question.correctOptionIds as string[]).sort();
  const selectedIds = selected_option_ids.sort();
  const isCorrect =
    correctIds.length === selectedIds.length &&
    correctIds.every((val, idx) => val === selectedIds[idx]);

  await prisma.attempt.create({
    data: {
      userId,
      sessionId: id,
      questionId: question_id,
      selectedOptionIds: selected_option_ids,
      isCorrect,
    },
  });

  // Update user question stats
  const stat = await prisma.userQuestionStat.findUnique({
    where: { userId_questionId: { userId, questionId: question_id } },
  });

  if (stat) {
    const newCorrectStreak = isCorrect ? stat.correctStreak + 1 : 0;
    const newStatus =
      newCorrectStreak >= 2
        ? "mastered"
        : stat.status === "new"
        ? "learning"
        : stat.status;

    await prisma.userQuestionStat.update({
      where: { userId_questionId: { userId, questionId: question_id } },
      data: {
        attemptsCount: { increment: 1 },
        correctCount: isCorrect ? { increment: 1 } : undefined,
        wrongCount: !isCorrect ? { increment: 1 } : undefined,
        correctStreak: newCorrectStreak,
        lastAnsweredAt: new Date(),
        status: newStatus,
      },
    });
  } else {
    await prisma.userQuestionStat.create({
      data: {
        userId,
        questionId: question_id,
        attemptsCount: 1,
        correctCount: isCorrect ? 1 : 0,
        wrongCount: !isCorrect ? 1 : 0,
        correctStreak: isCorrect ? 1 : 0,
        lastAnsweredAt: new Date(),
        status: isCorrect ? "learning" : "weak",
      },
    });
  }

  // Update session
  const newScore = isCorrect ? session.score + 1 : session.score;
  const newIndex = session.currentIndex + 1;
  const isComplete = newIndex >= session.total;

  await prisma.quizSession.update({
    where: { id },
    data: {
      score: newScore,
      currentIndex: newIndex,
      status: isComplete ? "completed" : "active",
      completedAt: isComplete ? new Date() : undefined,
    },
  });

  return NextResponse.json({
    isCorrect,
    correctOptionIds: question.correctOptionIds,
    score: newScore,
    currentIndex: newIndex,
    total: session.total,
    isComplete,
  });
}
