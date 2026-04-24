import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getUserId } from "@/lib/get-user-id";
import { db } from "@/lib/db";
import {
  quizSessions,
  questions,
  attempts,
  userQuestionStats,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sessionId = (await params).id;

    // Validate session
    const session = await db.query.quizSessions.findFirst({
      where: and(eq(quizSessions.id, sessionId), eq(quizSessions.userId, userId)),
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (session.status !== "active") {
      return NextResponse.json({ error: "Session is not active" }, { status: 400 });
    }

    const body = await request.json();
    const { question_id, selected_option_ids } = body;

    if (!question_id || !Array.isArray(selected_option_ids)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Validate question belongs to session
    if (!session.questionIds.includes(question_id)) {
      return NextResponse.json(
        { error: "Question not in this session" },
        { status: 400 }
      );
    }

    // Get correct answer
    const question = await db.query.questions.findFirst({
      where: eq(questions.id, question_id),
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Check answer
    const sortedSelected = [...selected_option_ids].sort();
    const sortedCorrect = [...question.correctOptionIds].sort();
    const isCorrect =
      sortedSelected.length === sortedCorrect.length &&
      sortedSelected.every((id, i) => id === sortedCorrect[i]);

    // Record attempt
    await db.insert(attempts).values({
      id: uuid(),
      userId,
      sessionId,
      questionId: question_id,
      selectedOptionIds: selected_option_ids,
      isCorrect,
    });

    // Update or create user_question_stats
    const existingStat = await db.query.userQuestionStats.findFirst({
      where: and(
        eq(userQuestionStats.userId, userId),
        eq(userQuestionStats.questionId, question_id)
      ),
    });

    if (existingStat) {
      const newStreak = isCorrect ? existingStat.correctStreak + 1 : 0;
      let newStatus = existingStat.status;
      if (newStreak >= 2) newStatus = "mastered";
      else if (isCorrect && existingStat.status === "new") newStatus = "learning";
      else if (!isCorrect) newStatus = "weak";

      await db
        .update(userQuestionStats)
        .set({
          attemptsCount: existingStat.attemptsCount + 1,
          correctCount: existingStat.correctCount + (isCorrect ? 1 : 0),
          wrongCount: existingStat.wrongCount + (isCorrect ? 0 : 1),
          correctStreak: newStreak,
          lastAnsweredAt: new Date(),
          status: newStatus,
        })
        .where(
          and(
            eq(userQuestionStats.userId, userId),
            eq(userQuestionStats.questionId, question_id)
          )
        );
    } else {
      await db.insert(userQuestionStats).values({
        userId,
        questionId: question_id,
        attemptsCount: 1,
        correctCount: isCorrect ? 1 : 0,
        wrongCount: isCorrect ? 0 : 1,
        correctStreak: isCorrect ? 1 : 0,
        lastAnsweredAt: new Date(),
        status: isCorrect ? "learning" : "weak",
      });
    }

    // Update session
    const newScore = session.score + (isCorrect ? 1 : 0);
    const newIndex = session.currentIndex + 1;
    const isComplete = newIndex >= session.total;

    await db
      .update(quizSessions)
      .set({
        score: newScore,
        currentIndex: newIndex,
        status: isComplete ? "completed" : "active",
        completedAt: isComplete ? new Date() : null,
      })
      .where(eq(quizSessions.id, sessionId));

    return NextResponse.json({
      data: {
        isCorrect,
        correctOptionIds: question.correctOptionIds,
        explanationRu: question.explanationRu,
        score: newScore,
        currentIndex: newIndex,
        total: session.total,
        isComplete,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to submit answer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
